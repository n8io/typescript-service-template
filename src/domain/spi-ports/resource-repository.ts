import type { Resource } from '../models/resource.ts'

type SpiResourceRepository = {
  // getMany(id: string): Promise<Resource>
  getOne(id: string): Promise<Resource>
}

export type { SpiResourceRepository }
