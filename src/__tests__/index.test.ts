import { suite, test } from "uvu";
import { snoop } from "snoop";
import * as assert from "uvu/assert";
import { memoize } from "../index.js";

const noop = (...args: any[]) => {};

class MyClass {
  readonly numberSpy = snoop(noop);
  readonly valueSpy = snoop(noop);
  readonly getGreetingSpy = snoop(noop);
  readonly id = Math.floor(Math.random() * 1000);

  @memoize()
  getNumber(): number {
    this.numberSpy.fn();
    return Math.random();
  }

  @memoize()
  get value(): number {
    this.valueSpy.fn();
    return Math.random();
  }

  @memoize()
  getGreeting(greeting: string, planet: string): string {
    this.getGreetingSpy.fn(...arguments);
    return greeting + ", " + planet;
  }

  @memoize()
  getGreeting2(greeting: string, planet: any): string {
    this.getGreetingSpy.fn(...arguments);
    return greeting + ", " + planet;
  }

  @memoize({ hashFunction: (a: number, b: { id: number }) => a + ";" + b.id })
  getGreeting3(a: string, b: { id: number }) {
    this.getGreetingSpy.fn(...arguments);
    return a + ", " + b.id;
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return `<MyClass #${this.id}>`;
  }
}

test("when decorating a method", () => {
  const a = new MyClass();
  const b = new MyClass();
  assert.equal(a.getNumber(), a.getNumber());
  assert.not.equal(a.getNumber(), b.getNumber());
  assert.equal(a.numberSpy.callCount, 1);
  assert.equal(b.numberSpy.callCount, 1);
});

test("when decorating a get accessor", () => {
  const a = new MyClass();
  const b = new MyClass();
  assert.equal(a.value, a.value);
  assert.not.equal(a.value, b.value);
  assert.equal(a.valueSpy.callCount, 1);
  assert.equal(b.valueSpy.callCount, 1);
});

const whenMethod = suite("when decorating a method");

whenMethod("call the original method with the original arguments", () => {
  const a = new MyClass();
  const val1 = a.getGreeting("Halló", "heimur");
  assert.equal(val1, "Halló, heimur");
  assert.equal(a.getGreetingSpy.calls[0].arguments, ["Halló", "heimur"]);
});

whenMethod("call the original method once", () => {
  const a = new MyClass();

  const val1 = a.getGreeting("Ciao", "mondo"); // In Italian
  const val2 = a.getGreeting("Ciao", "mondo");

  assert.equal(val1, "Ciao, mondo");
  assert.equal(val2, "Ciao, mondo");
  assert.equal(a.getGreetingSpy.callCount, 1);
});

whenMethod("not share between two instances of the same class", () => {
  const a = new MyClass();
  const b = new MyClass();

  let val1 = a.getGreeting("Hej", "världen"); // In Swedish
  let val2 = b.getGreeting("Hej", "världen");

  assert.equal(val1, "Hej, världen");
  assert.equal(val2, "Hej, världen");

  assert.equal(a.getGreetingSpy.callCount, 1);
  assert.equal(b.getGreetingSpy.callCount, 1);
});

whenMethod("call the original method once", () => {
  const a = new MyClass();
  const val1 = a.getGreeting("Bonjour", "le monde");
  const val2 = a.getGreeting("Hello", "World");
  assert.equal(val1, "Bonjour, le monde");
  assert.equal(val2, "Hello, World");
  assert.equal(a.getGreetingSpy.callCount, 2);
});

whenMethod("memoize using string representation", () => {
  const a = new MyClass();
  const toStringSnoopB = snoop(noop);
  const toStringSnoopC = snoop(noop);
  const b = new (class {
    toString() {
      toStringSnoopB.fn();
      return "same thing";
    }
  })();
  const c = new (class {
    toString() {
      toStringSnoopC.fn();
      return "same thing";
    }
  })();
  const val1 = a.getGreeting2("hello", b);
  const val2 = a.getGreeting2("hello", c);
  assert.equal(val1, val2);
  assert.equal(a.getGreetingSpy.callCount, 1);
  assert.equal(toStringSnoopB.callCount, 2); // One for arguments digest, another for greeting
  assert.equal(toStringSnoopC.callCount, 1); // Just one to calculate the arguments digest

  // All vanilla objects are serialized to [object Object] for digest purposes
  // For this case we might need a custom hash function.
  a.getGreeting2("hello", {});
  a.getGreeting2("hello", { id: 1 });
  assert.equal(a.getGreetingSpy.callCount, 2);
});

whenMethod("memoize using custom hash function", () => {
  const a = new MyClass();

  // These are equal for memoization purposes
  const b = { id: 1 };
  const c = { id: 1, addition: true };
  a.getGreeting3("hello", b);
  a.getGreeting3("hello", c);
  // Just `b` is called, we only consider `.id` property.
  assert.equal(a.getGreetingSpy.callCount, 1);
  assert.equal(a.getGreetingSpy.calls[0].arguments, ["hello", { id: 1 }]);

  // New invocation for a different `.id`.
  const d = { id: 2 };
  a.getGreeting3("hello", d);
  assert.equal(a.getGreetingSpy.callCount, 2);
  assert.equal(a.getGreetingSpy.calls[1].arguments, ["hello", { id: 2 }]);
});

whenMethod.run();
test.run();
