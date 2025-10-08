export interface Query<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>
}
