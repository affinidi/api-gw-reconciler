# api-gw-reconciler

> AWS API gateway reconciler

AWS API gateway reconciler checks and merges openapi schemas from services. reconciler is a library construct, which could be deployed as part of AWS CDK application

## :books: Table of Contents

- [Installation](#package-installation)
- [Usage](#rocket-usage)
- [Support](#hammer_and_wrench-support)
- [Contributing](#memo-contributing)

## :package: Installation

```sh
npm i @affinidi/api-gw-reconciler
```

## :rocket: Usage

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

## :hammer_and_wrench: Support

Please [open an issue](https://github.com/affinidi/api-gw-reconciler/issues/new) for support.

## :memo: Contributing

Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/affinidi/api-gw-reconciler/compare/).
