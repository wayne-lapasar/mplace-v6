export interface GraphQLSchemaArtifacts {
  typeDefs: string[]
  resolvers: Record<string, unknown>
}

export function buildGraphQLSchema(): GraphQLSchemaArtifacts {
  return {
    typeDefs: [
      `
        type Query {
          _placeholder: Boolean
        }
      `,
    ],
    resolvers: {
      Query: {
        _placeholder: () => true,
      },
    },
  }
}
