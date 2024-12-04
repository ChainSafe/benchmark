import {suite, test} from "@vitest/runner";

export {bench, itBench, setBenchOpts, setBenchmarkOptions} from "./benchmark/index.js";
export const describe = suite;
export const it = test;
