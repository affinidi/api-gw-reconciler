import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_FORBIDDEN } from './constants'

const MERGED_OPENAPI_BUCKET = process.env.MERGED_OPENAPI_BUCKET
const MERGED_OPENAPI_PATH = process.env.MERGED_OPENAPI_PATH || 'openapi/swagger.json'
const API_DOC_SIMPLE_AUTH_TOKEN = process.env.API_DOC_SIMPLE_AUTH_TOKEN || ''

export class ReconcileAPIGWLambda implements LambdaInterface {
  private static removeAmazonApiGatewayProperties(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(ReconcileAPIGWLambda.removeAmazonApiGatewayProperties)
    }

    const cleanedObj: any = {}

    for (const key in obj) {
      if (!key.startsWith('x-amazon-apigateway')) {
        const cleanedValue = ReconcileAPIGWLambda.removeAmazonApiGatewayProperties(obj[key])
        cleanedObj[key] = cleanedValue
      }
    }

    return cleanedObj
  }
  constructor(
    private readonly logger: Logger = new Logger({
      logLevel: 'INFO',
      serviceName: ReconcileAPIGWLambda.name,
    }),
    private readonly s3Client: S3Client = new S3Client({}),
  ) {}
  async handler(request: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    if (request.queryStringParameters?.token !== API_DOC_SIMPLE_AUTH_TOKEN) {
      return {
        statusCode: 403,
        body: JSON.stringify({ httpStatusCode: HTTP_STATUS_FORBIDDEN, message: 'Forbidden' }),
      }
    }

    try {
      const objectResponse = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: MERGED_OPENAPI_BUCKET,
          Key: MERGED_OPENAPI_PATH,
        }),
      )

      const responseBody = (await objectResponse.Body?.transformToString('utf8')) ?? ''
      this.logger.info('responseBody', { responseBody })
      const parsedObject = JSON.parse(responseBody)

      // Remove sensitive information from the object
      const cleanedObject = ReconcileAPIGWLambda.removeAmazonApiGatewayProperties(parsedObject)

      // Stringify the cleaned object back into a JSON string
      const cleanedJson = JSON.stringify(cleanedObject)
      return {
        statusCode: 200,
        body: cleanedJson,
      }
    } catch (e) {
      this.logger.error('error', { e })
      return {
        statusCode: 500,
        body: JSON.stringify({
          httpStatusCode: HTTP_STATUS_INTERNAL_SERVER_ERROR,
          message: 'Internal Server Error',
        }),
      }
    }
  }
}

const lambda = new ReconcileAPIGWLambda()

export const handler = (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> =>
  lambda.handler(event)
