import { App, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Function, InlineCode, Runtime } from 'aws-cdk-lib/aws-lambda'
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import * as conf from './config'
import  authApiSchema from './authservice-api-schema.json'

class AuthServiceStack extends Stack {
    
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        const reconcilerBucket = Bucket.fromBucketArn(this, 'SourceBucket',conf.reconcilerAPISchemaBucketArn );

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
        const testauthserviceDefinition= authApiSchema;
        testauthserviceDefinition.components.securitySchemes.UserTokenAuth['x-amazon-apigateway-authorizer'].authorizerUri=authserviceOperationUri;

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