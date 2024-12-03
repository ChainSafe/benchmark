import {BenchmarkResult, BenchmarkOpts} from "../types";

/**t
 * Map of results by root suie.
 * Before running mocha, you must register the root suite here
 */
export const resultsByRootSuite = new WeakMap<object, Map<string, BenchmarkResult>>();

/**
 * Global opts from CLI
 */
export const optsByRootSuite = new WeakMap<object, BenchmarkOpts>();

/**
 * Map to persist options set in describe blocks
 */
export const optsMap = new WeakMap<object, BenchmarkOpts>();
