import {
  File,
  startTests,
  Suite,
  Task,
  TaskResultPack,
  VitestRunner,
  VitestRunnerConfig,
  VitestRunnerImportSource,
} from "@vitest/runner";
import {Benchmark, BenchmarkResults} from "../types.js";
import {BenchmarkReporter} from "./reporter.js";
import {store} from "./globalState.js";

export class BenchmarkRunner implements VitestRunner {
  config: VitestRunnerConfig;
  reporter: BenchmarkReporter;

  constructor(protected opts: {prevBench: Benchmark | null}) {
    this.config = {
      root: "",
      sequence: {seed: 1234, hooks: "list", setupFiles: "list"},
      passWithNoTests: false,
      maxConcurrency: 1,
      hookTimeout: 10_0000,
      testTimeout: 10_0000,
      setupFiles: [],
      retry: 0,
    };
    this.reporter = new BenchmarkReporter(opts.prevBench, 0.2);
  }

  onBeforeRunSuite(suite: Suite): void {
    this.reporter.onSuiteStarted(suite);
  }

  onAfterRunSuite(suite: Suite): void {
    this.reporter.onSuiteFinished(suite);
  }

  onBeforeRunTask(task: Task): void {
    this.reporter.onTestStarted(task);
  }

  onAfterRunTask(task: Task): void {
    this.reporter.onTestFinished(task);
  }

  onAfterRunFiles(files: File[]): void {
    this.reporter.onComplete(files);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async importFile(filepath: string, _source: VitestRunnerImportSource): Promise<void> {
    // TODO: Implement file caching mechanism later
    await import(filepath);
  }

  async process(files: string[]): Promise<BenchmarkResults> {
    const res = await startTests(files, this);

    if (res[0].result?.state === "pass") {
      return store.getAllResults();
    }

    return store.getAllResults();
  }
}
