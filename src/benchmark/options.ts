import {AverageCalculationEnum, BenchmarkOpts, ConvergenceEnum} from "../types.js";

export const defaultBenchmarkOptions: Required<BenchmarkOpts> = {
  minRuns: 1,
  maxRuns: Number.POSITIVE_INFINITY,
  minMs: 100,
  maxMs: Number.POSITIVE_INFINITY,
  maxWarmUpRuns: 1000,
  maxWarmUpMs: 500,
  convergeFactor: 0.5 / 100, // 0.5%
  runsFactor: 1,
  yieldEventLoopAfterEach: false,
  timeoutBench: 10_000,
  noThreshold: false,
  triggerGC: false,
  setupFiles: [],
  skip: false,
  only: false,
  threshold: 2,
  convergence: ConvergenceEnum.Linear,
  averageCalculation: AverageCalculationEnum.Simple,
};

export function getBenchmarkOptionsWithDefaults(opts: BenchmarkOpts): Required<BenchmarkOpts> {
  const options = Object.assign({}, defaultBenchmarkOptions, opts);

  if (options.noThreshold) {
    options.threshold = Number.POSITIVE_INFINITY;
  }

  if (options.maxMs && options.maxMs > options.timeoutBench) {
    options.timeoutBench = options.maxMs * 1.5;
  }

  if (options.minMs && options.minMs > options.timeoutBench) {
    options.timeoutBench = options.minMs * 1.5;
  }

  return options;
}
