export {suite as describe, beforeEach, beforeAll, afterAll, afterEach} from "@vitest/runner";
export {bench, setBenchOpts, setBenchmarkOptions} from "./benchmark/index.ts";

import {bench} from "./benchmark/index.ts";

/**
 * @deprecated We recommend to use `bench` instead.
 */
export const itBench = bench;
