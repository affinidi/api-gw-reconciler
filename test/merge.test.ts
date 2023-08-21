import assert from 'assert'
import * as testIamTemplatesDefinition from './openapi-iam-gateway-response-templates.json'
import * as testIamDefinition from './openapi-iam-no-security-schema.json'
import * as testIamSecDefinition from './openapi-iam-security-schema.json'
import * as testKmsDefinition from './openapi-kms.json'
import * as testSecurityDefinitionEmptySchema from './security-broken-empty-schema.json'
import * as testSecurityDefinitionNoSchema from './security-broken-no-schema.json'
import * as testSecurityDefinition from './security.json'
import {
  OpenAPIDefinition,
  ReconcileAPIGWLambda,
} from '../src/api-gw-reconciler.APIGWReconcilerLambda'
import { DEFAULT_HEADER_SCHEMA } from '../src/constants'

const headerSchema = DEFAULT_HEADER_SCHEMA as OpenAPIDefinition

test('should merge be successful', () => {
  const r = new ReconcileAPIGWLambda()

  const testDefinitions = [testIamDefinition, testKmsDefinition] as OpenAPIDefinition[]
  const mergedDefinition = r.merge(testSecurityDefinition as OpenAPIDefinition, headerSchema, testDefinitions)

  expect(mergedDefinition.paths['iam/public-keys']).toBeDefined()
  expect(mergedDefinition.paths['kms/keys/{id}/sign-jwt']).toBeDefined()
  expect(mergedDefinition.components!.schemas).toBeDefined()

  expect(mergedDefinition.components!.schemas!['iamServiceErrorResponse']).toBeDefined()
  
  expect(mergedDefinition).toBeDefined()
  expect(mergedDefinition['x-tagGroups']).toEqual([
    {
      name: 'Acme IAM',
      tags: ['iam', 'sts', 'projects', 'policies'],
    },
    {
      name: "Acme Key Management Service",
      tags: ['seed', 'key'],
    }
  ]);

})

test('should merge only first security schema', () => {
  const r = new ReconcileAPIGWLambda()

  const testDefinitions = [testIamSecDefinition] as OpenAPIDefinition[]
  const mergedDefinition = r.merge(testSecurityDefinition as OpenAPIDefinition, headerSchema,testDefinitions)

  expect(mergedDefinition).toBeDefined()
  expect(mergedDefinition.components?.securitySchemes).toBeDefined()
  expect(mergedDefinition.components?.securitySchemes?.UserTokenAuth).toBeDefined()
  expect(mergedDefinition.components?.securitySchemes?.ProjectTokenAuth).toBeDefined()
  expect(mergedDefinition.components?.securitySchemes?.WrongProjectTokenAuth).toBeUndefined()
})

test('should merge response template for BAD_REQUEST', () => {
  const r = new ReconcileAPIGWLambda()

  const testDefinitions = [testIamTemplatesDefinition] as OpenAPIDefinition[]
  const mergedDefinition = r.merge(testSecurityDefinition as OpenAPIDefinition, headerSchema,  testDefinitions)

  expect(mergedDefinition).toBeDefined()
  expect(mergedDefinition['x-amazon-apigateway-gateway-responses']).toBeDefined()
  expect(mergedDefinition['x-amazon-apigateway-gateway-responses'].ACCESS_DENIED).toBeDefined()
  expect(mergedDefinition['x-amazon-apigateway-gateway-responses'].UNAUTHORIZED).toBeDefined()
})

test('should merge be unsuccessful on conflicting components', () => {
  const r = new ReconcileAPIGWLambda()

  const testDefinitions = [testIamDefinition, testIamDefinition] as OpenAPIDefinition[]
  const exercise = () =>
    r.merge(testSecurityDefinitionNoSchema as OpenAPIDefinition, headerSchema, testDefinitions)

  assert.throws(exercise, Error)
})

test('should merge be unsuccessful on empty security schema', () => {
  const r = new ReconcileAPIGWLambda()

  const testDefinitions = [testIamDefinition, testIamDefinition] as OpenAPIDefinition[]
  const exercise = () =>
    r.merge(testSecurityDefinitionEmptySchema as OpenAPIDefinition, headerSchema, testDefinitions)

  assert.throws(exercise, Error)
})
