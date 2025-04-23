import { openAPISpecs } from 'hono-openapi'
import { OpenApiTag } from '../../models/openapi.ts'
import { version } from '../models.ts'
import { introduction } from './copy.ts'

import 'zod-openapi/extend'
import type { makeApp } from '../app.ts'

const tagMap: Record<OpenApiTag, string> = {
  [OpenApiTag.RESOURCES]: 'Manage resources',
}

const tags = Object.entries(tagMap).map(([name, description]) => ({ name, description }))

const openapi = (app: ReturnType<typeof makeApp>) =>
  openAPISpecs(app, {
    documentation: {
      info: {
        title: 'Typescript Service Template',
        version,
        description: introduction,
      },
      servers: [
        // Update the URLs to match your environments
        {
          description: 'Local',
          url: 'http://localhost:3000',
        },
        {
          description: 'Testing',
          url: 'https://testing.example.com',
        },
        {
          description: 'Staging',
          url: 'https://staging.example.com',
        },
        {
          description: 'Production',
          url: 'https://production.example.com',
        },
      ],
      tags,
    },
  })

export { openapi }
