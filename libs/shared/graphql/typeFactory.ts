import type { z } from 'zod'

export function schemaToGraphQLType(schema: z.ZodTypeAny, typeName: string) {
  // Placeholder to transform Zod schema into GraphQL type metadata.
  return {
    typeName,
    schema,
  }
}
