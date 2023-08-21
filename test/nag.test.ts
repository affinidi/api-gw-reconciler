import { App, Aspects, Stack } from 'aws-cdk-lib';

import { Construct } from 'constructs';
import { APIGWReconciler } from '../src/api-gw-reconciler';
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag'
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions'


function supressCDKNAG (reconciler: APIGWReconciler) {

  NagSuppressions.addResourceSuppressions(reconciler.mergedOpenapiBucket, [
    { id: 'AwsSolutions-S1', reason: 'S3 logs are not required' },
    { id: 'AwsSolutions-IAM5', reason: 'Allowing use of service role for lambda' },

  ], true);
  NagSuppressions.addResourceSuppressions(reconciler.openApiDefinitionBucket, [
    { id: 'AwsSolutions-S1', reason: 'S3 logs are not required' },

  ], true);

  //TODO: narrow down to specifc resources
  NagSuppressions.addResourceSuppressions(reconciler, [
    { id: 'AwsSolutions-IAM5', reason: 'Allowing use of wildcard in permissions' },

  ], true);


    NagSuppressions.addStackSuppressions(
      Stack.of(reconciler),
      [
        { id: 'AwsSolutions-L1', reason: 'Allow bucketdeployment'},

        {
          id: 'AwsSolutions-IAM4',
          reason: 'Allowing use of service role for lambda',
          // Applies to all resources that have the following policy attached
          appliesTo: [
            'Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ],
        },
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Allowing use of service role for lambda',
          // Applies to all resources that have the following policy attached
          appliesTo: [
            'Resource::*',
            'Action::s3:GetObject*',
            'Action::s3:GetBucket*',
            'Action::s3:List*',
            'Resource::arn:<AWS::Partition>:s3:::cdk-hnb659fds-assets-1111111111-ap-southeast-1/*',
            'Action::s3:DeleteObject*',
            'Action::s3:Abort*',
            'Resource::<ReconcilerOpenAPIDefinitionBucket14C58E11.Arn>/*'
          ],
        }
      ],
      true,
    )

}

describe('TestCDKNAG', () => {

     class ReconcilerStack extends Stack {
        constructor(scope: Construct, id: string, props: {}) {
            
          super(scope, id, props)

          const restApiReference = apigateway.RestApi.fromRestApiId(this, 'restApiReference', 'xyz')
    
           const reconciler = new APIGWReconciler(this, "Reconciler", { 
            restAPI: restApiReference,
            allowedAccounts: [
                {
                    'allowedApiPathPrefix': 'amazing',
                    'id': '1111111111'
                }
            ]
           })

           supressCDKNAG(reconciler)
      
    
        }
      }
        const app = new App()
        Aspects.of(app).add(new AwsSolutionsChecks())
  
    const stack = new ReconcilerStack(app, 'ReconcilerStack', {
        env: {
          account: '1111111111',
          region: 'ap-southeast-1',
        },
      }
    )
    const template = Template.fromStack(stack)
    app.synth()





    
test('No unsuppressed Warnings', () => {

  const warnings = Annotations.fromStack(stack).findError(
    '*',
    Match.stringLikeRegexp('AwsSolutions-.*'),
  )

    console.log(
      JSON.stringify(
        warnings.map((f) => f.entry.data),
        null,
        4,
      ),
    )
    expect(warnings).toHaveLength(0)
  })

  test('No unsuppressed Errors', () => {
    const errors = Annotations.fromStack(stack).findError(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    )

    console.log(

      JSON.stringify(
        errors.map((f) => f.entry.data),
        null,
        4,
      ),
    )

    expect(errors).toHaveLength(0)
  })

  test('Should create s3 bucket', () => {
    expect(template.hasResource('AWS::S3::Bucket', {}))
  })


  }
)