export type QueueJob<TPayload = unknown> = {
  id: string
  payload: TPayload
  attempts: number
  maxAttempts: number
}

export type QueueProcessor<TPayload> = (job: QueueJob<TPayload>) => Promise<void>

export class InMemoryQueue<TPayload> {
  private readonly jobs: QueueJob<TPayload>[] = []

  constructor(private readonly processor: QueueProcessor<TPayload>) {}

  async enqueue(job: Omit<QueueJob<TPayload>, 'attempts'>) {
    const nextJob: QueueJob<TPayload> = { ...job, attempts: 0 }
    this.jobs.push(nextJob)
    await this.process(nextJob)
  }

  private async process(job: QueueJob<TPayload>) {
    try {
      await this.processor(job)
    } catch (error) {
      job.attempts += 1
      if (job.attempts < job.maxAttempts) {
        await this.process(job)
      } else {
        throw error
      }
    }
  }
}
