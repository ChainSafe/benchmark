import fs from "node:fs";
import path from "node:path";
import {getCurrentSuite, setFn} from "@vitest/runner";
import {createChainable} from "@vitest/runner/utils";
import {store} from "./globalState.js";
import {BenchApi, BenchmarkOpts, BenchmarkRunOptsWithFn, PartialBy} from "../types.js";
import {runBenchFn} from "./runBenchmarkFn.js";
import {getBenchmarkOptionsWithDefaults} from "./options.js";

export const bench: BenchApi = createBenchmarkFunction(function <T, T2>(
  this: Record<"skip" | "only", boolean | undefined>,
  idOrOpts: string | PartialBy<BenchmarkRunOptsWithFn<T, T2>, "fn">,
  fn?: (arg: T) => void | Promise<void>
) {
  const {fn: benchTask, before, beforeEach, ...opts} = coerceToOptsObj(idOrOpts, fn);
  const currentSuite = getCurrentSuite();

  const globalOptions = store.getGlobalOptions() ?? {};
  const parentOptions = store.getOptions(currentSuite) ?? {};
  const options = getBenchmarkOptionsWithDefaults({...globalOptions, ...parentOptions, ...opts});

  async function handler(): Promise<void> {
    // Ensure bench id is unique
    if (store.getResult(opts.id) && !opts.skip) {
      throw Error(`test titles must be unique, duplicated: '${opts.id}'`);
    }

    const {result, runsNs} = await runBenchFn<T, T2>({
      ...options,
      fn: benchTask,
      before,
      beforeEach,
    } as BenchmarkRunOptsWithFn<T, T2>);

    // Store result for:
    // - to persist benchmark data latter
    // - to render with the custom reporter
    store.setResult(opts.id, result);

    // Persist full results if requested. dir is created in `beforeAll`
    const benchmarkResultsCsvDir = process.env.BENCHMARK_RESULTS_CSV_DIR;
    if (benchmarkResultsCsvDir) {
      fs.mkdirSync(benchmarkResultsCsvDir, {recursive: true});
      const filename = `${result.id}.csv`;
      const filepath = path.join(benchmarkResultsCsvDir, filename);
      fs.writeFileSync(filepath, runsNs.join("\n"));
    }
  }

  const task = currentSuite.task(opts.id, {
    skip: opts.skip ?? this.skip,
    only: opts.only ?? this.only,
    sequential: true,
    concurrent: false,
    timeout: options.timeoutBench,
    meta: {
      "chainsafe/benchmark": true,
    },
  });

  setFn(task, handler);
  store.setOptions(task, opts);

  const cleanup = (): void => {
    store.removeOptions(task);
    // Clear up the assigned handler to clean the memory
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    setFn(task, null);
  };

  task.onFailed = [cleanup];
  task.onFinished = [cleanup];
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
  const suite = getCurrentSuite();
  store.setOptions(suite, opts);

  suite.on("afterAll", () => {
    store.removeOptions(suite);
  });
}

export const setBenchmarkOptions = setBenchOpts;
