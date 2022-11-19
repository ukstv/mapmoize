import { memoize as MMeoize, Strategy } from "../index.js";
import { Memoize as TMemoize } from "typescript-memoize";
import benchmark from "benchmark";

let suite = new benchmark.Suite();

function formatNumber(number: number) {
  return String(number).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

// Use typescript-memoize decorator
class WithTypescriptMemoize {
  @TMemoize()
  get n(): number {
    return Math.random();
  }
}

// Use mapmoize decorator
class WithMapmoize {
  @MMeoize()
  get n(): number {
    return Math.random();
  }

  @MMeoize({ strategy: Strategy.REPLACE })
  get m(): number {
    return Math.random();
  }
}

// Use private class field to memoize value
class WithNaivePrivateField {
  #_n: number | undefined;
  get n(): number {
    if (!this.#_n) {
      this.#_n = Math.random();
    }
    return this.#_n;
  }
}

// Use public class field to memoize value
class WithNaivePublicField {
  _n: number | undefined;
  get n(): number {
    if (!this._n) {
      this._n = Math.random();
    }
    return this._n;
  }
}
const withTypescriptMemoize = new WithTypescriptMemoize();
const withMapmoize = new WithMapmoize();
const withNaivePrivateField = new WithNaivePrivateField();
const withNaivePublicField = new WithNaivePublicField();

suite
  .add("getter: typescript-memoize", () => {
    withTypescriptMemoize.n;
  })
  .add("getter: mapmoize", () => {
    withMapmoize.n;
  })
  .add("getter: mapmoize replace", () => {
    withMapmoize.m;
  })
  .add("getter: naive private field", () => {
    withNaivePrivateField.n;
  })
  .add("getter: naive public field", () => {
    withNaivePublicField.n;
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
