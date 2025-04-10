describe('config', () => {
  describe('when the config is valid', () => {
    it('should not throw', async () => {
      vi.resetModules()
      vi.stubEnv('DATABASE_URL', 'http://www.example.com')

      await expect(import('./config.ts')).resolves.not.toThrow()
    })
  })

  describe('when the config is NOT valid', () => {
    it('should throw the expected error', async () => {
      vi.resetModules()
      vi.stubEnv('DATABASE_URL', undefined)

      await expect(import('./config.ts')).rejects.toThrow()
    })
  })
})
