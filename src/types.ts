export type EnumLike<T> = T[keyof T];

export interface FileCollectionOptions {
  /** File extensions to use */
  extension: string[];
  /** Files, dirs, globs to ignore */
  ignore: string[];
  /** Find files recursively */
  recursive: boolean;
  /** Glob pattern to load spec */
  spec: string[];
  /** Sort the test files */
  sort?: boolean;
}

export type StorageOptions = {
  defaultBranch?: string;
  persistBranches?: string[];
  benchmarksPerBranch?: number;
  compareBranch?: string;
  compareCommit?: string;
  prune?: boolean;
  persist?: boolean;
  noThrow?: boolean;
  skipPostComment?: boolean;
  historyLocal?: string | boolean;
  historyGaCache?: string | boolean;
  historyS3?: boolean;
};

export type BenchmarkOpts = {
  /** Max number of fn() runs, after which the benchmark stops */
  maxRuns?: number;
  /** Min number of fn() runs before considering stopping the benchmark after converging */
  minRuns?: number;
  /** Max total miliseconds of runs, after which the benchmark stops */
  maxMs?: number;
  /** Min total miiliseconds of runs before considering stopping the benchmark after converging */
  minMs?: number;
  /**
   * Maximum real benchmark function run time before starting to count towards results. Set to 0 to not warm-up.
   * May warm up for less ms if the `maxWarmUpRuns` condition is met first.
   */
  maxWarmUpMs?: number;
  /**
   * Maximum benchmark function runs before starting to count towards results. Set to 0 to not warm-up.
   * May warm up for less ms if the `maxWarmUpMs` condition is met first.
   */
  maxWarmUpRuns?: number;
  /** Convergance factor (0,1) at which the benchmark automatically stops. Set to 1 to disable */
  convergeFactor?: number;
  /** If fn() contains a foor loop repeating a task N times, you may set runsFactor = N to scale down the results. */
  runsFactor?: number;
  /** Run `sleep(0)` after each fn() call. Use when the event loop needs to tick to free resources created by fn() */
  yieldEventLoopAfterEach?: boolean;
  /** Hard timeout */
  timeoutBench?: number;
  // For reporter
  /** Customize the threshold for this specific benchmark. Set to Infinity to disable it */
  threshold?: number;
  /** Equivalent to setting threshold = Infinity */
  noThreshold?: boolean;

  only?: boolean;
  skip?: boolean;
  /** Setup files to load before the test files */
  setupFiles?: string[];
  /** Trigger GC cleanup every test to have consistent memory usage */
  triggerGC?: boolean;
  /**
   * The algorithm to detect the convergence to stop the benchmark function runs.
   * */
  convergence?: Convergence;
  /** Use simple average of all runs or clean the outliers before calculating average */
  averageCalculation?: AverageCalculation;
};

// Create partial only for specific keys
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type BenchId = string;
type CommitSha = string;

export type BenchmarkRunOptsWithFn<T, T2> = BenchmarkOpts & {
  id: BenchId;
  fn: (arg: T) => void | Promise<void>;
  before?: () => T2 | Promise<T2>;
  beforeEach?: (arg: T2, i: number) => T | Promise<T>;
};

export interface BenchFuncApi {
  <T, T2>(opts: BenchmarkRunOptsWithFn<T, T2>): void;
  <T, T2>(idOrOpts: string | Omit<BenchmarkRunOptsWithFn<T, T2>, "fn">, fn: (arg: T) => void): void;
  <T, T2>(
    idOrOpts: BenchId | PartialBy<BenchmarkRunOptsWithFn<T, T2>, "fn">,
    fn?: (arg: T) => void | Promise<void>
  ): void;
}

export interface BenchApi extends BenchFuncApi {
  only: BenchFuncApi;
  skip: BenchFuncApi;
}

export type BenchmarkResults = BenchmarkResult[];

/** Time results for a single benchmark item */
export type BenchmarkResult = {
  id: BenchId;
  averageNs: number;
  runsDone: number;
  totalMs: number;
  // For reporter
  threshold: number | undefined;
};

/** Time results for a single benchmark (all items) */
export type Benchmark = {
  commitSha: CommitSha;
  dirName?: string;
  results: BenchmarkResults;
};

/** All benchmarks organized by branch */
export type BenchmarkHistory = {
  benchmarks: {
    [branch: string]: Benchmark[];
  };
};

export type PerformanceReport = {
  currCommitSha: CommitSha;
  prevCommitSha: CommitSha | null;
  someFailed: boolean;
  results: PerformanceResult[];
};

export type PerformanceResult = {
  id: BenchId;
  currAverageNs: number;
  prevAverageNs: number | null;
  ratio: number | null;
  isFailed: boolean;
  isImproved: boolean;
};

export type BenchmarkComparisonReport = {
  someFailed: boolean;
  // The first element will always contain origin which is used to compare
  commitsShas: (CommitSha | null)[];
  dirNames: string[];
  // The result array contains the origin commit first and then targets
  results: Map<BenchId, BenchmarkComparisonResult[]>;
};

export type BenchmarkComparisonResult = {
  id: BenchId;
  originAverageNs: number | null;
  targetAverageNs: number | null;
  ratio: number | null;
  isFailed: boolean;
  isImproved: boolean;
};

/** Algorithms to detect when to stop the benchmark runs */
export const convergence = {
  /**
   * **Linear**:
   *
   * Uses a moving-average approach to check for convergence by comparing
   * how consecutive averages change over time. Concretely, the logic tracks
   * a few past average values (e.g. last 3 averages) and determines if:
   *
   * 1. The difference between the most recent average and the oldest
   *    average is sufficiently small (linear convergence).
   * 2. Additionally, it may check that the “midpoint” or intermediate average
   *    is consistent with the trend (quadratic element in the code).
   *
   * This approach works best in relatively stable environments or for
   * functions whose execution times fluctuate minimally. However, if there is
   * high noise or if runs are extremely fast (on the nanosecond scale),
   * you might see premature stopping or extended run times.
   */
  Linear: "linear",

  /**
   * **Coefficient of Variation (CV)**:
   *
   * This approach calculates the ratio of the sample standard deviation
   * to the mean (σ/μ) over all data points collected so far.
   * - If the CV falls below a specified threshold (convergeFactor),
   *   we consider that “stable” and stop.
   * - As a fallback, if too many runs occur without convergence,
   *   the code may compare mean vs. median to decide if it’s time to stop.
   *
   * Strengths:
   * - Good for benchmarks with moderate noise: it normalizes variation by
   *   the mean, so it handles scale differences well.
   * - Straightforward to implement and interpret (CV < x%).
   *
   * Limitations:
   * - Highly noisy benchmarks or micro benchmarks (few nanoseconds) can
   *   cause erratic CV values. If the noise is large relative to the mean,
   *   convergence may never be triggered. Conversely, extremely uniform runs
   *   can cause an instant (potentially premature) stop.
   */
  CV: "cv",
} as const;
export type Convergence = EnumLike<typeof convergence>;

/** How to calculate average for output */
export const averageCalculation = {
  /** Calculate simple average */
  Simple: "simple",
  /** Clean the outliers first then calculate the average */
  CleanOutliers: "clean-outliers",
} as const;
export type AverageCalculation = EnumLike<typeof averageCalculation>;

export type ConvergenceCheckFn = (runIdx: number, totalNs: bigint, runNs: bigint[]) => boolean;
