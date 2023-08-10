import { App, Aws,  CfnOutput,  Stack, StackProps } from 'aws-cdk-lib'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { Construct } from 'constructs'
import { APIGWReconciler } from '../../src/api-gw-reconciler'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Function, InlineCode, Runtime } from 'aws-cdk-lib/aws-lambda'
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam'



class ReconcilerStack extends Stack {
    public readonly reconciler: APIGWReconciler
    public readonly api: apigateway.RestApi
  
    constructor(scope: Construct, id: string, props: StackProps) {
      super(scope, id, props)

      //Create API gateway normally or via RefactorSpaces
      this.api = new apigateway.RestApi(this, 'api', {
        deployOptions: {

        }
        
      })
  
      this.api.root.addMethod('ANY')
      const restApiReference = apigateway.RestApi.fromRestApiId(this, 'restApiReference', this.api.restApiId)


      //Reconciler stack
      this.reconciler = new APIGWReconciler(this, 'reconciler', {
        restAPI: restApiReference,
        securitySchemaPath: 'authservice/openapi.json',
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
            allowedApiPathPrefix: 'authservice',
            id: Aws.ACCOUNT_ID, //This should be account where *authservice* is deployed
          },
          {
            allowedApiPathPrefix: 'demoservice',
            id: Aws.ACCOUNT_ID, //This should be account where *authservice* is deployed
          },
        ],
      })


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
        sourceArn: this.api.arnForExecuteApi('authorizers', '/*', '/').replace(
            '///authorizers',
            '/authorizers',
          ),
      })

      const authserviceOperationUri = `arn:${Stack.of(this).partition}:apigateway:${Stack.of(this).region}:lambda:path/2015-03-31/functions/${authserviceoperation.functionArn}/invocations`


      const demooperation = new Function(this, 'demooperation', { 
        runtime: Runtime.NODEJS_18_X,
        code: new InlineCode(
        `
        exports.handler = async function() {
          return { statusCode: '200', body: JSON.stringify({ 'message': 'goodbye world'}), headers: {
            'Content-Type': 'application/json',
          } };
        };
        `),
        handler: 'index.handler'
      })

      //Allow  API gateway to call auth function for method execution
      demooperation.addPermission(`PermitAPIGWInvocationFor_demo`, {
        principal: new ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: this.api.arnForExecuteApi('*'),
      })

      const demoserviceOperationUri = `arn:${Stack.of(this).partition}:apigateway:${Stack.of(this).region}:lambda:path/2015-03-31/functions/${demooperation.functionArn}/invocations`
      
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

      
      const testdemoserviceDefinition = {
        "openapi": "3.0.3",
        "info": {
          "title": "demoservice",
          "version": "1.0.0",
          "description": "Affinidi demoservice Structure",
          "x-reconciler": {
            "pathPrefix": "demoservice"
          }
        },
        "servers": [
          {
            "url": "/"
          }
        ],
        "security": [
          {
            "AwsSigV4": []
          }
        ],
        "x-amazon-apigateway-request-validators": {
          "basic": {
            "validateRequestBody": true,
            "validateRequestParameters": true
          }
        },
        "x-amazon-apigateway-request-validator": "basic",
        "components": {
          "securitySchemes": {
            "AwsSigV4": {
              "type": "apiKey",
              "name": "Authorization",
              "in": "header",
              "x-amazon-apigateway-authtype": "awsSigv4"
            },
            "ApiKey": {
              "type": "apiKey",
              "name": "x-api-key",
              "in": "header",
              "x-amazon-apigateway-api-key-source": "HEADER"
            },
            "bearerAuth": {
              "type": "http",
              "scheme": "bearer",
              "bearerFormat": "JWT"
            },
            "UserTokenAuth": {
              "type": "apiKey",
              "name": "authorization",
              "in": "header"
            },
          },
          "headers": {},
          "requestBodies": {
            "DemoOperation": {
              "description": "DemoOperation",
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/DemoRequest"
                  }
                }
              }
            }
          },
          "responses": {
            "DemoOperationOK": {
              "description": "Ok",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/DemoResponse"
                  }
                }
              }
            },
            "DemoOperationBadRequestError": {
              "description": "BadRequestError",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/InvalidParameterError"
                  }
                }
              }
            }
          },
          "schemas": {
            "DemoRequest": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "message": {
                  "type": "string"
                }
              }
            },
            "DemoResponse": {
              "type": "object",
              "additionalProperties": false,
              "properties": {
                "message": {
                  "type": "string"
                }
              }
            },
            "InvalidParameterError": {
              "type": "object",
              "additionalProperties": false,
              "description": "Some of the parameters are invalid",
              "properties": {
                "name": {
                  "type": "string",
                  "enum": [
                    "InvalidParameterError"
                  ]
                },
                "message": {
                  "type": "string",
                  "enum": [
                    "Invalid parameter: ${param}."
                  ]
                },
                "httpStatusCode": {
                  "type": "number",
                  "enum": [
                    400
                  ]
                },
                "traceId": {
                  "type": "string"
                },
                "details": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                      "issue": {
                        "type": "string"
                      },
                      "field": {
                        "type": "string"
                      },
                      "value": {
                        "type": "string"
                      },
                      "location": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "issue"
                    ]
                  }
                }
              },
              "required": [
                "name",
                "message",
                "httpStatusCode",
                "traceId"
              ]
            }
          },
          "examples": {}
        },
        "paths": {
          "/v1/demo/sigv4": {
            "post": {
              "operationId": "demoOperationSigv4",
              "security": [
                {
                  "UserTokenAuth": []
                }
              ],
              "parameters": [],
              "requestBody": {
                "$ref": "#/components/requestBodies/DemoOperation"
              },
              "responses": {
                "200": {
                  "$ref": "#/components/responses/DemoOperationOK"
                },
                "400": {
                  "$ref": "#/components/responses/DemoOperationBadRequestError"
                }
              },
              "tags": [
                "demo"
              ],
              "x-amazon-apigateway-integration": {
                "httpMethod": "POST",
                "responses": {
                  "default": {
                    "statusCode": "200"
                  }
                },
                "passthroughBehavior": "when_no_match",
                "contentHandling": "CONVERT_TO_TEXT",
                "type": "aws_proxy",
                "uri": demoserviceOperationUri
              }
            }
          },
          "/v1/demo/usertoken": {
            "post": {
              "operationId": "demoOperationUserToken",
              "security": [
                {
                  "UserTokenAuth": []
                }
              ],
              "parameters": [],
              "requestBody": {
                "$ref": "#/components/requestBodies/DemoOperation"
              },
              "responses": {
                "200": {
                  "$ref": "#/components/responses/DemoOperationOK"
                },
                "400": {
                  "$ref": "#/components/responses/DemoOperationBadRequestError"
                }
              },
              "tags": [
                "demo"
              ],
              "x-amazon-apigateway-integration": {
                "httpMethod": "POST",
                "responses": {
                  "default": {
                    "statusCode": "200"
                  }
                },
                "passthroughBehavior": "when_no_match",
                "contentHandling": "CONVERT_TO_TEXT",
                "type": "aws_proxy",
                "uri": demoserviceOperationUri
              }
            }
          }
        }
      }

      //Service can deploy their openapi schemas via BucketDeployment
      new BucketDeployment(this, 'testSchemaserviceAuth', {
        destinationBucket: this.reconciler.openApiDefinitionBucket,
        destinationKeyPrefix: 'authservice',
        prune: false,
        sources: [Source.jsonData('openapi.json', testauthserviceDefinition)],
      })

      //Service can deploy their openapi schemas via BucketDeployment
      new BucketDeployment(this, 'testSchemaDemo', {
        destinationBucket: this.reconciler.openApiDefinitionBucket,
        destinationKeyPrefix: 'demoservice',
        prune: false,
        sources: [Source.jsonData('openapi.json', testdemoserviceDefinition)],
      })

      new CfnOutput(this, 'curlJWT', {
        value: `

        Use this command to test: 

        curl  https://${this.api.restApiId}.execute-api.ap-southeast-1.amazonaws.com/dev/demoservice/v1/demo/sigv4 \
          -H "authorization: Bearer xxx"  \
          -H 'Content-Type: application/json' \
          -d'{"message": "Hello"}'
        `
      })

      new CfnOutput(this, 'curl', {
        value: `

        Use this command to test:


        curl --aws-sigv4 "aws:amz:ap-southeast-1:execute-api"  \
        https://${this.api.restApiId}.execute-api.ap-southeast-1.amazonaws.com/dev/demoservice/v1/demo/usertoken   \
        -H "x-amz-security-token: $AWS_SESSION_TOKEN" --user "$AWS_ACCESS_KEY_ID":"$AWS_SECRET_ACCESS_KEY"  \
        -d '{"message": "Hello" }'
        `
      })

      new CfnOutput(this, 'api-doc url', {
        value: `https://${this.api.restApiId}.execute-api.ap-southeast-1.amazonaws.com/dev/api-docs/ui?token=`
      })

      }


}




const app = new App()
new ReconcilerStack(app, 'basic', { 
  //Due to usage of Stack.of(scope).region, env has to be explicitly specifed
  env: {
    account: process.env.DEPLOY_ACCOUNT_ID,
    region: process.env.DEPLOY_REGION
  }
})

app.synth();