# api-gw-reconciler

> AWS API gateway reconciler

AWS API gateway reconciler checks and merges openapi schemas from services.
Reconciler is cdk library construct, which could be deployed as part of AWS CDK application

## :books: Table of Contents

- [Installation](#package-installation)
- [Features](#battery-features)
- [Usage](#rocket-usage)
- [Support](#hammer_and_wrench-support)
- [Contributing](#memo-contributing)

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
