import {bench, describe, setBenchOpts} from "../../src/index.ts";

// As of Jun 17 2021
// Compare state root
// ================================================================
// ssz.Root.equals                                                        891265.6 ops/s      1.122000 us/op 10017946 runs    15.66 s
// ssz.Root.equals with valueOf()                                         692041.5 ops/s      1.445000 us/op 8179741 runs    15.28 s
// byteArrayEquals with valueOf()                                         853971.0 ops/s      1.171000 us/op 9963051 runs    16.07 s

describe("Array iteration", () => {
  setBenchOpts({maxMs: 60 * 1000, convergeFactor: 1 / 100});

  // nonce = 5
  const n = 1e6;
  const arr = Array.from({length: n}, (_, i) => i);

  bench("sum array with raw for loop", () => {
    let sum = 0;
    for (let i = 0, len = arr.length; i < len; i++) {
      sum += i;
    }
    return sum;
  });

  bench("sum array with reduce", () => {
    arr.reduce((total, curr) => total + curr, 0);

    // Uncomment below to cause a guaranteed performance regression
    // arr.reduce((total, curr) => total + curr, 0);
    // arr.reduce((total, curr) => total + curr, 0);
  });

  // Test before and beforeEach hooks

  bench({
    id: "sum array with reduce beforeEach",
    beforeEach: () => Array.from({length: 1e4}, (_, i) => i),
    fn: (arrayFromBeforeEach) => {
      arrayFromBeforeEach.reduce((total, curr) => total + curr, 0);

      // Uncomment below to cause a guaranteed performance regression
      // arr.reduce((total, curr) => total + curr, 0);
      // arr.reduce((total, curr) => total + curr, 0);
    },
  });

  bench({
    id: "sum array with reduce before beforeEach",
    before: () => Array.from({length: 1e4}, (_, i) => i),
    beforeEach: (arrFromBefore) => arrFromBefore.slice(0),
    fn: (arrayFromBeforeEach) => {
      arrayFromBeforeEach.reduce((total, curr) => total + curr, 0);

      // Uncomment below to cause a guaranteed performance regression
      // arr.reduce((total, curr) => total + curr, 0);
      // arr.reduce((total, curr) => total + curr, 0);
    },
  });

  // Reporter options
  bench({
    id: "sum array with reduce high threshold",
    threshold: 5,
    fn: () => {
      arr.reduce((total, curr) => total + curr, 0);
    },
  });

  bench({
    id: "sum array with reduce no threshold",
    threshold: Infinity,
    fn: () => {
      arr.reduce((total, curr) => total + curr, 0);
    },
  });
});
