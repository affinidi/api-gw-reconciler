import type { LambdaInterface } from '@aws-lambda-powertools/commons'
import { Logger } from '@aws-lambda-powertools/logger'

import {
  APIGatewayClient,
  PutRestApiCommand,
  CreateDeploymentCommand,
} from '@aws-sdk/client-api-gateway'
import {
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
  _Object as S3Object,
} from '@aws-sdk/client-s3'
import { Swagger } from 'atlassian-openapi'
import { S3Event } from 'aws-lambda'
import { merge as OpenAPImerge, isErrorResult, MergeInput } from 'openapi-merge'
import { SingleMergeInput } from 'openapi-merge/dist/data'
import {
  DEFAULT_HEADER_SCHEMA_PATH,
  DEFAULT_MERGED_OPENAPI_PATH,
  DEFAULT_OPENAPI_INFO_METADATA_KEY,
  LOG_JSON_IDENT,
  MINIMUM_PREFIX_LENGHT,
} from './constants'
import { OpenAPIDefinitionHeader } from './types'

export type OpenAPIDefinition = Swagger.SwaggerV3 & OpenAPIDefinitionHeader

export interface SwaggerV3WithAWSExtensions extends OpenAPIDefinition {
  'x-amazon-apigateway-gateway-responses': {
    [key: string]: any
  }
  'x-tagGroups': {
    name: string
    tags: string[]
  }[]
}

const OPENAPI_DEFINITION_BUCKET = process.env.OPENAPI_DEFINITION_BUCKET
const MERGED_OPENAPI_BUCKET = process.env.MERGED_OPENAPI_BUCKET
const OPENAPI_INFO_METADATA_KEY =
  process.env.OPENAPI_INFO_METADA_KEY ?? DEFAULT_OPENAPI_INFO_METADATA_KEY
const REGION = process.env.REGION
const OPEN_API_LAMBDA_NAME = process.env.OPEN_API_LAMBDA_NAME
const REDOC_LAMBDA_NAME = process.env.REDOC_LAMBDA_NAME

const REST_API_ID = process.env.REST_API_ID
const SECURITY_SCHEMA_PATH = process.env.SECURITY_SCHEMA_PATH
const MERGED_OPENAPI_PATH = process.env.MERGED_OPENAPI_PATH || DEFAULT_MERGED_OPENAPI_PATH
const HEADER_SCHEMA_PATH = process.env.HEADER_SCHEMA_PATH || DEFAULT_HEADER_SCHEMA_PATH

export class ReconcileAPIGWLambda implements LambdaInterface {
  constructor(
    private readonly logger: Logger = new Logger({
      logLevel: 'INFO',
      serviceName: ReconcileAPIGWLambda.name,
    }),
    private readonly s3Client: S3Client = new S3Client({}),
    private readonly apiGatewayClient: APIGatewayClient = new APIGatewayClient({}),
    /**
     * security schemas (Api gw authorizers are expected to be loaded from this path)
     * All other security schemas will be ignored
     */
    private readonly securitySchemaPath = SECURITY_SCHEMA_PATH,
    private readonly headerSchemaPath = HEADER_SCHEMA_PATH,
    private readonly openapiInfoMetadataKey: string = OPENAPI_INFO_METADATA_KEY ??
      DEFAULT_OPENAPI_INFO_METADATA_KEY,
  ) {}

  async handler(_: S3Event): Promise<SwaggerV3WithAWSExtensions> {
    const listObjectsResult = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: OPENAPI_DEFINITION_BUCKET,
      }),
    )

    const openapiServiceS3Objects =
      listObjectsResult.Contents?.filter(
        (o) =>
          o.Key?.endsWith('openapi.json') &&
          ![this.securitySchemaPath, this.headerSchemaPath].includes(o.Key),
      ) || []

    this.logger.info('listed objects', { listObjectsResult })

    // TODO: refactor to get only with some predefined concurrency
    const serviceDefinitions = (
      await Promise.all(
        openapiServiceS3Objects.map(async (object) => {
          try {
            return await this.retrieveOpenAPIDefinition(object)
          } catch (err) {
            this.logger.error(`could not retrieve key '${object.Key}': ${(err as any).message}`, {
              err,
            })
            throw Error(`could not retrieve key '${object.Key}': ${(err as any).message}`)
          }
        }),
      )
    )
      // TODO: completely filtering problematic OpenAPI definitions could result in situations where a single mistake in service, wiping out all API endpoints
      .filter((x): x is OpenAPIDefinition => x !== undefined)

    const securityDefinition = await this.retrieveOpenAPIDefinition({
      Key: this.securitySchemaPath,
    } as S3Object)

    const headDefinition = await this.retrieveOpenAPIDefinition({
      Key: this.headerSchemaPath,
    } as S3Object)

    let definition: SwaggerV3WithAWSExtensions = this.merge(
      securityDefinition,
      headDefinition,
      serviceDefinitions,
    )

    await this.updateAPIGW(definition)
    await this.updateMergedOpenApiInBucket(definition)

    return definition
  }
  // https://github.com/robertmassaioli/openapi-merge/blob/68fb5f28a5c9089b5c823dfdbb38d4c5f91349e5/packages/openapi-merge/src/paths-and-components.ts#L255
  public merge(
    securityDefinition: OpenAPIDefinition,
    headDefinition: OpenAPIDefinition,
    definitions: OpenAPIDefinition[],
  ): SwaggerV3WithAWSExtensions {
    if (!securityDefinition.components?.securitySchemes) {
      throw new Error(`Security schema is not defined in ${this.securitySchemaPath}`)
    }

    if (Object.keys(securityDefinition.components.securitySchemes).length === 0) {
      throw new Error(`Security schema must include at least 1 object ${this.securitySchemaPath}`)
    }

    const tagGroups = definitions.map((definition) => {
      const name = definition.info.title
      const tags = this.collectTagsFromDefinition(definition)
      return { name, tags }
    })

    const headerMerge: SingleMergeInput = { oas: headDefinition }
    const securityDefinitionMerge: SingleMergeInput = {
      oas: securityDefinition,
      //If securityDefinition has components, we treat it as any other schema
      pathModification: {
        prepend: securityDefinition.info[this.openapiInfoMetadataKey].pathPrefix,
      },
      dispute: {
        prefix: securityDefinition.info[this.openapiInfoMetadataKey].pathPrefix,
        alwaysApply: true,
      },
    }

    let mergeInputArray: MergeInput = definitions.map((d) => {
      const prefix = d.info[this.openapiInfoMetadataKey].pathPrefix
      const input: SingleMergeInput = {
        oas: d,
        pathModification: { prepend: prefix },
        dispute: {
          prefix,
          alwaysApply: true,
        },
      }
      return input
    })
    const mergeResult = OpenAPImerge([headerMerge, securityDefinitionMerge, ...mergeInputArray])

    if (isErrorResult(mergeResult)) {
      throw new Error(`${mergeResult.message} (${mergeResult.type})`)
    } else {
      this.logger.info('Merge Success!')
    }

    const definition = mergeResult.output as SwaggerV3WithAWSExtensions
    definition['x-tagGroups'] = tagGroups
    this.logger.debug(JSON.stringify({ 'merged definition': definition }, null, LOG_JSON_IDENT))

    const definitionWithDoc = this.addErroHandling(this.addDocumentationEndpoints(definition))

    return definitionWithDoc
  }

  addErroHandling(definition: SwaggerV3WithAWSExtensions) {
    definition['x-amazon-apigateway-gateway-responses'] = {
      ...definition?.['x-amazon-apigateway-gateway-responses'],
      BAD_REQUEST_BODY: {
        responseTemplates: {
          ['application/json']:
            '{"name": "BadRequestError", "code": "APIERR-1", "debugId": "$context.extendedRequestId", "message": "Your request was not accepted by the API GW because it does not match the OpenAPI spec", "details": [{"issue":"$context.error.validationErrorString"}] }',
        },
      },
      AUTHORIZER_CONFIGURATION_ERROR: {
        statusCode: 403,
        responseTemplates: {
          ['application/json']:
            '{"name": "NoAuthorizationError", "code": "APIERR-2", "debugId": "$context.extendedRequestId", "message": "No JWT token is present in request headers" }',
        },
      },
    }

    return definition
  }

  addDocumentationEndpoints(definition: SwaggerV3WithAWSExtensions) {
    return {
      ...definition,
      paths: {
        ...definition.paths,
        ...{
          '/api-docs': {
            get: {
              'x-amazon-apigateway-integration': {
                uri: `arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${OPEN_API_LAMBDA_NAME}/invocations`,
                passthroughBehavior: 'when_no_match',
                httpMethod: 'POST',
                type: 'aws_proxy',
              },
              responses: {
                default: {
                  description: 'Default response for /api-docs',
                },
              },
            },
          } as any,
          '/api-docs/ui': {
            get: {
              'x-amazon-apigateway-integration': {
                uri: `arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${REDOC_LAMBDA_NAME}/invocations`,
                passthroughBehavior: 'when_no_match',
                httpMethod: 'POST',
                type: 'aws_proxy',
              },
              responses: {
                default: {
                  description: 'Default response for /api-docs/ui',
                },
              },
            },
          } as any,
        },
      },
    }
  }

  async updateAPIGW(definition: SwaggerV3WithAWSExtensions) {
    // limitrate : 1 req per second per account
    const command = new PutRestApiCommand({
      restApiId: REST_API_ID,
      mode: 'overwrite',
      // TODO: look into 6mb body limit
      body: Buffer.from(JSON.stringify(definition)),
    })

    const putRestApiResult = await this.apiGatewayClient.send(command)

    this.logger.info('put rest api succeeded', { putRestApiResult })

    const createDeploymentResult = await this.apiGatewayClient.send(
      new CreateDeploymentCommand({
        restApiId: REST_API_ID,
        stageName: 'dev',
      }),
    )

    this.logger.info('deployment created', { createDeploymentResult })
  }

  async retrieveOpenAPIDefinition(object: S3Object): Promise<OpenAPIDefinition> {
    const getObjectResult = await this.s3Client
      .send(new GetObjectCommand({ Bucket: OPENAPI_DEFINITION_BUCKET, Key: object.Key }))
      .catch((e) => {
        throw new Error(`Cannot retrieve ${object.Key}: ${e}`)
      })
      .then((r) => r)
    const objectBody = await getObjectResult.Body?.transformToString()
    // TODO: JSON parse can also fail as well
    if (!objectBody) {
      throw new Error('Cannot retrieve obj definition')
    }
    const openAPIDefinition = JSON.parse(objectBody)

    if (!openAPIDefinition?.info?.[this.openapiInfoMetadataKey]) {
      throw new Error(`does not contain '.info['${this.openapiInfoMetadataKey}']'`)
    }

    //TODO: allow nested paths (?)
    const s3keyPrefix: string = object.Key?.split('/')[0] || ''
    const pathPrefix: string =
      openAPIDefinition?.info?.[this.openapiInfoMetadataKey].pathPrefix || ''

    if (s3keyPrefix.length < MINIMUM_PREFIX_LENGHT || pathPrefix.length < MINIMUM_PREFIX_LENGHT) {
      throw new Error(
        `pathPrefix or s3keyPrefix shorter then 3 chars: ${pathPrefix}, ${s3keyPrefix} `,
      )
    }

    if (!isAlphaNumeric(s3keyPrefix) && !isAlphaNumeric(pathPrefix)) {
      throw new Error(
        `pathPrefix or s3keyPrefix are not AlphaNumeric: ${pathPrefix}, ${s3keyPrefix} `,
      )
    }
    if (!s3keyPrefix.startsWith(pathPrefix)) {
      throw new Error(`s3key should start with pathPrefix: ${s3keyPrefix} vs ${pathPrefix}`)
    }
    return openAPIDefinition
  }

  private updateMergedOpenApiInBucket(definition: SwaggerV3WithAWSExtensions) {
    const command = new PutObjectCommand({
      Bucket: MERGED_OPENAPI_BUCKET,
      Body: Buffer.from(JSON.stringify(swaggerize(definition))),
      Key: MERGED_OPENAPI_PATH,
    })

    return this.s3Client.send(command)
  }

  private collectTagsFromDefinition(definition: OpenAPIDefinition): string[] {
    const tags = new Set<string>()
    Object.values(definition.paths).forEach((pathItem: Swagger.PathItem) => {
      Object.values(pathItem).forEach((operation: Swagger.Operation) => {
        if (operation.tags) {
          operation.tags.forEach((tag: string) => {
            tags.add(tag)
          })
        }
      })
    })
    return Array.from(tags)
  }
}

const isAlphaNumeric = (s: string) => /^[a-z0-9]+$/i.test(s)

const swaggerizePathKey = (pathKey: string): string =>
  pathKey.startsWith('/') ? pathKey : `/${pathKey}`

// to make it beautiful for swagger consumers
const swaggerize = (definition: SwaggerV3WithAWSExtensions): SwaggerV3WithAWSExtensions => ({
  ...definition,
  paths: Object.entries(definition.paths).reduce(
    (res, [k, v]) => ({ ...res, [swaggerizePathKey(k)]: v }),
    {},
  ),
})

const lambda = new ReconcileAPIGWLambda()

export const handler = (event: S3Event): Promise<SwaggerV3WithAWSExtensions> =>
  lambda.handler(event)
