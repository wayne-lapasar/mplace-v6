import { EventEmitter } from 'events'

export type EventHandler<TPayload> = (payload: TPayload) => Promise<void> | void

export class EventBus {
  private readonly emitter = new EventEmitter()

  emit<TPayload>(event: string, payload: TPayload) {
    this.emitter.emit(event, payload)
  }

  on<TPayload>(event: string, handler: EventHandler<TPayload>) {
    this.emitter.on(event, handler as EventHandler<unknown>)
  }

  off<TPayload>(event: string, handler: EventHandler<TPayload>) {
    this.emitter.off(event, handler as EventHandler<unknown>)
  }
}
