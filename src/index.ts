export {suite as describe, beforeEach, beforeAll} from "@vitest/runner";
export {bench, setBenchOpts, setBenchmarkOptions} from "./benchmark/index.js";

import {bench} from "./benchmark/index.js";

/**
 * @deprecated We recommend to use `bench` instead.
 */
export const itBench = bench;
