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
      isActive: z.boolean(),
      status: z.string().nullable().optional().default('active'),
    })

    const tableName = 'test_table'

    const table = schemaToDrizzleTable(tableName, schema, {
      compositeIndexes: [['name', 'status']],
      compositeUniqueIndexes: [['name', 'isActive']],
      indexes: ['name'],
      uniqueIndexes: ['name'],
    })

    const sql = await generateMigration(
      generateDrizzleJson({}),
      generateDrizzleJson({
        table,
      }),
    )

    expect(sql).toMatchInlineSnapshot(`
      [
        "CREATE TABLE "test_table" (
      	"age" integer NOT NULL,
      	"createdAt" timestamp (3) NOT NULL,
      	"name" varchar(255) NOT NULL,
      	"isActive" boolean NOT NULL,
      	"status" varchar(255),
      	"id" uuid NOT NULL,
      	CONSTRAINT "test_table_id_pk" PRIMARY KEY("id")
      );
      ",
        "CREATE INDEX "idx_name" ON "test_table" USING btree ("name");",
        "CREATE UNIQUE INDEX "uniq_name" ON "test_table" USING btree ("name");",
        "CREATE INDEX "idx_name_status" ON "test_table" USING btree ("name","status");",
        "CREATE UNIQUE INDEX "uniq_name_isActive" ON "test_table" USING btree ("name","isActive");",
      ]
    `)
  })
})
