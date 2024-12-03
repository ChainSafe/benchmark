import type {Suite, Task} from "@vitest/runner";
import {BenchmarkResult, BenchmarkOpts, BenchmarkResults} from "../types.js";

/**t
 * Map of results by root suite.
 * Before running mocha, you must register the root suite here
 */
const results = new Map<string, BenchmarkResult>();

/**
 * Global opts from CLI
 */
const optsByRootSuite = new WeakMap<object, BenchmarkOpts>();

/**
 * Map to persist options set in describe blocks
 */
const optsMap = new WeakMap<object, BenchmarkOpts>();

export const store = {
  getResult(id: string): BenchmarkResult | undefined {
    return results.get(id);
  },
  setResult(id: string, result: BenchmarkResult): void {
    results.set(id, result);
  },
  getAllResults(): BenchmarkResults {
    return [...results.values()];
  },
  getOptions(suite: Task): BenchmarkOpts | undefined {
    return optsMap.get(suite);
  },
  setOptions(suite: Task, opts: BenchmarkOpts): void {
    optsMap.set(suite, opts);
  },
  getRootOptions(suite: Suite): BenchmarkOpts | undefined {
    return optsByRootSuite.get(suite);
  },
  setRootOptions(suite: Suite, opts: BenchmarkOpts): void {
    optsByRootSuite.set(suite, opts);
  },
};
