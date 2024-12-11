import type {Suite, SuiteCollector, Task} from "@vitest/runner";
import {BenchmarkResult, BenchmarkOpts, BenchmarkResults} from "../types.js";

/**t
 * Map of results by root suite.
 */
const results = new Map<string, BenchmarkResult>();

/**
 * Global opts from CLI
 */
let globalOpts: BenchmarkOpts | undefined;

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
  getOptions(suite: Task | Suite | SuiteCollector): BenchmarkOpts | undefined {
    return optsMap.get(suite);
  },
  setOptions(suite: Task | Suite | SuiteCollector, opts: BenchmarkOpts): void {
    optsMap.set(suite, opts);
  },
  removeOptions(suite: Task | Suite): void {
    optsMap.delete(suite);
  },
  setGlobalOptions(opts: Partial<BenchmarkOpts>): void {
    globalOpts = opts;
  },
  getGlobalOptions(): BenchmarkOpts | undefined {
    return globalOpts;
  },
};
