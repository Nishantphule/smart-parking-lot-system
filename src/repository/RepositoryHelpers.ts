/**
 * Helper functions to normalize sync/async repository operations
 */

export async function normalizeResult<T>(result: T | Promise<T>): Promise<T> {
  return result instanceof Promise ? result : Promise.resolve(result);
}

export async function normalizeArray<T>(result: T[] | Promise<T[]>): Promise<T[]> {
  return result instanceof Promise ? result : Promise.resolve(result);
}

export async function normalizeBoolean(result: boolean | Promise<boolean>): Promise<boolean> {
  return result instanceof Promise ? result : Promise.resolve(result);
}

export async function normalizeVoid(result: void | Promise<void>): Promise<void> {
  return result instanceof Promise ? result : Promise.resolve(result);
}
