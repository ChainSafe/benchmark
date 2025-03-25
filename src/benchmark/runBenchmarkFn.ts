import Debug from "debug";
import {BenchmarkResult, BenchmarkOpts, Convergence, ConvergenceCheckFn, ConvergenceEnum} from "../types.js";
import {calcSum, filterOutliers, OutlierSensitivityEnum} from "../utils/math.js";
import {getBenchmarkOptionsWithDefaults} from "./options.js";
import {createLinearConvergenceCriteria} from "./convergence/linearAverage.js";
import {createCVConvergenceCriteria} from "./convergence/coefficientOfVariance.js";

const debug = Debug("@chainsafe/benchmark/run");

const convergenceCriteria: Record<Convergence, (startMs: number, opts: Required<BenchmarkOpts>) => ConvergenceCheckFn> =
  {
    [ConvergenceEnum.Linear]: createLinearConvergenceCriteria,
    [ConvergenceEnum.CV]: createCVConvergenceCriteria,
  };

export type BenchmarkRunOpts = BenchmarkOpts & {
  id: string;
};

export type BenchmarkRunOptsWithFn<T, T2> = BenchmarkOpts & {
  id: string;
  fn: (arg: T) => void | Promise<void>;
  before?: () => T2 | Promise<T2>;
  beforeEach?: (arg: T2, i: number) => T | Promise<T>;
};

export async function runBenchFn<T, T2>(
  opts: BenchmarkRunOptsWithFn<T, T2>
): Promise<{result: BenchmarkResult; runsNs: bigint[]}> {
  const {id, before, beforeEach, fn, ...rest} = opts;
  debug("running %o", id);
  const benchOptions = getBenchmarkOptionsWithDefaults(rest);
  const {maxMs, maxRuns, maxWarmUpMs, maxWarmUpRuns, runsFactor, threshold, convergence, averageCalculation} =
    benchOptions;

  if (maxWarmUpMs >= maxMs) {
    throw new Error(`Warmup time must be lower than max run time. maxWarmUpMs: ${maxWarmUpMs}, maxMs: ${maxMs}`);
  }

  if (maxWarmUpRuns >= maxRuns) {
    throw new Error(`Warmup runs must be lower than max runs. maxWarmUpRuns: ${maxWarmUpRuns}, maxRuns: ${maxRuns}`);
  }

  if (averageCalculation !== "simple" && averageCalculation !== "clean-outliers") {
    throw new Error(`Average calculation logic is not defined. ${averageCalculation}`);
  }

  if (!Object.values(ConvergenceEnum).includes(convergence)) {
    throw new Error(`Unknown convergence value ${convergence}. Valid values are ${Object.values(ConvergenceEnum)}`);
  }

  // Ratio of maxMs that the warmup is allow to take from elapsedMs
  const maxWarmUpRatio = 0.5;
  const maxWarmUpNs = BigInt(benchOptions.maxWarmUpMs) * BigInt(1e6);

  const runsNs: bigint[] = [];
  const startRunMs = Date.now();

  const shouldTerminate = convergenceCriteria[convergence](startRunMs, benchOptions);

  let runIdx = 0;
  let totalNs = BigInt(0);

  let totalWarmUpNs = BigInt(0);
  let totalWarmUpRuns = 0;
  let isWarmUpPhase = maxWarmUpNs > 0 && maxWarmUpRuns > 0;

  debug("starting before");
  const inputAll = before ? await before() : (undefined as unknown as T2);
  debug("finished before");

  while (true) {
    debug("executing individual run isWarmUpPhase=%o", isWarmUpPhase);
    const elapsedMs = Date.now() - startRunMs;

    debug("starting beforeEach");
    const input = beforeEach ? await beforeEach(inputAll, runIdx) : (undefined as unknown as T);
    debug("finished beforeEach");

    const startNs = process.hrtime.bigint();
    await fn(input);
    const endNs = process.hrtime.bigint();

    const runNs = endNs - startNs;

    // Useful when the event loop needs to tick to free resources created by fn()
    if (opts.yieldEventLoopAfterEach) {
      await new Promise((r) => setTimeout(r, 0));
    }

    if (isWarmUpPhase) {
      // Warm-up, do not count towards results
      totalWarmUpRuns += 1;
      totalWarmUpNs += runNs;

      // On any warm-up finish condition, mark isWarmUp = true to prevent having to check them again
      if (totalWarmUpNs >= maxWarmUpNs || totalWarmUpRuns >= maxWarmUpRuns || elapsedMs / maxMs >= maxWarmUpRatio) {
        isWarmUpPhase = false;
      }

      continue;
    }

    // Persist results
    runIdx += 1;
    totalNs += runNs;
    runsNs.push(runNs);

    if (shouldTerminate(runIdx, totalNs, runsNs)) {
      break;
    }
  }

  if (runIdx === 0) {
    // Try to guess what happened
    if (totalWarmUpRuns > 0) {
      throw Error(
        `
No run was completed before 'maxMs' ${maxMs}, but did ${totalWarmUpRuns} warm-up runs.
Consider adjusting 'maxWarmUpMs' or 'maxWarmUpRuns' options orextend 'maxMs'
if your function is very slow.
`.trim()
      );
    } else {
      throw Error(
        `
No run was completed before 'maxMs' ${maxMs}. Consider extending the 'maxMs' time if
either the before(), beforeEach() or fn() functions are too slow.
`.trim()
      );
    }
  }

  let averageNs!: number;

  if (averageCalculation === "simple") {
    averageNs = Number(totalNs / BigInt(runIdx)) / runsFactor;
  }

  if (averageCalculation === "clean-outliers") {
    const cleanData = filterOutliers(runsNs, false, OutlierSensitivityEnum.Mild);
    averageNs = Number(calcSum(cleanData) / BigInt(cleanData.length)) / runsFactor;
  }

  return {
    result: {
      id: id,
      averageNs,
      runsDone: runIdx,
      totalMs: Date.now() - startRunMs,
      threshold,
    },
    runsNs,
  };
}
