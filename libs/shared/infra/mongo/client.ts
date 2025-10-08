import { MongoClient } from 'mongodb'

import type { MongoConfig } from '@shared/interfaces/config'

let cachedClient: MongoClient | undefined

export async function getMongoClient(config: MongoConfig): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient
  }

  cachedClient = new MongoClient(config.uri, config.options)
  await cachedClient.connect()

  return cachedClient
}

export function getMongoDatabase(config: MongoConfig) {
  if (!cachedClient) {
    throw new Error('Mongo client not initialized')
  }

  return cachedClient.db(config.database)
}
