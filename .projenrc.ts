import { javascript, awscdk } from 'projen'
import { JobCallingReusableWorkflow, JobPermission } from 'projen/lib/github/workflows-model'
import { NpmAccess } from 'projen/lib/javascript'
import { TrailingComma } from 'projen/lib/javascript/prettier'

const MIN_NODE_VERSION = '18.16.0'
// https://www.npmjs.com/package/projen
export const PROJEN_VERSION = '0.71.148'
// https://www.npmjs.com/package/aws-cdk-lib
const MIN_AWS_CDK_LIB_VERSION = '2.88.0'
// https://www.npmjs.com/package/constructs
const MIN_CONSTRUCTS_VERSION = '10.2.55'
// https://github.com/aws/jsii-compiler
const JSII_VERSION = '~5.0.0'
// https://www.npmjs.com/package/openapi-merge
// keep this pinned to not have accidental side-effects
const OPENAPI_MERGE_VERSION = '1.3.2'

// const NODE_BUILD_VERSION = '18.16.0-alpine3.18'

const project = new awscdk.AwsCdkConstructLibrary({
  defaultReleaseBranch: 'main',
  author: 'Marat Shakirov',
  authorAddress: 'marat.s@affinidi.com',
  repositoryUrl: 'git@gitlab.com:affinidi/foundational/genesis/libs/api-gw-reconciler.git',
  name: 'api-gw-reconciler',
  packageName: '@affinidi/api-gw-reconciler',
  minNodeVersion: MIN_NODE_VERSION,
  projenVersion: PROJEN_VERSION,
  projenrcTs: true,
  packageManager: javascript.NodePackageManager.NPM,
  cdkVersion: MIN_AWS_CDK_LIB_VERSION,
  constructsVersion: MIN_CONSTRUCTS_VERSION,
  jsiiVersion: JSII_VERSION,
  github: true,
  release: true,
  autoMerge: false,
  package: true,
  licensed: true,
  license: 'Apache-2.0',
  prettier: true,
  npmAccess: NpmAccess.PUBLIC,

  githubOptions: {
    mergify: true,
    workflows: true,

    mergifyOptions: {
      rules: [
        {
          name: 'auto-approve',
          conditions: [
            {
              and: [
                'base=main',
                'label=auto-approve',
                '#approved-reviews-by>=1',
                'check-success=build',
                'check-success=package-js',
              ],
            },
          ],
          actions: {
            queue: {
              name: 'default',
            },
          },
        },
      ],
      queues: [
        {
          name: 'default',
          mergeMethod: 'fast-forward',
          updateMethod: 'rebase',
          conditions: [
            {
              and: ['#approved-reviews-by>=1', 'check-success=build', 'check-success=package-js'],
            },
          ],
        },
      ],
    },
  },

  autoApproveUpgrades: true,

  autoApproveOptions: {
    allowedUsernames: ['github-actions[bot]', 'trautonen'],
    label: 'auto-approve',
    secret: 'GITHUB_TOKEN',
  },

  prettierOptions: {
    settings: {
      printWidth: 120,
      semi: false,
      singleQuote: true,
      trailingComma: TrailingComma.ALL,
    },
  },
  eslintOptions: {
    dirs: [],
    ignorePatterns: ['!.projenrc.js', '*.spec.ts', '*.test.ts'],
  },
  gitignore: ['cdk.out', 'test/integ.reconciler.ts.snapshot', 'docs/examples/cdk.out'],
  bundledDeps: [
    '@aws-lambda-powertools/logger',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-api-gateway',
    '@aws-sdk/lib-storage',
    'atlassian-openapi',
    'aws-lambda',
    `openapi-merge@${OPENAPI_MERGE_VERSION}`,
  ],

  deps: [],
  devDeps: [
    '@aws-lambda-powertools/commons',
    '@types/aws-lambda',
    'esbuild',
    '@semantic-release/git',
    '@semantic-release/gitlab',
    '@semantic-release/npm',
    '@semantic-release/exec',
    'semantic-release',
    'cdk-nag',
    `@aws-cdk/integ-runner@^${MIN_AWS_CDK_LIB_VERSION}-alpha.0`,
    `@aws-cdk/integ-tests-alpha@^${MIN_AWS_CDK_LIB_VERSION}-alpha.0`,
    'ts-node',
  ],
  scripts: {
    lint: 'npm run eslint',
  },
})

project.eslint?.addRules({
  'no-magic-numbers': [
    'error',
    {
      ignore: [0],
      enforceConst: true,
    },
  ],
})

// project.packageTask.reset()
// project.packageTask.exec('npx projen package-all')
// project.addPackageIgnore('.npm/')
//affinidi/pipeline-security/.github/workflows/security-scanners.yml@feat/check-inherit
// with:
const security: JobCallingReusableWorkflow = {
  uses: 'affinidi/pipeline-security/.github/workflows/security-scanners.yml@feat/check-inherit',
  with: { 'config-path': '.github/labeler.yml' },
  secrets: 'inherit',
  permissions: {
    contents: JobPermission.READ,
    checks: JobPermission.READ,
    statuses: JobPermission.READ,
    securityEvents: JobPermission.WRITE,
  },
}

const security_workflow = project.github!.addWorkflow('security')

security_workflow.on({
  pullRequest: {},
  workflowDispatch: {},
})

security_workflow.addJobs({ security })

project.synth()
