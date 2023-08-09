import { Aws,  Stack } from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'
import { APIGWReconciler } from '../../src/api-gw-reconciler'



class ReconcilerStack extends Stack {
    public readonly reconciler: APIGWReconciler
    public readonly api: apigateway.RestApi
  
    constructor(scope: Construct, id: string) {
      super(scope, id)
    
      this.api = new apigateway.RestApi(this, 'api')
  
      this.api.root.addMethod('ANY')
      const restApiReference = apigateway.RestApi.fromRestApiId(this, 'restApiReference', this.api.restApiId)

      const h = new APIGWReconciler(this, 're', {
        restAPI: new apigateway.RestApi(this, 'api'),
        allowedAccounts: [ 
            {
            allowedApiPathPrefix: 'service1',
            id: '1111111111'
        },
        {
            allowedApiPathPrefix: 'service2',
            id: '22222222222'
        },
    
    ]

      })
  
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
  

    }
  }


//   new BucketDeployment(this, 'testSchemasIam', {
//     destinationBucket: this.reconciler.openApiDefinitionBucket,
//     destinationKeyPrefix: 'iam',
//     prune: false,
//     sources: [Source.jsonData('openapi.json', testSecurityDefinition)],
//   })

//   new BucketDeployment(this, 'testSchemasKms', {
//     destinationBucket: this.reconciler.openApiDefinitionBucket,
//     destinationKeyPrefix: 'kms',
//     prune: false,
//     sources: [Source.jsonData('openapi.json', testKmsDefinition)],
//   })