import { randomUUID } from 'crypto'
import type { UseCase } from '../common/useCase'
import { CatalogItem, type CatalogItemProps } from '../../domain/catalog/catalogItem'

export interface CreateCatalogItemInput extends CatalogItemProps {}

export interface CreateCatalogItemOutput {
  id: string
}

export class CreateCatalogItem implements UseCase<CreateCatalogItemInput, CreateCatalogItemOutput> {
  async execute(input: CreateCatalogItemInput): Promise<CreateCatalogItemOutput> {
    const item = CatalogItem.create(randomUUID(), input)

    // Persistence adapter will be invoked here once wired up.

    return { id: item.id }
  }
}
