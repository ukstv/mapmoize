export enum Strategy {
  WEAKMAP = "weakmap",
  REPLACE = "replace",
}

/**
 * Build arguments digest.
 */
export type HashFunction = (...args: any[]) => string;

export type ArgsCacheBuilder = () => MapLike<unknown, unknown>;

export interface MapLike<K, V> {
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): this;
}
