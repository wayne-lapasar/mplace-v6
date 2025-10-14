// * State machine errors

export class StateMachineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateMachineError';
  }
}
