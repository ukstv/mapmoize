import { test } from "uvu";
import { snoop } from "snoop";
import * as assert from "uvu/assert";
import { memoize, Strategy } from "../index.js";

const noop = (...args: any[]) => {};

class MyClass {
  readonly valueSpy = snoop(noop);

  @memoize({ strategy: Strategy.REPLACE })
  get value(): number {
    this.valueSpy.fn();
    return Math.random();
  }
}

test("replace getter property", () => {
  const a = new MyClass();
  const b = new MyClass();
  // No own property
  assert.equal(Reflect.getOwnPropertyDescriptor(a, "value"), undefined);
  assert.equal(Reflect.getOwnPropertyDescriptor(b, "value"), undefined);
  assert.equal(a.value, a.value);
  assert.equal(b.value, b.value);
  // Now value is set as own property
  assert.ok(Reflect.getOwnPropertyDescriptor(a, "value"));
  assert.ok(Reflect.getOwnPropertyDescriptor(b, "value"));
  assert.not.equal(a.value, b.value);
  assert.equal(a.valueSpy.callCount, 1);
  assert.equal(b.valueSpy.callCount, 1);
});

test.run();
