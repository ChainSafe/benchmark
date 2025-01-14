import {Options} from "yargs";
import {StorageOptions, BenchmarkOpts, FileCollectionOptions} from "../types.js";

export const optionsDefault = {
  threshold: 2,
  timeoutBench: 10_000,
  historyLocalPath: "./benchmark_data",
  historyCacheKey: "benchmark_data",
};

type CLIFileCollectionOptions = Omit<FileCollectionOptions, "spec">;
type CLIStorageOptions = StorageOptions;
type CLIBenchmarkOptions = Omit<BenchmarkOpts, "only" | "skip" | "noThreshold">;
type ICliCommandOptions<OwnArgs> = Required<{[key in keyof OwnArgs]: Options}>;

export type CLIOptions = CLIFileCollectionOptions & CLIStorageOptions & CLIBenchmarkOptions;

const fileGroup = "Files options:";
const storageGroup = "Storage options:";
const benchmarkGroup = "Benchmark options:";

export const fileCollectionOptions: ICliCommandOptions<CLIFileCollectionOptions> = {
  extension: {
    description: "File extension(s) to load",
    type: "array",
    alias: "ext",
    default: ["js", "cjs", "mjs", "ts"],
    group: fileGroup,
  },
  ignore: {
    description: "Ignore file(s) or glob pattern(s)",
    type: "array",
    alias: "exclude",
    group: fileGroup,
  },
  recursive: {
    description: "Look for tests in subdirectories",
    type: "boolean",
    default: false,
    group: fileGroup,
  },
  sort: {
    description: "Sort the tests",
    type: "boolean",
    default: false,
    group: fileGroup,
  },
};

export const storageOptions: ICliCommandOptions<CLIStorageOptions> = {
  defaultBranch: {
    description: "Provide the default branch of this repository to prevent fetching from Github",
    type: "string",
    group: storageGroup,
  },
  persistBranches: {
    description: "Choose what branches to persist benchmark data",
    type: "array",
    defaultDescription: "default-branch",
    group: storageGroup,
  },
  benchmarksPerBranch: {
    description: "Limit number of benchmarks persisted per branch",
    type: "number",
    defaultDescription: "Infinity",
    group: storageGroup,
  },
  compareBranch: {
    description: "Compare new benchmark data against the latest available benchmark in this branch",
    type: "string",
    defaultDescription: "default-branch",
    group: storageGroup,
  },
  compareCommit: {
    description: "Compare new benchmark data against the benchmark data associated with a specific commit",
    type: "string",
    group: storageGroup,
  },
  prune: {
    description:
      "When persisting history, delete benchmark data associated with commits that are no longer in the current git history",
    type: "boolean",
    group: storageGroup,
  },
  persist: {
    description: "Force persisting benchmark data in history",
    type: "boolean",
    group: storageGroup,
  },
  noThrow: {
    description: "Exit cleanly even if a preformance regression was found",
    type: "boolean",
    group: storageGroup,
  },
  skipPostComment: {
    description: "Skip post Github comment step if run on Github CI",
    type: "boolean",
    group: storageGroup,
  },
  historyLocal: {
    alias: ["local"],
    description:
      "Persist benchmark history locally. May specify just a boolean to use a default path, or provide a path",
    type: "string",
    defaultDescription: optionsDefault.historyLocalPath,
    group: storageGroup,
  },
  historyGaCache: {
    alias: ["ga-cache"],
    description:
      "Persist benchmark history in Github Actions cache. Requires Github authentication. May specify just a boolean to use a default cache key or provide a custom key",
    type: "string",
    defaultDescription: optionsDefault.historyCacheKey,
    group: storageGroup,
  },
  historyS3: {
    alias: ["s3"],
    description: "Persist benchmark history in an Amazon S3 bucket. Requires Github authentication",
    type: "string",
    group: storageGroup,
  },
};

// BenchmarkOpts
export const benchmarkOptions: ICliCommandOptions<CLIBenchmarkOptions> = {
  threshold: {
    description:
      "Ratio of new average time per run vs previos time per run to consider a failure. Set to 'Infinity' to disable it.",
    type: "number",
    default: optionsDefault.threshold,
    group: benchmarkGroup,
  },
  maxRuns: {
    type: "number",
    description: "Max number of fn() runs, after which the benchmark stops",
    group: benchmarkGroup,
  },
  minRuns: {
    type: "number",
    description: "Min number of fn() runs before considering stopping the benchmark after converging",
    group: benchmarkGroup,
  },
  maxMs: {
    type: "number",
    description: "Max total miliseconds of runs, after which the benchmark stops",
    group: benchmarkGroup,
  },
  minMs: {
    type: "number",
    description: "Min total miiliseconds of runs before considering stopping the benchmark after converging",
    group: benchmarkGroup,
  },
  maxWarmUpMs: {
    type: "number",
    description:
      "Maximum real benchmark function run time before starting to count towards results. Set to 0 to not warm-up. May warm up for less ms if the `maxWarmUpRuns` condition is met first.",
    group: benchmarkGroup,
  },
  maxWarmUpRuns: {
    type: "number",
    description:
      "Maximum benchmark function runs before starting to count towards results. Set to 0 to not warm-up. May warm up for less ms if the `maxWarmUpMs` condition is met first.",
    group: benchmarkGroup,
  },
  convergeFactor: {
    type: "number",
    description: "Convergance factor (0,1) at which the benchmark automatically stops. Set to 1 to disable",
    group: benchmarkGroup,
  },
  runsFactor: {
    type: "number",
    description:
      "If fn() contains a foor loop repeating a task N times, you may set runsFactor = N to scale down the results.",
    group: benchmarkGroup,
  },
  yieldEventLoopAfterEach: {
    type: "boolean",
    description:
      "Run `sleep(0)` after each fn() call. Use when the event loop needs to tick to free resources created by fn()",
    group: benchmarkGroup,
  },
  timeoutBench: {
    type: "number",
    description: "Hard timeout for each benchmark",
    default: optionsDefault.timeoutBench,
    group: benchmarkGroup,
  },
  setupFiles: {
    type: "array",
    description: "List of setup files to load before the tests",
    default: [],
    group: benchmarkGroup,
  },
};
