import type { LambdaInterface } from '@aws-lambda-powertools/commons'
import { Logger } from '@aws-lambda-powertools/logger'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_FORBIDDEN } from './constants'

const OPENAPI_URL = process.env.OPENAPI_URL
const API_DOC_SIMPLE_AUTH_TOKEN = process.env.API_DOC_SIMPLE_AUTH_TOKEN || ''

const redocHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>ReDoc</title>
      <!-- needed for adaptive design -->
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
      <style>
        body {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <redoc spec-url='${OPENAPI_URL}?token=${API_DOC_SIMPLE_AUTH_TOKEN}'></redoc>
      <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
    </body>
  </html>
`

export class RedocLambda implements LambdaInterface {
  constructor(
    private readonly logger: Logger = new Logger({
      logLevel: 'INFO',
      serviceName: RedocLambda.name,
    }),
  ) {}

  async handler(request: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    if (request.queryStringParameters?.token !== API_DOC_SIMPLE_AUTH_TOKEN) {
      return {
        statusCode: 403,
        body: JSON.stringify({ httpStatusCode: HTTP_STATUS_FORBIDDEN, message: 'Forbidden' }),
      }
    }

    try {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
        },
        body: redocHtml,
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

const lambda = new RedocLambda()

export const handler = (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> =>
  lambda.handler(event)
