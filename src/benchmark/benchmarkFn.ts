import fs from "node:fs";
import path from "node:path";
import {getCurrentSuite, getCurrentTest, test} from "@vitest/runner";

import {optsByRootSuite, optsMap, resultsByRootSuite} from "./globalState.js";
import {BenchmarkOpts, BenchmarkResult} from "../types.js";
import {runBenchFn} from "./runBenchFn.js";

export type BenchmarkRunOptsWithFn<T, T2> = BenchmarkOpts & {
  id: string;
  fn: (arg: T) => void | Promise<void>;
  before?: () => T2 | Promise<T2>;
  beforeEach?: (arg: T2, i: number) => T | Promise<T>;
};

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

function getOptsFromParent(parent: object): BenchmarkOpts {
  // console.trace("Called to get options.");
  const optsArr: BenchmarkOpts[] = [];
  getOptsFromSuite(parent, optsArr);
  // Merge opts, highest parent = lowest priority
  return Object.assign({}, ...optsArr.reverse()) as BenchmarkOpts;
}

/**
 * Recursively append suite opts from child to parent.
 *
 * @returns `[suiteChildOpts, suiteParentOpts, suiteParentParentOpts]`
 */
function getOptsFromSuite(suite: object, optsArr: BenchmarkOpts[]): void {
  const suiteOpts = optsMap.get(suite);
  if (suiteOpts) {
    optsArr.push(suiteOpts);
  }
}

const itBenchFn: ItBenchFn = function itBench<T, T2>(
  this: object,
  idOrOpts: string | PartialBy<BenchmarkRunOptsWithFn<T, T2>, "fn">,
  fn?: (arg: T) => void | Promise<void>
): void {
  let opts = coerceToOptsObj(idOrOpts, fn);
  const itFn = opts.only ? test : opts.skip ? test.skip : test;

  itFn(opts.id, async () => {
    const parent = getCurrentTest();
    const optsParent = parent ? getOptsFromParent(parent) : undefined;

    // Get results array from root suite
    const rootSuite = getCurrentSuite();
    let results = resultsByRootSuite.get(rootSuite);
    let rootOpts = optsByRootSuite.get(rootSuite);

    if (!results) {
      results = new Map<string, BenchmarkResult>();
      resultsByRootSuite.set(rootSuite, results);
    }

    if (!rootOpts) {
      rootOpts = {};
      optsByRootSuite.set(rootSuite, rootOpts);
    }

    opts = Object.assign({}, rootOpts, optsParent, opts);

    // Ensure bench id is unique
    if (results.has(opts.id)) {
      throw Error(`test titles must be unique, duplicated: '${opts.id}'`);
    }

    // Extend timeout if maxMs is set
    if (opts.timeoutBench !== undefined) {
      // this.timeout(opts.timeoutBench);
    } else {
      // const timeout = this.timeout();
      // if (opts.maxMs && opts.maxMs > timeout) {
      // this.timeout(opts.maxMs * 1.5);
      // } else if (opts.minMs && opts.minMs > timeout) {
      // this.timeout(opts.minMs * 1.5);
      // }
    }

    // Persist full results if requested. dir is created in `beforeAll`
    const benchmarkResultsCsvDir = process.env.BENCHMARK_RESULTS_CSV_DIR;
    const persistRunsNs = Boolean(benchmarkResultsCsvDir);

    const {result, runsNs} = await runBenchFn(opts, persistRunsNs);

    // Store result for:
    // - to persist benchmark data latter
    // - to render with the custom reporter
    results.set(opts.id, result);

    if (benchmarkResultsCsvDir) {
      fs.mkdirSync(benchmarkResultsCsvDir, {recursive: true});
      const filename = `${result.id}.csv`;
      const filepath = path.join(benchmarkResultsCsvDir, filename);
      fs.writeFileSync(filepath, runsNs.join("\n"));
    }
  });
};

interface ItBenchFn {
  <T, T2>(opts: BenchmarkRunOptsWithFn<T, T2>): void;
  <T, T2>(idOrOpts: string | Omit<BenchmarkRunOptsWithFn<T, T2>, "fn">, fn: (arg: T) => void): void;
  <T, T2>(
    idOrOpts: string | PartialBy<BenchmarkRunOptsWithFn<T, T2>, "fn">,
    fn?: (arg: T) => void | Promise<void>
  ): void;
}

interface ItBench extends ItBenchFn {
  only: ItBenchFn;
  skip: ItBenchFn;
}

function coerceToOptsObj<T, T2>(
  idOrOpts: string | PartialBy<BenchmarkRunOptsWithFn<T, T2>, "fn">,
  fn?: (arg: T) => void | Promise<void>
): BenchmarkRunOptsWithFn<T, T2> {
  let opts: BenchmarkRunOptsWithFn<T, T2>;

  if (typeof idOrOpts === "string") {
    if (!fn) throw Error("fn arg must be set");
    opts = {id: idOrOpts, fn};
  } else {
    if (fn) {
      opts = {...idOrOpts, fn};
    } else {
      const optsWithFn = idOrOpts as BenchmarkRunOptsWithFn<T, T2>;
      if (!optsWithFn.fn) throw Error("opts.fn arg must be set");
      opts = optsWithFn;
    }
  }

  return opts;
}

export const itBench = itBenchFn as ItBench;
