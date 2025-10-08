export abstract class ValueObject<TProps> {
  protected constructor(protected props: TProps) {}

  equals(vo?: ValueObject<TProps>) {
    if (!vo) {
      return false
    }

    return JSON.stringify(this.props) === JSON.stringify(vo.props)
  }

  toJSON() {
    return this.props
  }
}
