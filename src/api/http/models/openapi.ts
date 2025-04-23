import { resolver } from 'hono-openapi/zod'
import { z } from 'zod'
import { schemaRequestHeaderClientId, schemaRequestHeaderRequestId } from '../v1/openapi/models.ts'
import { REQUEST_HEADER_CLIENT_ID, REQUEST_HEADER_REQUEST_ID } from './request.ts'

const OpenApiFormat = {
  /**
   *  E.g. SGVsbG8 (base64url of "Hello")
   * */
  BASE64URL: 'base64url',
  /**
   *  E.g. < binary data >
   * */
  BINARY: 'binary',
  /**
   *  E.g. SGVsbG8gV29ybGQ= (base64 of "Hello World")
   * */
  BYTE: 'byte',
  /**
   *  E.g. A
   * */
  CHAR: 'char',
  /**
   *  E.g. # Heading
   * */
  COMMON_MARK: 'commonmark',
  /**
   *  E.g. 2025-04-20T15:30:00Z
   * */
  DATE_TIME: 'date-time',
  /**
   *  E.g. 2025-04-20
   * */
  DATE: 'date',
  /**
   *  E.g. 123.456
   * */
  DECIMAL: 'decimal',
  /**
   *  E.g. 123.4567890123456789012345678901234
   * */
  DECIMAL128: 'decimal128',
  /**
   *  E.g. 9223372036854775807
   * */
  DOUBLE_INT: 'double-int',
  /**
   *  E.g. 3.14159
   * */
  DOUBLE: 'double',
  /**
   *  E.g. P3Y6M4DT12H30M5S
   * */
  DURATION: 'duration',
  /**
   *  E.g. user@example.com
   * */
  EMAIL: 'email',
  /**
   *  E.g. 3.14
   * */
  FLOAT: 'float',
  /**
   *  E.g. example.com
   * */
  HOSTNAME: 'hostname',
  /**
   *  E.g. <p>Hello, world!</p>
   * */
  HTML: 'html',
  /**
   *  E.g. Sun, 06 Nov 1994 08:49:37 GMT
   * */
  HTTP_DATE: 'http-date',
  /**
   *  E.g. 用户@例子.广告
   * */
  IDN_EMAIL: 'idn-email',
  /**
   *  E.g. 例子.测试
   * */
  IDN_HOSTNAME: 'idn-hostname',
  /**
   *  E.g. 32767
   * */
  INT16: 'int16',
  /**
   *  E.g. 2147483647
   * */
  INT32: 'int32',
  /**
   *  E.g. 9223372036854775807
   * */
  INT64: 'int64',
  /**
   *  E.g. 127
   * */
  INT8: 'int8',
  /**
   *  E.g. 192.168.0.1
   * */
  IPV4: 'ipv4',
  /**
   *  E.g. 2001:0db8:85a3::8a2e:0370:7334
   * */
  IPV6: 'ipv6',
  /**
   *  E.g. /foo/bar#section
   * */
  IRI_REFERENCE: 'iri-reference',
  /**
   *  E.g. https://例子.测试/路径
   * */
  IRI: 'iri',
  /**
   *  E.g. /foo/bar/0
   * */
  JSON_POINTER: 'json-pointer',
  /**
   *  E.g. application/json; charset=utf-8
   * */
  MEDIA_RANGE: 'media-range',
  /**
   *  E.g. s3cr3tP@ss!
   * */
  PASSWORD: 'password',
  /**
   *  E.g. ^[A-Za-z0-9]+$
   * */
  REGEX: 'regex',
  /**
   *  E.g. foo/bar/0
   * */
  RELATIVE_JSON_POINTER: 'relative-json-pointer',
  /**
   // cspell:disable-next-line
   *  E.g. :SGVsbG8sIFdvcmxkIQ==:
   * */
  SF_BINARY: 'sf-binary',
  /**
   *  E.g. ?1
   * */
  SF_BOOLEAN: 'sf-boolean',
  /**
   *  E.g. 5.123
   * */
  SF_DECIMAL: 'sf-decimal',
  /**
   *  E.g. 42
   * */
  SF_INTEGER: 'sf-integer',
  /**
   *  E.g. "Hello"
   * */
  SF_STRING: 'sf-string',
  /**
   *  E.g. token123
   * */
  SF_TOKEN: 'sf-token',
  /**
   *  E.g. 15:30:00
   * */
  TIME: 'time',
  /**
   *  E.g. 255
   * */
  UINT8: 'uint8',
  /**
   *  E.g. /users?sort=asc#top
   * */
  URI_REFERENCE: 'uri-reference',
  /**
   *  E.g. /users/{userId}
   * */
  URI_TEMPLATE: 'uri-template',
  /**
   *  E.g. https://example.com/path
   * */
  URI: 'uri',
  /**
   *  E.g. 123e4567-e89b-12d3-a456-426614174000
   * */
  UUID: 'uuid',
} as const

type OpenApiFormat = (typeof OpenApiFormat)[keyof typeof OpenApiFormat]

const OpenApiTag = {
  RESOURCES: 'Resources',
} as const

type OpenApiTag = (typeof OpenApiTag)[keyof typeof OpenApiTag]

const OPEN_API_DEFAULT_HEADERS = [
  {
    name: REQUEST_HEADER_CLIENT_ID,
    in: 'header',
    description: 'A unique client identifier for tracking usage',
    required: true,
    ...resolver(schemaRequestHeaderClientId).builder(),
  },
  {
    name: REQUEST_HEADER_REQUEST_ID,
    in: 'header',
    description: 'A unique request identifier for tracing',
    ...resolver(schemaRequestHeaderRequestId).builder(),
  },
] as const

const OPEN_API_DEFAULT_PAGINATION_PARAMS = [
  {
    description: 'The page to fetch',
    example: 1,
    in: 'query',
    name: 'page',
    ...resolver(z.number().int().positive().optional()).builder(),
  },
  {
    description: 'The number of items per page',
    example: 25,
    in: 'query',
    name: 'pageSize',
    ...resolver(z.number().int().nonnegative().optional()).builder(),
  },
] as const

export { OPEN_API_DEFAULT_HEADERS, OPEN_API_DEFAULT_PAGINATION_PARAMS, OpenApiFormat, OpenApiTag }
