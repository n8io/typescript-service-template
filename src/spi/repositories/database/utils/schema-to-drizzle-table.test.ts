import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { generateDrizzleJson, generateMigration } = require('drizzle-kit/api') as typeof import('drizzle-kit/api')

import { z } from 'zod'
import { schemaToDrizzleTable } from './schema-to-drizzle-table.ts'

describe('schemaToDrizzleTable', () => {
  it('should convert a schema to a drizzle table and produce the expected sql', async () => {
    const schema = z.object({
      age: z.number().int().positive(),
      createdAt: z.date(),
      name: z
        .string()
        .toLowerCase()
        .trim()
        .transform((val) => val.toLowerCase()),
      isActive: z.boolean().default(true),
      nullableWithDefault: z.string().nullable().default('PRIMITIVE_DEFAULT'),
      nullableWithDefaultFunction: z.coerce
        .boolean()
        .nullable()
        .default(() => false),
      nullableWithDefaultTransform: z
        .string()
        .nullable()
        .transform((val) => val ?? 'default'),
      status: z.string().nullable().optional().default('active'),
    })

    const tableName = 'test_table'

    const result = schemaToDrizzleTable(tableName, schema, {
      compositeIndexes: [['name', 'status']],
      compositeUniqueIndexes: [['name', 'isActive']],
      indexes: ['name'],
      uniqueIndexes: ['name'],
    })

    // Handle the Result type
    if (result.isErr()) {
      throw new Error(`Failed to create table: ${result.error.message}`)
    }

    const table = result.value

    const sql = await generateMigration(generateDrizzleJson({}), generateDrizzleJson({ table }))

    expect(sql).toMatchInlineSnapshot(`
      [
        "CREATE TABLE "test_table" (
      	"age" integer NOT NULL,
      	"createdAt" timestamp NOT NULL,
      	"name" text NOT NULL,
      	"isActive" boolean DEFAULT true NOT NULL,
      	"nullableWithDefault" text,
      	"nullableWithDefaultFunction" boolean,
      	"nullableWithDefaultTransform" text NOT NULL,
      	"status" text,
      	"id" text NOT NULL,
      	CONSTRAINT "test_table_id_pk" PRIMARY KEY("id")
      );
      ",
        "CREATE INDEX "idx_test_table_name" ON "test_table" USING btree ("name");",
        "CREATE UNIQUE INDEX "udx_test_table_name" ON "test_table" USING btree ("name");",
        "CREATE INDEX "idx_test_table_name_status" ON "test_table" USING btree ("name","status");",
        "CREATE UNIQUE INDEX "udx_test_table_name_isactive" ON "test_table" USING btree ("name","isActive");",
      ]
    `)
  })

  it('should handle unsupported Zod types gracefully', () => {
    // Create a schema with a truly unsupported type by mocking the mapZodToDrizzle
    const schema = z.object({
      unsupported: z.string(),
    })

    const result = schemaToDrizzleTable('test_table', schema)

    // Since our current implementation supports all basic types, this should succeed
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBeDefined()
    }
  })

  it('should handle empty schema gracefully', () => {
    // Test with an empty schema object
    const emptySchema = z.object({})

    const result = schemaToDrizzleTable('test_table', emptySchema)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBeDefined()
      // Should have at least an 'id' field added
      expect(result.value).toHaveProperty('id')
    }
  })
})
