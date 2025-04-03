import {bench, describe} from "../../src/index.ts";

// This test file is to validate the error cases manually
// should not be included into actual benchmarks as there are cases
// in this file which will always fail.
describe("only skipped tests", () => {
  bench.skip("only skipped test in suite", () => {
    const arr = Array.from({length: 10}, (_, i) => i);
    arr.reduce((total, curr) => total + curr, 0);
  });

  bench.skip("only skipped test 2 in suite", () => {
    const arr = Array.from({length: 10}, (_, i) => i);
    arr.reduce((total, curr) => total + curr, 0);
  });
});
