import {
  ArgsCacheBuilder,
  HashFunction,
  MapLike,
  Strategy,
} from "./ancillary.js";

type ArgsCache = MapLike<string, any>;

interface MethodDescriptor<T extends (...args: unknown[]) => unknown>
  extends TypedPropertyDescriptor<T> {
  value: T;
}

export function isMethodDescriptor<T extends (...args: unknown[]) => unknown>(
  input: TypedPropertyDescriptor<T>
): input is MethodDescriptor<T> {
  return Boolean(input.value);
}

export function memoizeMethod<T extends (...args: unknown[]) => unknown>(
  descriptor: MethodDescriptor<T>,
  propertyKey: string | symbol,
  strategy: Strategy,
  hashFunction: HashFunction,
  argsCacheBuilder: ArgsCacheBuilder
): void {
  const originalMethod = descriptor.value;
  // The function set to descriptor.value here gets called instead of originalMethod.
  // The function memorises results of `originalMethod` in WeakMap.
  switch (originalMethod.length) {
    case 0: {
      switch (strategy) {
        // Replace property of the same name as the method by the value directly.
        case Strategy.REPLACE: {
          descriptor.value = function (this: any) {
            const calculated = originalMethod.apply(this);
            Object.defineProperty(this, propertyKey, {
              enumerable: descriptor.enumerable,
              configurable: descriptor.configurable,
              writable: descriptor.writable,
              value: function () {
                return calculated;
              },
            });
          } as T;
          return;
        }
        case Strategy.WEAKMAP: {
          // Use WeakMap to find a memoized value by an object instance.
          const bindingsCache = new WeakMap<object, unknown>();
          descriptor.value = function (this: any) {
            if (bindingsCache.has(this)) {
              return bindingsCache.get(this);
            }
            let calculated = originalMethod.apply(this);
            bindingsCache.set(this, calculated);
            return calculated;
          } as T;
          break;
        }
      }
      break;
    }
    case 1: {
      switch (strategy) {
        // Use WeakMap to find a memoized value by an object instance and an argument.
        case Strategy.WEAKMAP: {
          const bindingsCache = new WeakMap<
            object,
            MapLike<unknown, unknown>
          >();
          descriptor.value = function (this: any, arg: unknown): unknown {
            let argsCache = bindingsCache.get(this);
            if (!argsCache) {
              argsCache = argsCacheBuilder();
              bindingsCache.set(this, argsCache);
            }
            if (argsCache.has(arg)) {
              return argsCache.get(arg);
            }
            const memoized = originalMethod.call(this, arg);
            argsCache.set(arg, memoized);
            return memoized;
          } as T;
          break;
        }
        case Strategy.REPLACE: {
          // Replace property of the same name as the method by a closure that contains a memoization map `argument -> value`.
          descriptor.value = function (this: any, arg: unknown): unknown {
            const memoizationContainer = argsCacheBuilder();
            function replacement(this: any, arg: unknown) {
              if (memoizationContainer.has(arg)) {
                return memoizationContainer.get(arg);
              } else {
                const memoized = originalMethod.call(this, arg);
                memoizationContainer.set(arg, memoized);
                return memoized;
              }
            }
            Object.defineProperty(this, propertyKey, {
              configurable: descriptor.configurable,
              enumerable: descriptor.enumerable,
              writable: descriptor.writable,
              value: replacement,
            });
            return replacement.call(this, arg);
          } as T;
          break;
        }
      }
      break;
    }
    default: {
      switch (strategy) {
        // Replace property of the same name as the method by a closure that contains a memoization map `digest(argument) -> value`.
        case Strategy.REPLACE: {
          descriptor.value = function (this: any, ...args: unknown[]) {
            const memoizationContainer = argsCacheBuilder();
            function replacement(this: any, ...args: unknown[]) {
              const digest = hashFunction.apply(this, args);
              if (memoizationContainer.has(digest)) {
                return memoizationContainer.get(digest);
              } else {
                const memoized = originalMethod.apply(this, args);
                memoizationContainer.set(digest, memoized);
                return memoized;
              }
            }
            Object.defineProperty(this, propertyKey, {
              configurable: descriptor.configurable,
              enumerable: descriptor.enumerable,
              writable: descriptor.writable,
              value: replacement,
            });
            return replacement.apply(this, args);
          } as T;
          break;
        }
        case Strategy.WEAKMAP: {
          // Use WeakMap to find a memoized value by an object instance and digest of arguments.
          const bindingsCache = new WeakMap<object, ArgsCache>();
          descriptor.value = function replacement(
            this: any,
            ...args: unknown[]
          ): unknown {
            let argsCache = bindingsCache.get(this);
            const digest = hashFunction.apply(this, args);
            if (argsCache?.has(digest)) {
              return argsCache.get(digest);
            }
            if (!argsCache) {
              argsCache = argsCacheBuilder();
              bindingsCache.set(this, argsCache);
            }
            const memoized = originalMethod.apply(this, args);
            argsCache.set(digest, memoized);
            return memoized;
          } as T;
        }
      }
    }
  }
}
