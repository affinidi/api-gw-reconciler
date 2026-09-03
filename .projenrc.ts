import { javascript, awscdk, JsonFile, JsonPatch } from 'projen'
import { Job, JobCallingReusableWorkflow, JobPermission } from 'projen/lib/github/workflows-model'
import { NpmAccess } from 'projen/lib/javascript'
import { TrailingComma } from 'projen/lib/javascript/prettier'

const MIN_NODE_VERSION = '20.0.0'
// https://www.npmjs.com/package/projen
export const PROJEN_VERSION = '0.82.4'
// https://www.npmjs.com/package/aws-cdk-lib
const MIN_AWS_CDK_LIB_VERSION = '2.144.0'
// https://www.npmjs.com/package/constructs
const MIN_CONSTRUCTS_VERSION = '10.3.0'
// https://github.com/aws/jsii-compiler
const JSII_VERSION = '~5.4.0'
// https://www.npmjs.com/package/openapi-merge
// keep this pinned to not have accidental side-effects
const OPENAPI_MERGE_VERSION = '1.3.2'

// const NODE_BUILD_VERSION = '18.16.0-alpine3.18'

const project = new awscdk.AwsCdkConstructLibrary({
  defaultReleaseBranch: 'main',
  author: 'Marat Shakirov',
  authorAddress: 'marat.s@affinidi.com',
  repositoryUrl: 'https://github.com/affinidi/api-gw-reconciler.git',
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
  buildWorkflow: false,
  release: false,
  autoMerge: false,
  package: true,
  licensed: true,
  license: 'Apache-2.0',
  prettier: true,
  npmAccess: NpmAccess.PUBLIC,

  githubOptions: {
    mergify: false,
    workflows: true,
  },

  autoApproveUpgrades: true,

  autoApproveOptions: {
    allowedUsernames: ['github-actions[bot]', 'maratsh'],
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
  gitignore: ['cdk.out', 'test/integ.reconciler.ts.snapshot', 'examples/cdk.out'],
  //non jsii deps must be bundled
  bundledDeps: [
    '@aws-lambda-powertools/logger',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-api-gateway',
    'atlassian-openapi',
    `openapi-merge@${OPENAPI_MERGE_VERSION}`,
  ],
  devDeps: [
    '@aws-lambda-powertools/commons',
    'esbuild',
    '@types/aws-lambda',
    '@semantic-release/git',
    '@semantic-release/npm',
    '@semantic-release/exec',
    'semantic-release',
    'cdk-nag',
    `@aws-cdk/integ-runner@^${MIN_AWS_CDK_LIB_VERSION}-alpha.0`,
    `@aws-cdk/integ-tests-alpha@^${MIN_AWS_CDK_LIB_VERSION}-alpha.0`,
    'ts-node',
    'source-map-support',
  ],
  scripts: {
    'semantic-release': 'semantic-release',
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

project.packageTask.reset()
project.packageTask.exec('npx projen package-all')
project.addPackageIgnore('.github')
project.addPackageIgnore('.npm/')
project.addPackageIgnore('.cdk.out/')
project.addPackageIgnore('.coverage/')

const pr: Job = {
  name: 'test',
  runsOn: ['ubuntu-latest'],
  steps: [
    { uses: 'actions/checkout@v4' },
    { uses: 'actions/setup-node@v4', with: { 'node-version': MIN_NODE_VERSION } },
    { run: 'npm ci' },
    { run: 'npm run lint' },
    { run: 'npm run test' },
    { run: 'npm run build' },
  ],
  permissions: {
    contents: JobPermission.READ,
    checks: JobPermission.READ,
    statuses: JobPermission.READ,
    securityEvents: JobPermission.WRITE,
  },
}

const pr_workflow = project.github!.addWorkflow('pr')

pr_workflow.on({
  workflowDispatch: {},
  pullRequest: {}, //switch to pullRequestTarget after merge
  // pullRequestTarget: {},
})

pr_workflow.addJobs({ pr })

const release: Job = {
  environment: {
    name: 'publishEnv',
  },
  runsOn: ['ubuntu-latest'],
  steps: [
    {
      name: 'Checkout',
      uses: 'actions/checkout@v4',
      with: { 'persist-credentials': false },
    },
    {
      name: 'Setup Node.js',
      uses: 'actions/setup-node@v4',
      with: {
        'node-version': 20,
        'registry-url': 'https://registry.npmjs.org',
        scope: '@affinidi',
      },
    },
    {
      name: 'Install dependencies',
      run: 'npm ci',
    },
    {
      name: 'build',
      run: 'npm run build',
    },
    {
      name: 'release',
      run: 'npm run semantic-release',
      env: {
        NODE_AUTH_TOKEN: '${{ secrets.PUBLIC_NPM_NODE_AUTH_TOKEN }}',
        GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
      },
    },
  ],
  permissions: {
    contents: JobPermission.WRITE,
    checks: JobPermission.READ,
    statuses: JobPermission.READ,
    securityEvents: JobPermission.WRITE,
    packages: JobPermission.WRITE,
  },
}

const release_workflow = project.github!.addWorkflow('release')

release_workflow.on({
  workflowDispatch: {},
  push: {
    branches: ['main'],
  },
})

release_workflow.addJobs({ release })

new JsonFile(project, '.releaserc.json', {
  obj: {
    branches: ['main'],
    plugins: [
      '@semantic-release/commit-analyzer',
      '@semantic-release/release-notes-generator',
      // comment due to conflict with got (via npm-check-updates)
      // '@semantic-release/gitlab',
      '@semantic-release/npm',
      [
        '@semantic-release/git',
        {
          // see: https://github.com/semantic-release/git/issues/280
          assets: [],
          message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
        },
      ],
      [
        '@semantic-release/exec',
        {
          successCmd: 'echo RELEASE_TAG=v${nextRelease.version} > build.env',
        },
      ],
    ],
  },
})

const security: JobCallingReusableWorkflow = {
  uses: 'affinidi/pipeline-security/.github/workflows/security-scanners.yml',
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

project.github?.addDependabot()

// SEC-3901: age-gate the auto-approved dependency upgrade PR. projen's `upgrade`
// workflow opens a PR labelled `auto-approve`, so a dependency version published
// minutes ago would be approved with no human looking at it. Add a step to the
// upgrade job that flags any direct dependency bumped to a version younger than
// 48h (compromised npm releases are usually pulled within a day or two), and
// apply the `auto-approve` label only when none are present. Otherwise the PR
// gets no label, so auto-approve.yml does not fire and a person has to look (the
// age-gate step logs which dependencies were held). Applying no label, rather
// than a `needs-review` one, avoids failing PR creation on a label that may not
// exist. Patched onto the generated workflow so it survives `npx projen`.
const upgradeWorkflow = project.github?.tryFindWorkflow('upgrade')
if (!upgradeWorkflow?.file) {
  throw new Error('SEC-3901: could not find the generated `upgrade` workflow to patch')
}
upgradeWorkflow.file.patch(
  // Expose the gate result as a job output the `pr` job reads.
  JsonPatch.add('/jobs/upgrade/outputs/has_new_deps', '${{ steps.age_gate.outputs.has_new_deps }}'),
  // Run the age check after `projen upgrade` has bumped package.json. BASE_REF is
  // HEAD because the job checks out the branch and upgrades the working tree.
  JsonPatch.add('/jobs/upgrade/steps/-', {
    name: 'Age-gate brand-new dependencies (SEC-3901)',
    id: 'age_gate',
    env: { BASE_REF: 'HEAD' },
    run: 'node scripts/check-upgrade-age.mjs',
  }),
  // Withhold auto-approve when a brand-new dependency is present.
  JsonPatch.replace(
    '/jobs/pr/steps/4/with/labels',
    "${{ needs.upgrade.outputs.has_new_deps == 'true' && '' || 'auto-approve' }}",
  ),
)

project.synth()
