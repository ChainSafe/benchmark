import fs from "node:fs";
import path from "node:path";
import {getCurrentSuite, Suite, SuiteCollector} from "@vitest/runner";
import {createChainable} from "@vitest/runner/utils";
import {store} from "./globalState.js";
import {BenchmarkOpts} from "../types.js";
import {runBenchFn} from "./runBenchFn.js";

export type BenchmarkRunOptsWithFn<T, T2> = BenchmarkOpts & {
  id: string;
  fn: (arg: T) => void | Promise<void>;
  before?: () => T2 | Promise<T2>;
  beforeEach?: (arg: T2, i: number) => T | Promise<T>;
};

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export function getRootSuite(suite: Suite | SuiteCollector): Suite {
  if (suite.type === "collector") {
    return getRootSuite(suite.tasks[0] as Suite);
  }

  if (suite.name === "") {
    return suite;
  } else if (suite.suite) {
    getRootSuite(suite.suite);
  } else {
    return suite;
  }

  throw new Error("Can not find root suite");
}

export const bench = createBenchmarkFunction(function <T, T2>(
  this: Record<"skip" | "only", boolean | undefined>,
  idOrOpts: string | PartialBy<BenchmarkRunOptsWithFn<T, T2>, "fn">,
  fn?: (arg: T) => void | Promise<void>
) {
  const {fn: benchTask, ...opts} = coerceToOptsObj(idOrOpts, fn);

  const task = getCurrentSuite().task(opts.id, {
    skip: opts.skip ?? this.skip,
    only: opts.only ?? this.only,
    sequential: true,
    concurrent: false,
    meta: {
      "dapplion/benchmark": true,
    },
    async handler(context) {
      const parentSuite = context.task.suite;
      const parentOpts = parentSuite ? store.getOptions(parentSuite) : {};

      // TODO: Find better way to point to root suite
      const rootSuite = context.task.suite;
      const rootOpts = rootSuite ? store.getRootOptions(rootSuite) : {};

      const fullOptions = Object.assign({}, rootOpts, parentOpts, opts);

      // Ensure bench id is unique
      if (store.getResult(opts.id) && !opts.skip) {
        throw Error(`test titles must be unique, duplicated: '${opts.id}'`);
      }

      // Extend timeout if maxMs is set
      // if (opts.timeoutBench !== undefined) {
      // this.timeout(opts.timeoutBench);
      // } else {
      // const timeout = this.timeout();
      // if (opts.maxMs && opts.maxMs > timeout) {
      // this.timeout(opts.maxMs * 1.5);
      // } else if (opts.minMs && opts.minMs > timeout) {
      // this.timeout(opts.minMs * 1.5);
      // }
      // }

      // Persist full results if requested. dir is created in `beforeAll`
      const benchmarkResultsCsvDir = process.env.BENCHMARK_RESULTS_CSV_DIR;
      const persistRunsNs = Boolean(benchmarkResultsCsvDir);

      const {result, runsNs} = await runBenchFn({...fullOptions, fn: benchTask}, persistRunsNs);

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
): BenchFuncApi {
  return createChainable(["skip", "only"], fn) as BenchFuncApi;
}

interface BenchFuncApi {
  <T, T2>(opts: BenchmarkRunOptsWithFn<T, T2>): void;
  <T, T2>(idOrOpts: string | Omit<BenchmarkRunOptsWithFn<T, T2>, "fn">, fn: (arg: T) => void): void;
  <T, T2>(
    idOrOpts: string | PartialBy<BenchmarkRunOptsWithFn<T, T2>, "fn">,
    fn?: (arg: T) => void | Promise<void>
  ): void;
}

interface BenchApi extends BenchFuncApi {
  only: BenchFuncApi;
  skip: BenchFuncApi;
}

export const itBench = bench as BenchApi;

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
