import {bench, describe} from "../../src/index.js";

// This test file is to validate the error cases manually
// should not be included into actual benchmarks as there are cases
// in this file which will always fail.
describe.skip("skipped describe", () => {
  bench("skipped describe", () => {
    const arr = Array.from({length: 10}, (_, i) => i);
    arr.reduce((total, curr) => total + curr, 0);
  });
});
