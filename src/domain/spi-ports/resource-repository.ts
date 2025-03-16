import { type Resource } from '../models/resource.ts'

type SpiResourceRepository = {
  getOne(gid: string): Promise<Resource>
}

export type { SpiResourceRepository }
