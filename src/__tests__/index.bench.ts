import { memoize as MMeoize } from "../index.js";
import { Memoize as TMemoize } from "typescript-memoize";
import benchmark from "benchmark";

let suite = new benchmark.Suite();

function formatNumber(number: number) {
  return String(number).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

class WithTypescriptMemoize {
  @TMemoize()
  get n(): number {
    return Math.random();
  }
}
class WithMapmoize {
  @MMeoize()
  get n(): number {
    return Math.random();
  }
}
class Naive {
  #_n: number | undefined;
  get n(): number {
    if (!this.#_n) {
      this.#_n = Math.random();
    }
    return this.#_n;
  }
}
const withTypescriptMemoize = new WithTypescriptMemoize();
const withMapmoize = new WithMapmoize();
const naive = new Naive();

suite
  .add("typescript-memoize", () => {
    withTypescriptMemoize.n;
  })
  .add("mapmoize", () => {
    withMapmoize.n;
  })
  .add("naive", () => {
    naive.n;
  })
  .on("cycle", (event: any) => {
    let name = event.target.name.padEnd(20);
    let hz = formatNumber(event.target.hz.toFixed(0)).padStart(20);
    console.log(`${name}${hz} ops/sec`);
  })
  .on("error", (event: any) => {
    console.error(event.target.error);
    process.exit(1);
  })
  .run();

debugger
