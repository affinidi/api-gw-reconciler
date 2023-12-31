# api-gw-reconciler
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-10-orange.svg?style=flat-square)](#contributors-)
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
# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### APIGWReconciler <a name="APIGWReconciler" id="@affinidi/api-gw-reconciler.APIGWReconciler"></a>

AWS API GW reconciler.

reconciler merges openapi schemas from services and updates central API gw with result schemas

#### Initializers <a name="Initializers" id="@affinidi/api-gw-reconciler.APIGWReconciler.Initializer"></a>

```typescript
import { APIGWReconciler } from '@affinidi/api-gw-reconciler'

new APIGWReconciler(scope: Stack, id: string, props: IAPIGWReconcilerProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.Initializer.parameter.scope">scope</a></code> | <code>aws-cdk-lib.Stack</code> | *No description.* |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.Initializer.parameter.props">props</a></code> | <code><a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerProps">IAPIGWReconcilerProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="@affinidi/api-gw-reconciler.APIGWReconciler.Initializer.parameter.scope"></a>

- *Type:* aws-cdk-lib.Stack

---

##### `id`<sup>Required</sup> <a name="id" id="@affinidi/api-gw-reconciler.APIGWReconciler.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="@affinidi/api-gw-reconciler.APIGWReconciler.Initializer.parameter.props"></a>

- *Type:* <a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerProps">IAPIGWReconcilerProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="@affinidi/api-gw-reconciler.APIGWReconciler.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="@affinidi/api-gw-reconciler.APIGWReconciler.isConstruct"></a>

```typescript
import { APIGWReconciler } from '@affinidi/api-gw-reconciler'

APIGWReconciler.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="@affinidi/api-gw-reconciler.APIGWReconciler.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.property.mergedOpenapiBucket">mergedOpenapiBucket</a></code> | <code>aws-cdk-lib.aws_s3.Bucket</code> | *No description.* |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.property.openApiDefinitionBucket">openApiDefinitionBucket</a></code> | <code>aws-cdk-lib.aws_s3.Bucket</code> | *No description.* |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.property.openapiDocsLambda">openapiDocsLambda</a></code> | <code>aws-cdk-lib.aws_lambda_nodejs.NodejsFunction</code> | *No description.* |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.property.openapiInfoMetadataKey">openapiInfoMetadataKey</a></code> | <code>string</code> | *No description.* |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.property.reconcilerLambda">reconcilerLambda</a></code> | <code>aws-cdk-lib.aws_lambda_nodejs.NodejsFunction</code> | *No description.* |
| <code><a href="#@affinidi/api-gw-reconciler.APIGWReconciler.property.redocLambda">redocLambda</a></code> | <code>aws-cdk-lib.aws_lambda_nodejs.NodejsFunction</code> | *No description.* |

---

##### `node`<sup>Required</sup> <a name="node" id="@affinidi/api-gw-reconciler.APIGWReconciler.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `mergedOpenapiBucket`<sup>Required</sup> <a name="mergedOpenapiBucket" id="@affinidi/api-gw-reconciler.APIGWReconciler.property.mergedOpenapiBucket"></a>

```typescript
public readonly mergedOpenapiBucket: Bucket;
```

- *Type:* aws-cdk-lib.aws_s3.Bucket

---

##### `openApiDefinitionBucket`<sup>Required</sup> <a name="openApiDefinitionBucket" id="@affinidi/api-gw-reconciler.APIGWReconciler.property.openApiDefinitionBucket"></a>

```typescript
public readonly openApiDefinitionBucket: Bucket;
```

- *Type:* aws-cdk-lib.aws_s3.Bucket

---

##### `openapiDocsLambda`<sup>Required</sup> <a name="openapiDocsLambda" id="@affinidi/api-gw-reconciler.APIGWReconciler.property.openapiDocsLambda"></a>

```typescript
public readonly openapiDocsLambda: NodejsFunction;
```

- *Type:* aws-cdk-lib.aws_lambda_nodejs.NodejsFunction

---

##### `openapiInfoMetadataKey`<sup>Required</sup> <a name="openapiInfoMetadataKey" id="@affinidi/api-gw-reconciler.APIGWReconciler.property.openapiInfoMetadataKey"></a>

```typescript
public readonly openapiInfoMetadataKey: string;
```

- *Type:* string

---

##### `reconcilerLambda`<sup>Required</sup> <a name="reconcilerLambda" id="@affinidi/api-gw-reconciler.APIGWReconciler.property.reconcilerLambda"></a>

```typescript
public readonly reconcilerLambda: NodejsFunction;
```

- *Type:* aws-cdk-lib.aws_lambda_nodejs.NodejsFunction

---

##### `redocLambda`<sup>Required</sup> <a name="redocLambda" id="@affinidi/api-gw-reconciler.APIGWReconciler.property.redocLambda"></a>

```typescript
public readonly redocLambda: NodejsFunction;
```

- *Type:* aws-cdk-lib.aws_lambda_nodejs.NodejsFunction

---


## Structs <a name="Structs" id="Structs"></a>

### OpenAPIDefinitionHeader <a name="OpenAPIDefinitionHeader" id="@affinidi/api-gw-reconciler.OpenAPIDefinitionHeader"></a>

#### Initializer <a name="Initializer" id="@affinidi/api-gw-reconciler.OpenAPIDefinitionHeader.Initializer"></a>

```typescript
import { OpenAPIDefinitionHeader } from '@affinidi/api-gw-reconciler'

const openAPIDefinitionHeader: OpenAPIDefinitionHeader = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@affinidi/api-gw-reconciler.OpenAPIDefinitionHeader.property.info">info</a></code> | <code>{[ key: string ]: any}</code> | *No description.* |

---

##### `info`<sup>Required</sup> <a name="info" id="@affinidi/api-gw-reconciler.OpenAPIDefinitionHeader.property.info"></a>

```typescript
public readonly info: {[ key: string ]: any};
```

- *Type:* {[ key: string ]: any}

---


## Protocols <a name="Protocols" id="Protocols"></a>

### IAPIGWReconcilerallowedAccount <a name="IAPIGWReconcilerallowedAccount" id="@affinidi/api-gw-reconciler.IAPIGWReconcilerallowedAccount"></a>

- *Implemented By:* <a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerallowedAccount">IAPIGWReconcilerallowedAccount</a>

aws account id to api path prefix mapping.


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerallowedAccount.property.allowedApiPathPrefix">allowedApiPathPrefix</a></code> | <code>string</code> | API path prefix allowed for given account `id`. |
| <code><a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerallowedAccount.property.id">id</a></code> | <code>string</code> | Account Id of service under API path prefix. |

---

##### `allowedApiPathPrefix`<sup>Required</sup> <a name="allowedApiPathPrefix" id="@affinidi/api-gw-reconciler.IAPIGWReconcilerallowedAccount.property.allowedApiPathPrefix"></a>

```typescript
public readonly allowedApiPathPrefix: string;
```

- *Type:* string

API path prefix allowed for given account `id`.

---

##### `id`<sup>Required</sup> <a name="id" id="@affinidi/api-gw-reconciler.IAPIGWReconcilerallowedAccount.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

Account Id of service under API path prefix.

---

### IAPIGWReconcilerProps <a name="IAPIGWReconcilerProps" id="@affinidi/api-gw-reconciler.IAPIGWReconcilerProps"></a>

- *Implemented By:* <a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerProps">IAPIGWReconcilerProps</a>


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.allowedAccounts">allowedAccounts</a></code> | <code><a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerallowedAccount">IAPIGWReconcilerallowedAccount</a>[]</code> | *No description.* |
| <code><a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.restAPI">restAPI</a></code> | <code>aws-cdk-lib.aws_apigateway.IRestApi</code> | restAPI managed by reconciler. |
| <code><a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.apiDocPathPrefix">apiDocPathPrefix</a></code> | <code>string</code> | path prefix for api doc. |
| <code><a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.apiDocSimpleAuthToken">apiDocSimpleAuthToken</a></code> | <code>string</code> | Simple authentication token to keep your apidoc somewhat private. |
| <code><a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.openapiHeader">openapiHeader</a></code> | <code><a href="#@affinidi/api-gw-reconciler.OpenAPIDefinitionHeader">OpenAPIDefinitionHeader</a></code> | Default schema, defines title, description, version. |
| <code><a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.openapiInfoMetadataKey">openapiInfoMetadataKey</a></code> | <code>string</code> | Key in service openapi schema under info key. |
| <code><a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.securitySchemaPath">securitySchemaPath</a></code> | <code>string</code> | security schema path this schema configures authorizers in API gw. |

---

##### `allowedAccounts`<sup>Required</sup> <a name="allowedAccounts" id="@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.allowedAccounts"></a>

```typescript
public readonly allowedAccounts: IAPIGWReconcilerallowedAccount[];
```

- *Type:* <a href="#@affinidi/api-gw-reconciler.IAPIGWReconcilerallowedAccount">IAPIGWReconcilerallowedAccount</a>[]

---

##### `restAPI`<sup>Required</sup> <a name="restAPI" id="@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.restAPI"></a>

```typescript
public readonly restAPI: IRestApi;
```

- *Type:* aws-cdk-lib.aws_apigateway.IRestApi

restAPI managed by reconciler.

---

##### `apiDocPathPrefix`<sup>Optional</sup> <a name="apiDocPathPrefix" id="@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.apiDocPathPrefix"></a>

```typescript
public readonly apiDocPathPrefix: string;
```

- *Type:* string
- *Default:* 'api-docs'

path prefix for api doc.

---

##### `apiDocSimpleAuthToken`<sup>Optional</sup> <a name="apiDocSimpleAuthToken" id="@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.apiDocSimpleAuthToken"></a>

```typescript
public readonly apiDocSimpleAuthToken: string;
```

- *Type:* string
- *Default:* ''

Simple authentication token to keep your apidoc somewhat private.

---

##### `openapiHeader`<sup>Optional</sup> <a name="openapiHeader" id="@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.openapiHeader"></a>

```typescript
public readonly openapiHeader: OpenAPIDefinitionHeader;
```

- *Type:* <a href="#@affinidi/api-gw-reconciler.OpenAPIDefinitionHeader">OpenAPIDefinitionHeader</a>

Default schema, defines title, description, version.

---

##### `openapiInfoMetadataKey`<sup>Optional</sup> <a name="openapiInfoMetadataKey" id="@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.openapiInfoMetadataKey"></a>

```typescript
public readonly openapiInfoMetadataKey: string;
```

- *Type:* string
- *Default:* 'x-reconciler'

Key in service openapi schema under info key.

---

##### `securitySchemaPath`<sup>Optional</sup> <a name="securitySchemaPath" id="@affinidi/api-gw-reconciler.IAPIGWReconcilerProps.property.securitySchemaPath"></a>

```typescript
public readonly securitySchemaPath: string;
```

- *Type:* string
- *Default:* "iam/openapi.json"

security schema path this schema configures authorizers in API gw.

---

