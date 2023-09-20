import { App, Aws, Stack, StackProps } from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'
import { APIGWReconciler } from '../../src/api-gw-reconciler'
import * as conf from './config'


class ReconcilerStack extends Stack {
  public readonly reconciler: APIGWReconciler
  //public readonly api: apigateway.RestApi

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)


    //Create API gateway normally or via RefactorSpaces
    // this.api = new apigateway.RestApi(this, 'api', {})
    //this.api.root.addMethod('ANY')
    const restApiReference = apigateway.RestApi.fromRestApiAttributes(this, 'restApiReference', {
      restApiId: conf.centralAPIGWId,
      rootResourceId: conf.centralAPIGWrootResourceId
    });
    restApiReference.root.addMethod('ANY')

    //Reconciler stack
    this.reconciler = new APIGWReconciler(this, 'reconciler', {
      restAPI: restApiReference,
      securitySchemaPath: 'authservice/openapi.json',
      apiDocPathPrefix: 'dev/api-docs',
      apiDocSimpleAuthToken: '',
      openapiHeader: {
        info: {
          title: 'Central API GW',
          version: '1.0.0',
          description: 'testing creation of only reconciler as standalone',
        },
        openapi: '',
        paths: {},
      },

      allowedAccounts: [
        {
          allowedApiPathPrefix: 'authservice',
          id: Aws.ACCOUNT_ID, //This should be account where *authservice* is deployed
        },
        {
          allowedApiPathPrefix: 'demoservice',
          id: Aws.ACCOUNT_ID, //This should be account where *authservice* is deployed
        },
      ],
    })

  }

}


const app = new App()

new ReconcilerStack(app, 'NewRSReoncilerStack', {
  //Due to usage of Stack.of(scope).region, env has to be explicitly specifed
  env: {
    account: process.env.DEPLOY_ACCOUNT_ID,
    region: process.env.DEPLOY_REGION
  }
})

app.synth();