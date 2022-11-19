import { ArgsCacheBuilder, HashFunction, Strategy } from "./ancillary.js";
import { isGetterDescriptor, memoizeGetter } from "./getter.js";
import { isMethodDescriptor, memoizeMethod } from "./method.js";

export * from "./ancillary.js";

export type Params = {
  hashFunction: HashFunction;
  strategy: Strategy;
  argsCacheBuilder: ArgsCacheBuilder;
};

function defaultDigest(...args: any[]) {
  let result = "";
  for (let i = 0, length = args.length; i < length; i++) {
    result += `${args[i]}$!$`;
  }
  return result;
}

/**
 * Decorator to memoize class methods and getters.
 *
 * By default, memoization happens by concatenating string representation of arguments.
 * You could change this by providing a custom `hashFunction`:
 * ```
 * class Foo {
 *   @memoize({hashFunction: (name: string, planet: string) => `${name}+${planet}`})
 *   greeting(name: string, planet: string) {
 *     return `Hello dear ${name} from planet ${planet}`
 *   }
 * }
 * ```
 *
 * For getters specifically:
 * - `hashFunction` is not used,
 * - you could specify alternative strategy for memoization.
 *
 * By default we use WeakMap to memoize results. If passed `strategy` property is `Strategy.REPLACE`,
 * then after the first value calculation, we _replace_ the getter property with the value.
 */
export function memoize(params?: Partial<Params>): MethodDecorator {
  const hashFunction: HashFunction = params?.hashFunction || defaultDigest;
  const strategy: Strategy = params?.strategy || Strategy.WEAKMAP;
  const argsCacheBuilder: ArgsCacheBuilder =
    params?.argsCacheBuilder || (() => new Map());
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    if (isMethodDescriptor(descriptor)) {
      memoizeMethod(
        descriptor,
        propertyKey,
        strategy,
        hashFunction,
        argsCacheBuilder
      );
      return;
    }
    if (isGetterDescriptor(descriptor)) {
      memoizeGetter(descriptor, propertyKey, strategy);
      return;
    }
    throw new Error("Decorate only a method or get accessor");
  };
}

/**
 * Alias for +memoize+ decorator.
 */
export const Memoize = memoize;
