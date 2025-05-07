import * as Fs from 'node:fs'
import { Hono } from 'hono'
import { generateAllSpecs } from './generate-all-openapi-specs.ts'
import type { Env } from './v1/models.ts'

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn().mockReturnValue(undefined),
  readFileSync: vi.fn().mockReturnValue(undefined),
  writeFileSync: vi.fn().mockReturnValue(undefined),
}))

vi.mock('../utils/logger.ts', () => ({
  logger: {
    info: vi.fn(),
  },
}))

vi.mock('hono-openapi')

describe('generateAllSpecs', () => {
  describe('when GENERATE_OPENAPI_SPEC is truthy', () => {
    beforeEach(() => {
      vi.stubEnv('GENERATE_OPENAPI_SPEC', 'true')
    })

    describe('when the spec does not previously exist', () => {
      beforeEach(() => {
        vi.spyOn(Fs, 'existsSync').mockReturnValueOnce(false).mockRejectedValueOnce(false)
        vi.spyOn(Fs, 'readFileSync').mockReturnValue('')
      })

      test('should generate an openapi spec', async () => {
        const app = new Hono<Env>()

        await generateAllSpecs(app)

        const fs = await import('node:fs')

        expect(fs.existsSync).toHaveBeenCalledWith(expect.stringMatching(/specs\/v1$/))
        expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringMatching(/specs\/v1$/), { recursive: true })

        expect(fs.writeFileSync).toHaveBeenCalledWith(
          expect.stringMatching(/specs\/v1\/openapi.json$/),
          undefined,
          'utf8',
        )
      })
    })

    describe('when the spec has changed', () => {
      beforeEach(() => {
        vi.spyOn(Fs, 'existsSync').mockReturnValueOnce(false).mockRejectedValueOnce(true)
        vi.spyOn(Fs, 'readFileSync').mockReturnValue('')
      })

      test('should generate an openapi spec', async () => {
        const app = new Hono<Env>()

        await generateAllSpecs(app)

        const fs = await import('node:fs')

        expect(fs.existsSync).toHaveBeenCalledWith(expect.stringMatching(/specs\/v1$/))
        expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringMatching(/specs\/v1$/), { recursive: true })

        expect(fs.writeFileSync).toHaveBeenCalledWith(
          expect.stringMatching(/specs\/v1\/openapi.json$/),
          undefined,
          'utf8',
        )
      })
    })

    describe('when the spec has NOT changed', () => {
      beforeEach(() => {
        vi.spyOn(Fs, 'existsSync').mockReturnValueOnce(false).mockRejectedValueOnce(true)
      })

      test('should NOT write an openapi spec', async () => {
        const app = new Hono<Env>()
        const specs = await generateAllSpecs(app)

        const fs = await import('node:fs')

        vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
          return specs[0] as string
        })

        expect(fs.writeFileSync).not.toHaveBeenCalled()
      })
    })
  })

  describe('when GENERATE_OPENAPI_SPEC is NOT truthy', () => {
    beforeEach(() => {
      vi.stubEnv('GENERATE_OPENAPI_SPEC', '')
    })

    test('should not generate an openapi spec', async () => {
      const app = new Hono<Env>()

      await generateAllSpecs(app)

      const fs = await import('node:fs')

      expect(fs.existsSync).not.toHaveBeenCalled()
    })
  })
})
