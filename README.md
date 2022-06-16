# mapmoize

[![npm](https://img.shields.io/npm/v/mapmoize.svg)](https://www.npmjs.com/package/mapmoize)
![Test](https://github.com/ukstv/mapmoize/workflows/Test/badge.svg)

A memoize decorator for Typescript that uses `WeakMap`s to memoize results.

_Heavily_ inspired by [typescript-memoize](https://github.com/darrylhodgins/typescript-memoize).

## Installation

```
npm install --save mapmoize
```

## Usage:

```typescript
@Memoize(params?: {hashFunction?: (...args: any[]) => any})
// or
@memoize(params?: {hashFunction?: (...args: any[]) => any})
```

You can use it in four ways:

- Memoize a `get` accessor,
- Memoize a method which takes no parameters,
- Memoize a method which varies based on all the parameters,
- Memoize a method which varies based on some combination of parameters

You can call memoized methods _within_ the same class, too.
This could be useful if you want to memoize the return value for an entire data set,
and also a filtered or mapped version of that same set.

## Memoize a `get` accessor, or a method which takes no parameters

These both work the same way. Subsequent calls to a memoized method without parameters, or to a `get` accessor, always return the same value.

```typescript
import { memoize } from "mapmoize";

class SimpleFoo {
  // Memoize a method without parameters
  @memoize()
  public getAllTheData() {
    // do some expensive operation to get data
    return data;
  }

  // Memoize a getter
  @memoize()
  public get someValue() {
    // do some expensive operation to calculate value
    return value;
  }
}
```

And then we call them from somewhere else in our code:

```typescript
let simpleFoo = new SimpleFoo();

// Memoizes a calculated value and returns it:
let methodVal1 = simpleFoo.getAllTheData();

// Returns memoized value
let methodVal2 = simpleFoo.getAllTheData();

// Memoizes (lazy-loads) a calculated value and returns it:
let getterVal1 = simpleFoo.someValue;

// Returns memoized value
let getterVal2 = simpleFoo.someValue;
```

## Memoize a method which varies based on all the parameters

Subsequent calls to this style of memoized method will always return the same value.
One thing to have in mind is that we prepare digest for the parameters by casting them to a string.
This could cause some issues since string representation of any object by default is `[object Object]`.
Make sure to use custom hash function (see below) or add indicative `toString` method or `Symbol.toStringTag` getter.

```typescript
import { memoize } from "mapmoize";

class ComplicatedFoo {
  // Memoize a method without parameters (just like the first example)
  @memoize()
  public getAllTheData() {
    // do some expensive operation to get data
    return data;
  }

  // Memoize a method with one parameter
  @memoize()
  public getSomeOfTheData(id: number) {
    let allTheData = this.getAllTheData(); // if you want to!
    // do some expensive operation to get data
    return data;
  }

  // Memoize a method with multiple parameters
  @memoize()
  public getGreeting(name: string, planet: string) {
    return "Hello, " + name + "! Welcome to " + planet;
  }
}
```

We call these methods from somewhere else in our code:

```typescript
let complicatedFoo = new ComplicatedFoo();

// Returns calculated value and memoizes it:
let oneParam1 = complicatedFoo.getSomeOfTheData();

// Returns memoized value
let oneParam2 = complicatedFoo.getSomeOfTheData();

// Memoizes a calculated value and returns it:
// 'Hello, Darryl! Welcome to Earth'
let greeterVal1 = complicatedFoo.getGreeting("Darryl", "Earth");

// Returns memoized value
// 'Hello, Darryl! Welcome to Earth'
let greeterVal2 = complicatedFoo.getGreeting("Darryl", "Earth");
```

## Memoize a method which varies based on some combination of parameters

Pass in a `hashFunction` which takes the same parameters as your target method, or some other custom logic.
The `hashFunction` is called in the context of the method's class.

```typescript
import { memoize } from "mampoize";

class MoreComplicatedFoo {
  // Memoize will remember values based on just the first parameter
  @memoize({
    hashFunction: (name: string, planet: string) => name,
  })
  public getBetterGreeting(name: string, planet: string) {
    return "Hello, " + name + "! Welcome to " + planet;
  }

  // Memoize based on some other logic
  @memoize({
    hashFunction: () => new Date().toISOString(),
  })
  public memoryLeak(greeting: string) {
    return greeting + "!!!!!";
  }
}
```

We call these methods from somewhere else in our code. By now you should be getting the idea:

```typescript
let moreComplicatedFoo = new MoreComplicatedFoo();

// 'Hello, Darryl! Welcome to Earth'
let greeterVal1 = moreComplicatedFoo.getBetterGreeting("Darryl", "Earth");

// The second parameter is ignored.
// 'Hello, Darryl! Welcome to Earth'
let greeterVal2 = moreComplicatedFoo.getBetterGreeting("Darryl", "Mars");

// Fill up the computer with useless greetings:
let greeting = moreComplicatedFoo.memoryLeak("Hello");
```

## Custom arguments cache

We store calculated results in a map `digest(arguments) -> result`. By default it is a vanilla JS `Map`,
which grows unbounded with different arguments. You could customise that by providing a custom map-like structure,
like [lru-map](https://www.npmjs.com/package/lru_map):

```typescript
import { memoize } from "mampoize";
import lru from 'lru_map'

class MoreComplicatedFoo {
  // We remember now the most recently used 100 results.
  @memoize({
    argsCacheBuilder: () => new lru.LRUMap<string, any>(100)
  })
  public getBetterGreeting(name: string, planet: string) {
    return "Hello, " + name + "! Welcome to " + planet;
  }
}
```
