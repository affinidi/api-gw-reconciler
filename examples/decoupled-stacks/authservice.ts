import { App, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Function, InlineCode, Runtime } from 'aws-cdk-lib/aws-lambda'
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import * as conf from './config'
// import  authApiSchema from './authservice-api-schema.json'



class AuthServiceStack extends Stack {
    
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        const reconcilerBucket = Bucket.fromBucketArn(this, 'SourceBucket',conf.reconcilerAPISchemaBucketArn );

        // "Resource": "arn:aws:execute-api:us-west-2:123456789012:ymy8tbxw7b/dev/GET/"

        //This should be on service side

        const authserviceoperation = new Function(this, 'authserviceoperation', {
            runtime: Runtime.NODEJS_18_X,
            code: new InlineCode(
                `
        exports.handler = async function() {
          return {
            "principalId": "user",
            "policyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Action": "execute-api:Invoke",
                  "Effect": "Allow"
                  "Resource": arn:aws:execute-api:*:*:*/*/POST/demoservice/v1/demo "
                }
              ]
            }
          };
        };
        `),
            handler: 'index.handler'
        })

        //Allow API gateway to call auth function as an authorizer
        authserviceoperation.addPermission(`PermitAPIGWInvocationFor_auth}`, {
            principal: new ServicePrincipal('apigateway.amazonaws.com'),
            sourceArn: conf.centralAPIGW
        })

        const authserviceOperationUri = `arn:${Stack.of(this).partition}:apigateway:${Stack.of(this).region}:lambda:path/2015-03-31/functions/${authserviceoperation.functionArn}/invocations`
   
        const testauthserviceDefinition = {
          "openapi": "3.0.3",
          "info": {
            "title": "central-api-managed-api-gw",
            "version": "1.0.0",
            "description": "Acme Central API GW",
            "x-reconciler": {
              "pathPrefix": "authservice"
            }
          },
          "paths": {},
          "components": {
    
            "securitySchemes": {
              "UserTokenAuth": {
                "type": "apiKey",
                "name": "authorization",
                "in": "header",
                "x-amazon-apigateway-authtype": "custom",
                "x-amazon-apigateway-authorizer": {
                  "type": "request",
                  "identitySource": "method.request.header.authorization",
                  "identityValidationExpression": "Bearer .*",
                  "authorizerUri": authserviceOperationUri,
                  "authorizerResultTtlInSeconds": 0
                }
              }
            }
          },
          "x-amazon-apigateway-request-validators": {
            "basic": {
              "validateRequestBody": true,
              "validateRequestParameters": true
            }
          },
          "x-amazon-apigateway-request-validator": "basic"
        }

        //Service can deploy their openapi schemas via BucketDeployment
        new BucketDeployment(this, 'AuthAPISchema', {
            destinationBucket: reconcilerBucket,
            destinationKeyPrefix: 'authservice',
            prune: false,
            sources: [Source.jsonData('openapi.json', testauthserviceDefinition)],
        })
    }
}


const app = new App()

new AuthServiceStack(app, 'AuthServiceStack', {
    //Due to usage of Stack.of(scope).region, env has to be explicitly specifed
    env: {
        account: process.env.DEPLOY_ACCOUNT_ID,
        region: process.env.DEPLOY_REGION
    }
})

app.synth();