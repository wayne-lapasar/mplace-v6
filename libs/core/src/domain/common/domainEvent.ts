export interface DomainEvent<TPayload = unknown> {
  id: string
  name: string
  occurredAt: string
  payload: TPayload
}
