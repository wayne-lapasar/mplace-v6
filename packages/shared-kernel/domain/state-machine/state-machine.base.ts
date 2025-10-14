// * Base state machine implementation

import type { State } from './state';
import { StateMachineError } from './state-machine.error';
import type { Transition } from './transition';

export abstract class StateMachine<TState extends string, TEvent extends string> {
  private currentState: State<TState>;
  private readonly transitions: Map<string, Transition<TState, TEvent>[]>;

  constructor(
    initialState: State<TState>,
    transitions: Transition<TState, TEvent>[]
  ) {
    this.currentState = initialState;
    this.transitions = this.buildTransitionMap(transitions);
  }

  // * Get current state
  getState(): State<TState> {
    return this.currentState;
  }

  // * Trigger an event and transition to new state
  async trigger(event: TEvent, context?: Record<string, unknown>): Promise<void> {
    const key = `${this.currentState.name}:${event}`;
    const possibleTransitions = this.transitions.get(key) || [];

    for (const transition of possibleTransitions) {
      if (await this.canTransition(transition, context)) {
        await this.executeTransition(transition, context);
        return;
      }
    }

    throw new StateMachineError(
      `No valid transition from state "${this.currentState.name}" with event "${event}"`
    );
  }

  // * Check if transition is allowed
  private async canTransition(
    transition: Transition<TState, TEvent>,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    if (!transition.guard) return true;
    return transition.guard(context || {});
  }

  // * Execute the transition
  private async executeTransition(
    transition: Transition<TState, TEvent>,
    context?: Record<string, unknown>
  ): Promise<void> {
    // * Exit current state
    if (this.currentState.onExit) {
      await this.currentState.onExit();
    }

    // * Execute transition action
    if (transition.action) {
      await transition.action(context || {});
    }

    // * Find and enter new state
    const newState = this.findState(transition.to);
    if (newState.onEnter) {
      await newState.onEnter();
    }

    this.currentState = newState;
  }

  private buildTransitionMap(
    transitions: Transition<TState, TEvent>[]
  ): Map<string, Transition<TState, TEvent>[]> {
    const map = new Map<string, Transition<TState, TEvent>[]>();

    for (const transition of transitions) {
      const key = `${transition.from}:${transition.event}`;
      const existing = map.get(key) || [];
      existing.push(transition);
      map.set(key, existing);
    }

    return map;
  }

  protected abstract findState(stateName: TState): State<TState>;
}
