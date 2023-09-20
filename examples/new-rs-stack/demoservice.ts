import { App, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Function, InlineCode, Runtime } from 'aws-cdk-lib/aws-lambda'
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import * as conf from './config'
// import authApiSchema from './authservice-api-schema.json'



class ReconcilerStack extends Stack {

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    const reconcilerBucket = Bucket.fromBucketArn(this, 'SourceBucket', conf.reconcilerAPISchemaBucketArn);


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

    demooperation.addPermission(`PermitAPIGWInvocationFor_demo`, {
      principal: new ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: conf.centralAPIGW + "*",
    })

    const demoserviceOperationUri = `arn:${Stack.of(this).partition}:apigateway:${Stack.of(this).region}:lambda:path/2015-03-31/functions/${demooperation.functionArn}/invocations`
    //const testdemoserviceDefinition = authApiSchema;
    // authApiSchema.paths['\/v1\/demo\/sigv4'].post['x-amazon-apigateway-integration'].uri = demoserviceOperationUri;
    // authApiSchema.paths['\/v1\/demo\/usertoken'].post['x-amazon-apigateway-integration'].uri = demoserviceOperationUri;

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
    new BucketDeployment(this, 'testSchemaDemo', {
      destinationBucket: reconcilerBucket,
      destinationKeyPrefix: 'demoservice',
      prune: false,
      sources: [Source.jsonData('openapi.json', testdemoserviceDefinition)],
    })
  }


}




const app = new App()

new ReconcilerStack(app, 'BasicReoncilerStack', {
  //Due to usage of Stack.of(scope).region, env has to be explicitly specifed
  env: {
    account: process.env.DEPLOY_ACCOUNT_ID,
    region: process.env.DEPLOY_REGION
  }
})

app.synth();