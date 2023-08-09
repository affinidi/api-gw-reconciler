export interface OpenAPIDefinitionHeader {
  readonly info: {
    /**
     * TypeScript/Javascript customers may pass additional properties with this
     * struct, however this will not be possible in other languages, as jsii does
     * not support index signatures.
     *
     * @jsii ignore
     */
    [key: string]: any
    readonly title: string
    readonly version: string
  }
  /**
   * TypeScript/Javascript customers may pass additional properties with this
   * struct, however this will not be possible in other languages, as jsii does
   * not support index signatures.
   *
   * @jsii ignore
   */
  [key: string]: any

  //   readonly openapi: ''
  //   readonly paths: {}
}
