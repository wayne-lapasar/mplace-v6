export function createEntityBuilder<T>(defaults: T) {
  return (overrides: Partial<T> = {}) => ({
    ...defaults,
    ...overrides,
  })
}
