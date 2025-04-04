import { ResourceRepository } from './index.ts'

describe('ResourceRepository', () => {
  it('should have a method called getOne', () => {
    const repository = new ResourceRepository({
      db: {
        connection: {
          url: 'test-url',
        },
      },
    })

    expect(repository.getOne).toBeDefined()
  })

  it('should return a resource object when getOne is called', async () => {
    const repository = new ResourceRepository({
      db: {
        connection: {
          url: 'test-url',
        },
      },
    })

    const gid = 'test-gid'
    const resource = await repository.getOne(gid)

    // Assuming the resource object has a property 'gid' that matches the input
    expect(resource).toBeDefined()
    expect(resource.gid).toBe(gid)
    expect(resource.name).toBe('Resource Name') // Based on the mock data in the repository
  })
})
