import { RemovalPolicy } from 'aws-cdk-lib'
import { BucketAccessControl, BlockPublicAccess, ObjectOwnership } from 'aws-cdk-lib/aws-s3'
import { OpenAPIDefinitionHeader } from './types'

export const API_GW_RECONCILER_BUCKET_NAME = 'API_GW_RECONCILER_BUCKET_NAME'
export const API_GW_RECONCILER_BUCKET_ARN = 'API_GW_RECONCILER_BUCKET_ARN'
export const API_GW_MERGED_OPENAPI_BUCKET_NAME = 'API_GW_MERGED_OPENAPI_BUCKET_NAME'
export const API_GW_MERGED_OPENAPI_BUCKET_ARN = 'API_GW_MERGED_OPENAPI_BUCKET_ARN'
export const API_GW_RECONCILER_LAMBDA_ARN = 'API_GW_RECONCILER_LAMBDA_ARN'
export const API_GW_OPENAPI_DOCS_LAMBDA_ARN = 'API_GW_OPENAPI_DOCS_LAMBDA_ARN'
export const API_GW_OPENAPI_REDOC_LAMBDA_ARN = 'API_GW_OPENAPI_REDOC_LAMBDA_ARN'

export const HTTP_STATUS_FORBIDDEN = 403
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500

export const DEFAULT_MERGED_OPENAPI_PATH = 'openapi/swagger.json'
export const DEFAULT_SECURITY_SCHEMA_PATH = 'iam/openapi.json'
export const DEFAULT_OPENAPI_INFO_METADATA_KEY = 'x-reconciler'

export const LOG_JSON_IDENT = 4
export const MINIMUM_PREFIX_LENGHT = 3
export const RECONCILER_LAMBDA_TIMEOUT_IN_SECONDS = 30
export const OPENAPI_DOCS_LAMBDA_TIMEOUT_IN_SECONDS = 15

export const DEFAULT_HEADER_SCHEMA_PATH = 'openapi/header.json'

export const S3_BUCKET_PROPS = {
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
  accessControl: BucketAccessControl.PRIVATE,
  blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
  objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
  enforceSSL: true,
}

export const DEFAULT_HEADER_SCHEMA: OpenAPIDefinitionHeader = {
  info: {
    title: 'central-api-managed-api-gw',
    version: '1.0.0',
    description: 'Central API GW',
  },
}

export const DEFAULT_API_DOC_PATH_PREFIX = `api-docs`
