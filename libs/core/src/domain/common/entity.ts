export abstract class Entity<TProps> {
  protected constructor(
    readonly id: string,
    protected props: TProps
  ) {}

  equals(entity?: Entity<TProps>) {
    if (!entity) {
      return false
    }

    return this.id === entity.id
  }

  toJSON() {
    return {
      id: this.id,
      ...this.props,
    }
  }
}
