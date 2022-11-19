import { memoize as MMeoize, Strategy } from "../index.js";
import { Memoize as TMemoize } from "typescript-memoize";
import benchmark from "benchmark";
import * as console from "console";

let suite = new benchmark.Suite();

function formatNumber(number: number) {
  return String(number).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

// Use typescript-memoize decorator
class WithTypescriptMemoize {
  @TMemoize()
  n(): number {
    return Math.random();
  }

  @TMemoize()
  fibonacci(n: number): number {
    return n < 2 ? n : this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }

  @TMemoize({ hashFunction: (n: number, m: number) => `${n}!${m}` })
  series(n: number, m: number): number {
    return n < 2 ? n : (this.series(n - 1, m) + this.series(n - 2, m)) * m;
  }
}

// Use mapmoize decorator
class WithMapmoize {
  @MMeoize()
  n(): number {
    return Math.random();
  }

  @MMeoize({ strategy: Strategy.REPLACE })
  nR(): number {
    return Math.random();
  }

  @MMeoize()
  fibonacci(n: number): number {
    return n < 2 ? n : this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }

  @MMeoize({ strategy: Strategy.REPLACE })
  fibonacciR(n: number): number {
    return n < 2 ? n : this.fibonacciR(n - 1) + this.fibonacciR(n - 2);
  }

  @MMeoize({
    hashFunction: (n: number, m: number) => `${n}!${m}`,
  })
  series(n: number, m: number): number {
    return n < 2 ? n : (this.series(n - 1, m) + this.series(n - 2, m)) * m;
  }

  @MMeoize({
    strategy: Strategy.REPLACE,
    hashFunction: (n: number, m: number) => `${n}!${m}`,
  })
  seriesR(n: number, m: number): number {
    return n < 2 ? n : (this.seriesR(n - 1, m) + this.seriesR(n - 2, m)) * m;
  }
}

// Use private class field to memoize value
class WithNaivePrivateField {
  #_n: number | undefined;
  #_fibonacci: Map<number, number> = new Map();
  #_series: Map<string, number> = new Map();
  n(): number {
    if (!this.#_n) {
      this.#_n = Math.random();
    }
    return this.#_n;
  }

  fibonacci(n: number): number {
    if (this.#_fibonacci.has(n)) return this.#_fibonacci.get(n)!;
    const calculated =
      n < 2 ? n : this.fibonacci(n - 1) + this.fibonacci(n - 2);
    this.#_fibonacci.set(n, calculated);
    return calculated;
  }

  series(n: number, m: number): number {
    const digest = `${n}!${m}`;
    if (this.#_series.has(digest)) {
      return this.#_series.get(digest)!;
    }
    const calculated =
      n < 2 ? n : (this.series(n - 1, m) + this.series(n - 2, m)) * m;
    this.#_series.set(digest, calculated);
    return calculated;
  }
}

// Use public class field to memoize value
class WithNaivePublicField {
  _n: number | undefined;
  _fibonacci: Map<number, number> = new Map();
  _series: Map<string, number> = new Map();
  n(): number {
    if (!this._n) {
      this._n = Math.random();
    }
    return this._n;
  }

  fibonacci(n: number): number {
    if (this._fibonacci.has(n)) return this._fibonacci.get(n)!;
    const calculated =
      n < 2 ? n : this.fibonacci(n - 1) + this.fibonacci(n - 2);
    this._fibonacci.set(n, calculated);
    return calculated;
  }

  series(n: number, m: number): number {
    const digest = `${n}!${m}`;
    if (this._series.has(digest)) {
      return this._series.get(digest)!;
    }
    const calculated =
      n < 2 ? n : (this.series(n - 1, m) + this.series(n - 2, m)) * m;
    this._series.set(digest, calculated);
    return calculated;
  }
}
const withTypescriptMemoize = new WithTypescriptMemoize();
const withMapmoize = new WithMapmoize();
const withNaivePrivateField = new WithNaivePrivateField();
const withNaivePublicField = new WithNaivePublicField();

suite
  .add("function(0): typescript-memoize", () => {
    withTypescriptMemoize.n();
  })
  .add("function(0): mapmoize", () => {
    withMapmoize.n();
  })
  .add("function(0): mapmoize replace", () => {
    withMapmoize.nR();
  })
  .add("function(0): naive private field", () => {
    withNaivePrivateField.n();
  })
  .add("function(0): naive public field", () => {
    withNaivePublicField.n();
  })
  .add("function(1): typescript-memoize", () => {
    const n = Math.floor(Math.random() * 14);
    withTypescriptMemoize.fibonacci(n);
  })
  .add("function(1): mapmoize", () => {
    const n = Math.floor(Math.random() * 14);
    withMapmoize.fibonacci(n);
  })
  .add("function(1): mapmoize replace", () => {
    const n = Math.floor(Math.random() * 14);
    withMapmoize.fibonacciR(n);
  })
  .add("function(1): naive private field", () => {
    const n = Math.floor(Math.random() * 14);
    withNaivePrivateField.fibonacci(n);
  })
  .add("function(1): naive public field", () => {
    const n = Math.floor(Math.random() * 14);
    withNaivePublicField.fibonacci(n);
  })
  .add("function(2): typescript-memoize", () => {
    const n = Math.floor(Math.random() * 10);
    const m = Math.floor(Math.random() * 3);
    withTypescriptMemoize.series(n, m);
  })
  .add("function(2): mapmoize", () => {
    const n = Math.floor(Math.random() * 10);
    const m = Math.floor(Math.random() * 3);
    withMapmoize.series(n, m);
  })
  .add("function(2): mapmoize replace", () => {
    const n = Math.floor(Math.random() * 10);
    const m = Math.floor(Math.random() * 3);
    withMapmoize.seriesR(n, m);
  })
  .add("function(2): naive private field", () => {
    const n = Math.floor(Math.random() * 10);
    const m = Math.floor(Math.random() * 3);
    withNaivePrivateField.series(n, m);
  })
  .add("function(2): naive public field", () => {
    const n = Math.floor(Math.random() * 10);
    const m = Math.floor(Math.random() * 3);
    withNaivePublicField.series(n, m);
  })
  .on("cycle", (event: any) => {
    let name = event.target.name.padEnd(40);
    let hz = formatNumber(event.target.hz.toFixed(0)).padStart(20);
    console.log(`${name}${hz} ops/sec`);
  })
  .on("error", (event: any) => {
    console.error(event.target.error);
    process.exit(1);
  })
  .run();
