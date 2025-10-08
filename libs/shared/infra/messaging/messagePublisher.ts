export interface MessageEnvelope<TPayload = unknown> {
  id: string
  topic: string
  payload: TPayload
  occurredAt: string
}

export interface MessagePublisher {
  publish<TPayload>(message: MessageEnvelope<TPayload>): Promise<void>
}

export class InMemoryMessagePublisher implements MessagePublisher {
  private readonly queue: MessageEnvelope[] = []

  async publish(message: MessageEnvelope) {
    this.queue.push(message)
  }

  drain() {
    return [...this.queue]
  }
}
