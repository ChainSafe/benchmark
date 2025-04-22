import {bench, describe} from "../../src/index.ts";

// This test file is to validate the error cases manually
// should not be included into actual benchmarks as there are cases
// in this file which will always fail.
describe("Hooks", () => {
  bench("normal benchmark", () => {
    const arr = Array.from({length: 10}, (_, i) => i);
    arr.reduce((total, curr) => total + curr, 0);
  });

  bench.skip("normal skipped", () => {
    const arr = Array.from({length: 10}, (_, i) => i);
    arr.reduce((total, curr) => total + curr, 0);
  });

  describe("before", () => {
    bench({
      id: "before failed",
      before: () => {
        throw new Error("Failed in before");
      },
      fn: () => {
        const arr = Array.from({length: 10}, (_, i) => i);
        arr.reduce((total, curr) => total + curr, 0);
      },
    });
  });

  describe("beforeEach", () => {
    bench({
      id: "beforeEach failed",
      beforeEach: () => {
        throw new Error("Failed in beforeEach");
      },
      fn: () => {
        const arr = Array.from({length: 10}, (_, i) => i);
        arr.reduce((total, curr) => total + curr, 0);
      },
    });
  });

  bench({
    id: "error during fn",
    fn: () => {
      throw new Error("Failed in fn");
    },
  });
});
