import { z } from 'zod'
import { Entity } from '../common/entity'

const catalogItemPropsSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
})

export type CatalogItemProps = z.infer<typeof catalogItemPropsSchema>

export class CatalogItem extends Entity<CatalogItemProps> {
  static create(id: string, props: CatalogItemProps) {
    const validatedProps = catalogItemPropsSchema.parse(props)
    return new CatalogItem(id, validatedProps)
  }

  get name() {
    return this.props.name
  }

  toPrimitives() {
    return this.toJSON()
  }
}

export const catalogItemSchema = catalogItemPropsSchema.extend({
  id: z.string().uuid(),
})
