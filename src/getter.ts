import { Strategy } from "./ancillary.js";

interface GetterDescriptor<T = unknown> extends TypedPropertyDescriptor<T> {
  get: () => T;
}

export function isGetterDescriptor<T = unknown>(
  input: TypedPropertyDescriptor<T>
): input is GetterDescriptor<T> {
  return Boolean(input.get);
}

export function memoizeGetter(
  descriptor: GetterDescriptor,
  propertyKey: string | symbol,
  strategy: Strategy
): void {
  const originalFunction = descriptor.get;
  switch (strategy) {
    case Strategy.WEAKMAP: {
      const bindings = new WeakMap<object, any>();
      // The function returned here gets called instead of originalMethod.
      // The function memorises results of `originalMethod` getter in WeakMap.
      descriptor.get = function (this: any) {
        let memoized = bindings.get(this);
        if (!memoized) {
          memoized = originalFunction.apply(this);
          bindings.set(this, memoized);
        }
        return memoized;
      };
      break;
    }
    case Strategy.REPLACE: {
      // The function returned here gets called instead of originalMethod.
      // The function replaces `originalMethod` getter with the calculated result.
      descriptor.get = function (this: any) {
        const value = originalFunction.apply(this);
        Object.defineProperty(this, propertyKey, {
          configurable: false,
          enumerable: false,
          value: value,
        });
        return value;
      };
      break;
    }
    default:
      throw new Error(`Unsupported strategy: ${strategy}`);
  }
}
