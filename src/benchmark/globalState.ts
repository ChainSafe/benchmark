import type {Suite, SuiteCollector, Task} from "@vitest/runner";
import Debug from "debug";
import {BenchmarkOpts, BenchmarkResult, BenchmarkResults} from "../types.ts";

const debug = Debug("@chainsafe/benchmark/state");

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
const optsMap = new Map<object, BenchmarkOpts>();

export const store = {
  getResult(id: string): BenchmarkResult | undefined {
    return results.get(id);
  },
  setResult(id: string, result: BenchmarkResult): void {
    debug("setting result for %o", id);
    results.set(id, result);
  },
  getAllResults(): BenchmarkResults {
    return [...results.values()];
  },
  getOptions(suite: Task | Suite | SuiteCollector): BenchmarkOpts | undefined {
    return optsMap.get(suite);
  },
  setOptions(suite: Task | Suite | SuiteCollector, opts: BenchmarkOpts): void {
    if (Object.keys(opts).length === 0) return;

    debug("setting options for %o with name %o %O", suite.type, suite.name, opts);
    optsMap.set(suite, opts);
  },
  removeOptions(suite: Task | Suite | SuiteCollector): void {
    debug("removing options for %o with name %o", suite.type, suite.name);
    optsMap.delete(suite);
  },
  setGlobalOptions(opts: Partial<BenchmarkOpts>): void {
    debug("setting global options %O", opts);
    globalOpts = opts;
  },
  getGlobalOptions(): BenchmarkOpts | undefined {
    return globalOpts;
  },
};
