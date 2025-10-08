import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

async function generateOpenApi() {
  // TODO: Traverse Zod schemas and convert to OpenAPI.
  const openApiDocument = {
    openapi: '3.1.0',
    info: {
      title: 'Lapasar API',
      version: '0.1.0',
    },
    paths: {},
  }

  const target = join(process.cwd(), 'apps', 'api', 'openapi.json')
  await writeFile(target, JSON.stringify(openApiDocument, null, 2))
}

generateOpenApi().catch(error => {
  console.error('Failed to generate OpenAPI document', error)
  process.exitCode = 1
})
