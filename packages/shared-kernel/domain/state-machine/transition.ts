// * Transition definition for state machine

export interface Transition<TState extends string, TEvent extends string> {
  from: TState;
  to: TState;
  event: TEvent;
  guard?: (context: Record<string, unknown>) => boolean | Promise<boolean>;
  action?: (context: Record<string, unknown>) => void | Promise<void>;
}
