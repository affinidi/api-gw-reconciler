# api-gw-reconciler
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-11-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

> AWS API gateway reconciler

AWS API gateway reconciler checks and merges openapi schemas from services.
Reconciler is cdk library construct, which could be deployed as part of AWS CDK application

## :books: Table of Contents

- [Installation](#package-installation)
- [Features](#battery-features)
- [Usage](#rocket-usage)
- [Support](#hammer_and_wrench-support)
- [Contributing](#memo-contributing)
- [Contributors](#contributors-)

## :package: Installation

```sh
npm i @affinidi/api-gw-reconciler
```

## :battery: Features

* Merging openapi schemas from different services in one openapi schema and updating single API gateway
* Checking for backwards compatibilty of schema
* schema path authentication for specifc service path prefix
* Pinning 1 schema to provide authorizers
* Generates and publishes json api doc
* Generates and publishes ReDoc HTML documentation
* Token Auth for documentation 

## :rocket: Usage

For more complex example, take a look into [examples]

```ts

//Create API gw somewhere
const api = new apigateway.RestApi(this, 'api')
api.root.addMethod('ANY')
```

Create reconciler
```ts
//Reference apigateway in reconciler stack
const  restApiId = 'fe3sdf4x'
restApiReference = apigateway.RestApi.fromRestApiId(this, 'restApiReference', restApiId)
//Create reconsiler
const reconciler = new APIGWReconciler(this, 'reconciler', {
  restAPI: restApiReference
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
```

Upload openapi.json schema in service stack 
```ts
const oas = { 
  "openapi": "3.0.0",
  "paths:" : [...]
  ...
}
new BucketDeployment(this, 'openapiSchemaDeployment', {
    destinationBucket: this.reconciler.openApiDefinitionBucket,
    destinationKeyPrefix: 'service1',
    prune: false,
    sources: [Source.jsonData('openapi.json', oas)],
})
```


## :carpentry_saw: How it works


Take a look into detailed [example](/examples/)


## :hammer_and_wrench: Support

Please [open an issue](https://github.com/affinidi/api-gw-reconciler/issues/new) for support.

## :memo: Contributing

Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/affinidi/api-gw-reconciler/compare/).

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/maratsh"><img src="https://avatars.githubusercontent.com/u/533533?v=4?s=100" width="100px;" alt="maratsh"/><br /><sub><b>maratsh</b></sub></a><br /><a href="https://github.com/affinidi/api-gw-reconciler/commits?author=maratsh" title="Code">💻</a> <a href="https://github.com/affinidi/api-gw-reconciler/commits?author=maratsh" title="Documentation">📖</a> <a href="#example-maratsh" title="Examples">💡</a> <a href="#ideas-maratsh" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-maratsh" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-maratsh" title="Maintenance">🚧</a> <a href="#platform-maratsh" title="Packaging/porting to new platform">📦</a> <a href="#question-maratsh" title="Answering Questions">💬</a> <a href="https://github.com/affinidi/api-gw-reconciler/pulls?q=is%3Apr+reviewed-by%3Amaratsh" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/affinidi/api-gw-reconciler/commits?author=maratsh" title="Tests">⚠️</a> <a href="#tutorial-maratsh" title="Tutorials">✅</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/robert-affinidi"><img src="https://avatars.githubusercontent.com/u/88320072?v=4?s=100" width="100px;" alt="Robert"/><br /><sub><b>Robert</b></sub></a><br /><a href="https://github.com/affinidi/api-gw-reconciler/pulls?q=is%3Apr+reviewed-by%3Arobert-affinidi" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/affinidi/api-gw-reconciler/commits?author=robert-affinidi" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://yigitcan.dev/"><img src="https://avatars.githubusercontent.com/u/3743507?v=4?s=100" width="100px;" alt="Yiğitcan UÇUM"/><br /><sub><b>Yiğitcan UÇUM</b></sub></a><br /><a href="#ideas-Yengas" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/affinidi/api-gw-reconciler/commits?author=Yengas" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/standemchuk"><img src="https://avatars.githubusercontent.com/u/2404558?v=4?s=100" width="100px;" alt="Stanislav Demchuk"/><br /><sub><b>Stanislav Demchuk</b></sub></a><br /><a href="https://github.com/affinidi/api-gw-reconciler/pulls?q=is%3Apr+reviewed-by%3Astandemchuk" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yaroslava-kurash"><img src="https://avatars.githubusercontent.com/u/112872739?v=4?s=100" width="100px;" alt="yaroslava-kurash"/><br /><sub><b>yaroslava-kurash</b></sub></a><br /><a href="https://github.com/affinidi/api-gw-reconciler/commits?author=yaroslava-kurash" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dmfilipenko"><img src="https://avatars.githubusercontent.com/u/1822520?v=4?s=100" width="100px;" alt="Dmytro Filipenko"/><br /><sub><b>Dmytro Filipenko</b></sub></a><br /><a href="https://github.com/affinidi/api-gw-reconciler/commits?author=dmfilipenko" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/viatcheslavmogilevsky"><img src="https://avatars.githubusercontent.com/u/734490?v=4?s=100" width="100px;" alt="Vyatcheslav Mogilevsky"/><br /><sub><b>Vyatcheslav Mogilevsky</b></sub></a><br /><a href="https://github.com/affinidi/api-gw-reconciler/commits?author=viatcheslavmogilevsky" title="Code">💻</a> <a href="https://github.com/affinidi/api-gw-reconciler/pulls?q=is%3Apr+reviewed-by%3Aviatcheslavmogilevsky" title="Reviewed Pull Requests">👀</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/raja-sekhar-r"><img src="https://avatars.githubusercontent.com/u/68847302?v=4?s=100" width="100px;" alt="Raja"/><br /><sub><b>Raja</b></sub></a><br /><a href="https://github.com/affinidi/api-gw-reconciler/commits?author=raja-sekhar-r" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/anton-iskryzhytskyi"><img src="https://avatars.githubusercontent.com/u/36485067?v=4?s=100" width="100px;" alt="Anton Iskryzhytskyi"/><br /><sub><b>Anton Iskryzhytskyi</b></sub></a><br /><a href="https://github.com/affinidi/api-gw-reconciler/commits?author=anton-iskryzhytskyi" title="Code">💻</a> <a href="#ideas-anton-iskryzhytskyi" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/affinidi/api-gw-reconciler/pulls?q=is%3Apr+reviewed-by%3Aanton-iskryzhytskyi" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kwekmh-affinidi"><img src="https://avatars.githubusercontent.com/u/138572541?v=4?s=100" width="100px;" alt="kwekmh-affinidi"/><br /><sub><b>kwekmh-affinidi</b></sub></a><br /><a href="https://github.com/affinidi/api-gw-reconciler/pulls?q=is%3Apr+reviewed-by%3Akwekmh-affinidi" title="Reviewed Pull Requests">👀</a> <a href="#security-kwekmh-affinidi" title="Security">🛡️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/sanjay95/"><img src="https://avatars.githubusercontent.com/u/1314582?v=4?s=100" width="100px;" alt="Sanjay"/><br /><sub><b>Sanjay</b></sub></a><br /><a href="https://github.com/affinidi/api-gw-reconciler/commits?author=sanjay95" title="Code">💻</a> <a href="https://github.com/affinidi/api-gw-reconciler/commits?author=sanjay95" title="Documentation">📖</a> <a href="#example-sanjay95" title="Examples">💡</a> <a href="#tutorial-sanjay95" title="Tutorials">✅</a> <a href="#talk-sanjay95" title="Talks">📢</a></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">Add your contributions</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!