// * Result wrapper for use cases

export type ResultDTO<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export function success<T>(data: T): ResultDTO<T, never> {
  return { success: true, data };
}

export function failure<E = Error>(error: E): ResultDTO<never, E> {
  return { success: false, error };
}
