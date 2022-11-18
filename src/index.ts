/**
 * Build arguments digest.
 */
export type HashFunction = (...args: any[]) => string;

export type MapLike<K, V> = {
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): ThisType<MapLike<K, V>>;
};

export type ArgsCacheBuilder = () => MapLike<string, any>;

export type Params = {
  hashFunction: HashFunction;
  argsCacheBuilder: ArgsCacheBuilder;
};

function defaultDigest(...args: any[]) {
  let result = "";
  for (let i = 0, length = args.length; i < length; i++) {
    result += `${args[i]}$!$`;
  }
  return result;
}

function defaultArgsCacheBuilder() {
  return new Map<string, any>();
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
 */
export function memoize(params?: Partial<Params>): MethodDecorator {
  const hashFunction = (params && params.hashFunction) || defaultDigest;
  const argsCacheBuilder =
    (params && params.argsCacheBuilder) || defaultArgsCacheBuilder;
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    if (descriptor.value) {
      descriptor.value = buildFunctionWrapper(
        descriptor.value,
        hashFunction,
        argsCacheBuilder
      );
    } else if (descriptor.get) {
      descriptor.get = buildGetterWrapper(descriptor.get);
    } else {
      throw new Error("Decorate only a method or get accessor");
    }
  };
}

/**
 * Alias for +memoize+ decorator.
 */
export const Memoize = memoize;

type ArgsCache = MapLike<string, any>;

function buildFunctionWrapper(
  originalMethod: (...args: unknown[]) => unknown,
  hashFunction: HashFunction,
  argsCacheBuilder: ArgsCacheBuilder
) {
  const bindingsCache = new WeakMap<object, ArgsCache>();

  // The function returned here gets called instead of originalMethod.
  return function (this: any, ...args: any[]) {
    const digest = hashFunction.apply(this, args);
    const argsCache =
      bindingsCache.get(this) ||
      bindingsCache.set(this, argsCacheBuilder()).get(this)!;
    let memoized = argsCache.get(digest);
    if (memoized) return memoized;
    memoized = originalMethod.apply(this, args);
    argsCache.set(digest, memoized);
    return memoized;
  };
}

function buildGetterWrapper(originalMethod: (...args: unknown[]) => unknown) {
  const bindings = new WeakMap<object, any>();
  // The function returned here gets called instead of originalMethod.
  return function (this: any) {
    let memoized = bindings.get(this);
    if (!memoized) {
      memoized = originalMethod.apply(this);
      bindings.set(this, memoized);
    }
    return memoized;
  };
}
