export interface FileCollectionOptions {
  /** File extensions to use */
  extension: string[];
  /** Files, dirs, globs to ignore */
  ignore: string[];
  /** Find files recursively */
  recursive: boolean;
  /** Glob pattern to load spec */
  spec: string[];
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
};

// Create partial only for specific keys
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type BenchmarkRunOptsWithFn<T, T2> = BenchmarkOpts & {
  id: string;
  fn: (arg: T) => void | Promise<void>;
  before?: () => T2 | Promise<T2>;
  beforeEach?: (arg: T2, i: number) => T | Promise<T>;
};

export interface BenchFuncApi {
  <T, T2>(opts: BenchmarkRunOptsWithFn<T, T2>): void;
  <T, T2>(idOrOpts: string | Omit<BenchmarkRunOptsWithFn<T, T2>, "fn">, fn: (arg: T) => void): void;
  <T, T2>(
    idOrOpts: string | PartialBy<BenchmarkRunOptsWithFn<T, T2>, "fn">,
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
  id: string;
  averageNs: number;
  runsDone: number;
  totalMs: number;
  // For reporter
  threshold: number | undefined;
};

/** Time results for a single benchmark (all items) */
export type Benchmark = {
  commitSha: string;
  results: BenchmarkResults;
};

/** All benchmarks organized by branch */
export type BenchmarkHistory = {
  benchmarks: {
    [branch: string]: Benchmark[];
  };
};

export type BenchmarkComparison = {
  currCommitSha: string;
  prevCommitSha: string | null;
  someFailed: boolean;
  results: ResultComparison[];
};

export type ResultComparison = {
  id: string;
  currAverageNs: number;
  prevAverageNs: number | null;
  ratio: number | null;
  isFailed: boolean;
  isImproved: boolean;
};
