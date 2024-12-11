import fs from "node:fs";
import path from "node:path";
import {getCurrentSuite} from "@vitest/runner";
import {createChainable} from "@vitest/runner/utils";
import {store} from "./globalState.js";
import {BenchApi, BenchmarkOpts, BenchmarkRunOptsWithFn, PartialBy} from "../types.js";
import {runBenchFn} from "./runBenchmarkFn.js";
import {optionsDefault} from "../cli/options.js";

export const bench: BenchApi = createBenchmarkFunction(function <T, T2>(
  this: Record<"skip" | "only", boolean | undefined>,
  idOrOpts: string | PartialBy<BenchmarkRunOptsWithFn<T, T2>, "fn">,
  fn?: (arg: T) => void | Promise<void>
) {
  const {fn: benchTask, ...opts} = coerceToOptsObj(idOrOpts, fn);
  const currentSuite = getCurrentSuite();

  const globalOptions = store.getGlobalOptions() ?? {};
  const parentOptions = store.getOptions(getCurrentSuite()) ?? {};
  const options = {...globalOptions, ...parentOptions, ...opts};
  const {timeoutBench, maxMs, minMs} = options;

  let timeout = timeoutBench ?? optionsDefault.timeoutBench;
  if (maxMs && maxMs > timeout) {
    timeout = maxMs * 1.5;
  }

  if (minMs && minMs > timeout) {
    timeout = minMs * 1.5;
  }

  const task = currentSuite.task(opts.id, {
    skip: opts.skip ?? this.skip,
    only: opts.only ?? this.only,
    sequential: true,
    concurrent: false,
    timeout,
    meta: {
      "chainsafe/benchmark": true,
    },
    async handler() {
      // Ensure bench id is unique
      if (store.getResult(opts.id) && !opts.skip) {
        throw Error(`test titles must be unique, duplicated: '${opts.id}'`);
      }

      // Persist full results if requested. dir is created in `beforeAll`
      const benchmarkResultsCsvDir = process.env.BENCHMARK_RESULTS_CSV_DIR;
      const persistRunsNs = Boolean(benchmarkResultsCsvDir);

      const {result, runsNs} = await runBenchFn({...options, fn: benchTask}, persistRunsNs);

      // Store result for:
      // - to persist benchmark data latter
      // - to render with the custom reporter
      store.setResult(opts.id, result);

      if (benchmarkResultsCsvDir) {
        fs.mkdirSync(benchmarkResultsCsvDir, {recursive: true});
        const filename = `${result.id}.csv`;
        const filepath = path.join(benchmarkResultsCsvDir, filename);
        fs.writeFileSync(filepath, runsNs.join("\n"));
      }
    },
  });

  store.setOptions(task, opts);
});

function createBenchmarkFunction(
  fn: <T, T2>(
    this: Record<"skip" | "only", boolean | undefined>,
    idOrOpts: string | PartialBy<BenchmarkRunOptsWithFn<T, T2>, "fn">,
    fn?: (arg: T) => void | Promise<void>
  ) => void
): BenchApi {
  return createChainable(["skip", "only"], fn) as BenchApi;
}

function coerceToOptsObj<T, T2>(
  idOrOpts: string | PartialBy<BenchmarkRunOptsWithFn<T, T2>, "fn">,
  fn?: (arg: T) => void | Promise<void>
): BenchmarkRunOptsWithFn<T, T2> {
  let opts: BenchmarkRunOptsWithFn<T, T2>;

  if (typeof idOrOpts === "string") {
    if (!fn) throw Error("fn arg must be set");
    opts = {id: idOrOpts, fn, threshold: optionsDefault.threshold};
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

/**
 * Customize benchmark opts for a describe block
 * ```ts
 * describe("suite A1", function () {
 *   setBenchOpts({runs: 100});
 *   // 100 runs
 *   itBench("bench A1.1", function() {});
 *   itBench("bench A1.2", function() {});
 *   // 300 runs
 *   itBench({id: "bench A1.3", runs: 300}, function() {});
 *
 *   // Supports nesting, child has priority over parent.
 *   // Arrow functions can be used, won't break it.
 *   describe("suite A2", () => {
 *     setBenchOpts({runs: 200});
 *     // 200 runs.
 *     itBench("bench A2.1", () => {});
 *   })
 * })
 * ```
 */
export function setBenchOpts(opts: BenchmarkOpts): void {
  store.setOptions(getCurrentSuite(), opts);
}

export const setBenchmarkOptions = setBenchOpts;
