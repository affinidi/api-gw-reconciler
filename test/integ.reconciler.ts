/* eslint-disable no-duplicate-imports */
/**
 * Run test
 * npx integ-runner test/integ.reconciler.ts --update-on-failed  --parallel-regions ap-southeast-1
 */

/// !cdk-integ IntegrationTestStack
// eslint-disable-next-line import/no-extraneous-dependencies
import 'source-map-support/register'

import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha'
import { app, stackUnderTest } from './fixture.stack'

const integ = new IntegTest(app, 'ReconCilerTest', {
  testCases: [stackUnderTest], // Define a list of cases for this test
  cdkCommandOptions: {
    // Customize the integ-runner parameters
    destroy: {
      args: {
        force: true,
      },
    },
  },
  regions: [stackUnderTest.region],
})

//This is not very usefull test right now, bc lambda and apidoc return too big output
integ.assertions.httpApiCall(`${stackUnderTest.api.url}/dev/kms/seeds`).expect(ExpectedResult.objectLike({}))
