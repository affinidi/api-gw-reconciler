/**
 * This file for local testing. 
 * Example:
 * cdk deploy --app 'npx ts-node test/fixture.stack.ts'
 */

/* eslint-disable no-duplicate-imports */
/// !cdk-integ IntegrationTestStack
// eslint-disable-next-line import/no-extraneous-dependencies
import 'source-map-support/register'

import { App, Aspects, Aws, CfnResource, IAspect, RemovalPolicy, Stack } from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Construct, IConstruct } from 'constructs'
import * as testKmsDefinition from './openapi-kms.json'
import * as testSecurityDefinition from './security.json'

import { APIGWReconciler } from '../src/api-gw-reconciler'

class ApplyDestroyPolicyAspect implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnResource) {
      node.applyRemovalPolicy(RemovalPolicy.DESTROY)
    }
  }
}

class TestReconcilerStack extends Stack {
  public readonly reconciler: APIGWReconciler
  public readonly api: apigateway.RestApi

  constructor(scope: Construct, id: string) {
    super(scope, id)

    Aspects.of(this).add(new ApplyDestroyPolicyAspect())

    this.api = new apigateway.RestApi(this, 'api')

    this.api.root.addMethod('ANY')
    const restApiReference = apigateway.RestApi.fromRestApiId(
      this,
      'restApiReference',
      this.api.restApiId,
    )

    this.reconciler = new APIGWReconciler(this, 'reconciler', {
      restAPI: restApiReference,
      securitySchemaPath: 'iam/openapi.json',
      apiDocPathPrefix: 'dev/api-docs',
      apiDocSimpleAuthToken: '',
      openapiHeader: {
        info: {
          title: 'test',
          version: '1.0.2',
          description: 'Central API GW test',
        },
        openapi: '',
        paths: {},
      },

      allowedAccounts: [
        {
          allowedApiPathPrefix: 'iam',
          id: Aws.ACCOUNT_ID,
        },
        {
          allowedApiPathPrefix: 'kms',
          id: Aws.ACCOUNT_ID,
        },
      ],
    })

    new BucketDeployment(this, 'testSchemasIam', {
      destinationBucket: this.reconciler.openApiDefinitionBucket,
      destinationKeyPrefix: 'iam',
      prune: false,
      sources: [Source.jsonData('openapi.json', testSecurityDefinition)],
    })

    new BucketDeployment(this, 'testSchemasKms', {
      destinationBucket: this.reconciler.openApiDefinitionBucket,
      destinationKeyPrefix: 'kms',
      prune: false,
      sources: [Source.jsonData('openapi.json', testKmsDefinition)],
    })
  }
}
export const app = new App()

export const stackUnderTest = new TestReconcilerStack(app, 'reconcilerTest')
