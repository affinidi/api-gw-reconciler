import { CfnOutput, Duration, Stack } from 'aws-cdk-lib'
import { IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { AccountPrincipal, Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications'
import { Construct } from 'constructs'
import {
  API_GW_MERGED_OPENAPI_BUCKET_ARN,
  API_GW_MERGED_OPENAPI_BUCKET_NAME,
  API_GW_OPENAPI_DOCS_LAMBDA_ARN,
  API_GW_OPENAPI_REDOC_LAMBDA_ARN,
  API_GW_RECONCILER_BUCKET_ARN,
  API_GW_RECONCILER_BUCKET_NAME,
  API_GW_RECONCILER_LAMBDA_ARN,
  DEFAULT_MERGED_OPENAPI_PATH,
  DEFAULT_SECURITY_SCHEMA_PATH,
  DEFAULT_OPENAPI_INFO_METADATA_KEY,
  LAMBDA_TIMEOUT_IN_SECONDS,
  S3_BUCKET_PROPS,
  DEFAULT_HEADER_SCHEMA,
  DEFAULT_API_DOC_PATH_PREFIX,
} from './constants'
import { OpenAPIDefinitionHeader } from './types'

/**
 * aws account id to api path prefix mapping
 */
export interface IAPIGWReconcilerallowedAccount {
  /**
   * Account Id of service under API path prefix
   */
  id: string
  /**
   * API path prefix allowed for given account `id`
   */
  allowedApiPathPrefix: string
}

export interface IAPIGWReconcilerProps {
  /**
   * restAPI managed by reconciler
   *
   */
  restAPI: IRestApi

  allowedAccounts: IAPIGWReconcilerallowedAccount[]
  /**
   * security schema path
   * this schema configures authorizers in API gw
   * @default "iam/openapi.json"
   */
  securitySchemaPath?: string
  /**
   * Key in service openapi schema under info key.
   *
   * @default 'x-reconciler'
   */
  openapiInfoMetadataKey?: string
  /**
   *
   * Simple authentication token to keep your apidoc somewhat private
   * @default ''
   */
  apiDocSimpleAuthToken?: string

  /**
   * path prefix for api doc
   * @default 'api-docs'
   */
  apiDocPathPrefix?: string

  /**
   * Default schema, defines title, description, version
   */
  openapiHeader?: OpenAPIDefinitionHeader
}

/**
 * AWS API GW reconciler
 *
 * reconciler merges openapi schemas from services and updates central API gw with result schemas
 */
export class APIGWReconciler extends Construct {
  public readonly openApiDefinitionBucket: Bucket
  public readonly reconcilerLambda: NodejsFunction
  public readonly openapiDocsLambda: NodejsFunction
  public readonly redocLambda: NodejsFunction
  public readonly mergedOpenapiBucket: Bucket

  public readonly openapiInfoMetadataKey: string = DEFAULT_OPENAPI_INFO_METADATA_KEY

  constructor(scope: Stack, id: string, props: IAPIGWReconcilerProps) {
    super(scope, id)

    const restApiId = props.restAPI?.restApiId

    const restApi = RestApi.fromRestApiId(this, 'RestApiGW', restApiId)

    this.openApiDefinitionBucket = new Bucket(this, 'OpenAPIDefinitionBucket', S3_BUCKET_PROPS)

    this.mergedOpenapiBucket = new Bucket(this, 'MergedOpenAPIDefinitionBucket', S3_BUCKET_PROPS)

    this.openapiDocsLambda = new NodejsFunction(this, 'APIGWOpenapiDocsLambda', {
      description: 'Lambda that returns swagger file on request',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      environment: {
        MERGED_OPENAPI_BUCKET: this.mergedOpenapiBucket.bucketName,
        MERGED_OPENAPI_PATH: DEFAULT_MERGED_OPENAPI_PATH,
        API_DOC_SIMPLE_AUTH_TOKEN: props.apiDocSimpleAuthToken || '',
      },
    })
    this.openapiDocsLambda.addPermission('PermitAPIGInvocation', {
      principal: new ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: restApi.arnForExecuteApi('*'),
    })
    this.redocLambda = new NodejsFunction(this, 'APIGWOpenapiRedocLambda', {
      description: 'Lambda that returns ReDoc HTML page on request',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      timeout: Duration.millis(LAMBDA_TIMEOUT_IN_SECONDS),
      environment: {
        REST_API_ID: restApiId,
        REGION: scope.region,
        //TODO: remove hardcoded dev and path
        OPENAPI_URL: '/' + (props.apiDocPathPrefix ?? DEFAULT_API_DOC_PATH_PREFIX),
      },
    })
    this.redocLambda.addPermission('PermitAPIGInvocationRedoc', {
      principal: new ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: restApi.arnForExecuteApi('*'),
    })

    this.mergedOpenapiBucket.grantRead(this.openapiDocsLambda)

    this.reconcilerLambda = new NodejsFunction(this, 'APIGWReconcilerLambda', {
      description: 'Reconciler Lambda that gets triggered to update the API GW',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      reservedConcurrentExecutions: 1,
      timeout: Duration.millis(LAMBDA_TIMEOUT_IN_SECONDS),
      environment: {
        OPEN_API_LAMBDA_NAME: this.openapiDocsLambda.functionArn,
        REDOC_LAMBDA_NAME: this.redocLambda.functionArn,
        OPENAPI_DEFINITION_BUCKET: this.openApiDefinitionBucket.bucketName,
        OPENAPI_INFO_METADATA_KEY: this.openapiInfoMetadataKey,
        REST_API_ID: restApiId,
        REGION: scope.region,
        SECURITY_SCHEMA_PATH: props.securitySchemaPath ?? DEFAULT_SECURITY_SCHEMA_PATH,
        MERGED_OPENAPI_BUCKET: this.mergedOpenapiBucket.bucketName,
        MERGED_OPENAPI_PATH: DEFAULT_MERGED_OPENAPI_PATH,
      },
    })

    this.reconcilerLambda.addToRolePolicy(
      new PolicyStatement({
        sid: 'AllowReconcilerToModifyRestAPI',
        actions: ['apigateway:*'],
        effect: Effect.ALLOW,
        resources: [
          //TODO test which policy is needed
          `arn:${scope.partition}:apigateway:${scope.region}::/apis/${restApiId}`,
          `arn:${scope.partition}:apigateway:${scope.region}::/apis/${restApiId}/*`,
          `arn:${scope.partition}:apigateway:${scope.region}::/restapis/${restApiId}`,
          `arn:${scope.partition}:apigateway:${scope.region}::/restapis/${restApiId}/*`,
        ],
      }),
    )

    this.mergedOpenapiBucket.grantWrite(this.reconcilerLambda)

    this.openApiDefinitionBucket.grantReadWrite(this.reconcilerLambda)

    const policyActions = [
      's3:DeleteObject',
      's3:DeleteObjectTagging',
      's3:PutObject',
      's3:GetBucketLocation',
      's3:GetObject',
      's3:ListBucket',
    ]

    if (props.allowedAccounts) {
      props.allowedAccounts.map((a) =>
        this.openApiDefinitionBucket.addToResourcePolicy(
          new PolicyStatement({
            actions: policyActions,
            effect: Effect.ALLOW,
            principals: [new AccountPrincipal(a.id)],
            resources: [
              this.openApiDefinitionBucket.bucketArn,
              this.openApiDefinitionBucket.arnForObjects(`${a.allowedApiPathPrefix}/*`),
            ],
          }),
        ),
      )
    }

    const openapiHeaderSchema = props.openapiHeader ?? DEFAULT_HEADER_SCHEMA
    openapiHeaderSchema.info[this.openapiInfoMetadataKey] = { pathPrefix: 'openapi' }

    new BucketDeployment(this, 'headerSchema', {
      destinationBucket: this.openApiDefinitionBucket,
      destinationKeyPrefix: 'openapi',
      sources: [Source.jsonData('header.json', openapiHeaderSchema)],
      prune: false,
    })

    this.openApiDefinitionBucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(this.reconcilerLambda),
    )
    this.openApiDefinitionBucket.addEventNotification(
      EventType.OBJECT_REMOVED,
      new LambdaDestination(this.reconcilerLambda),
    )

    new CfnOutput(this, API_GW_RECONCILER_BUCKET_NAME, {
      value: this.openApiDefinitionBucket.bucketName,
    })
    new CfnOutput(this, API_GW_RECONCILER_BUCKET_ARN, {
      value: this.openApiDefinitionBucket.bucketArn,
    })
    new CfnOutput(this, API_GW_MERGED_OPENAPI_BUCKET_NAME, {
      value: this.mergedOpenapiBucket.bucketName,
    })
    new CfnOutput(this, API_GW_MERGED_OPENAPI_BUCKET_ARN, {
      value: this.mergedOpenapiBucket.bucketArn,
    })
    new CfnOutput(this, API_GW_RECONCILER_LAMBDA_ARN, { value: this.reconcilerLambda.functionArn })
    new CfnOutput(this, API_GW_OPENAPI_DOCS_LAMBDA_ARN, {
      value: this.openapiDocsLambda.functionArn,
    })
    new CfnOutput(this, API_GW_OPENAPI_REDOC_LAMBDA_ARN, { value: this.redocLambda.functionArn })
  }
}
