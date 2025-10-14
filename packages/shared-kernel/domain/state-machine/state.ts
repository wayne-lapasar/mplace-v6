// * State definition for state machine

export interface State<TState extends string> {
  name: TState;
  onEnter?: () => void | Promise<void>;
  onExit?: () => void | Promise<void>;
}
