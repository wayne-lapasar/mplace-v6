export type WebSocketSubscriber = {
  id: string
  send: (payload: unknown) => void
}

export class WebSocketEventHub {
  private readonly subscribers = new Map<string, WebSocketSubscriber>()

  register(subscriber: WebSocketSubscriber) {
    this.subscribers.set(subscriber.id, subscriber)
  }

  unregister(id: string) {
    this.subscribers.delete(id)
  }

  broadcast(event: string, payload: unknown) {
    for (const subscriber of this.subscribers.values()) {
      subscriber.send({ event, payload })
    }
  }
}
