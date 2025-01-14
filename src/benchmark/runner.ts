import {
  File,
  startTests,
  Suite,
  Task,
  VitestRunner,
  VitestRunnerConfig,
  VitestRunnerImportSource,
} from "@vitest/runner";
import path from "node:path";
import {Benchmark, BenchmarkOpts, BenchmarkResults} from "../types.js";
import {BenchmarkReporter} from "./reporter.js";
import {store} from "./globalState.js";

export class BenchmarkRunner implements VitestRunner {
  readonly config: VitestRunnerConfig;
  readonly reporter: BenchmarkReporter;
  readonly prevBench: Benchmark | null;
  readonly benchmarkOpts: BenchmarkOpts;

  constructor({prevBench, benchmarkOpts}: {prevBench: Benchmark | null; benchmarkOpts: BenchmarkOpts}) {
    this.config = {
      root: "",
      sequence: {seed: 1234, hooks: "list", setupFiles: "list"},
      passWithNoTests: false,
      maxConcurrency: 1,
      hookTimeout: 10_0000,
      testTimeout: 10_0000,
      setupFiles: benchmarkOpts.setupFiles ? benchmarkOpts.setupFiles.map((s) => path.resolve(s)) : [],
      retry: 0,
    };
    this.prevBench = prevBench;
    this.benchmarkOpts = benchmarkOpts;
    this.reporter = new BenchmarkReporter({prevBench, benchmarkOpts});
  }

  onBeforeRunSuite(suite: Suite): void {
    this.reporter.onSuiteStarted(suite);
  }

  onAfterRunSuite(suite: Suite): void {
    this.reporter.onSuiteFinished(suite);
    store.removeOptions(suite);
  }

  onBeforeRunTask(task: Task): void {
    this.reporter.onTestStarted(task);
  }

  onAfterRunTask(task: Task): void {
    this.reporter.onTestFinished(task);
    store.removeOptions(task);
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
    store.setGlobalOptions(this.benchmarkOpts);

    const res = await startTests(files, this);

    const passed = res.filter((r) => r.result?.state == "pass");
    const skipped = res.filter((r) => r.result?.state == "skip");
    const failed = res.filter((r) => r.result?.state == "fail");

    if (failed.length > 0) {
      throw failed[0].result?.errors;
    }

    if (passed.length + skipped.length === res.length) {
      return store.getAllResults();
    }

    throw new Error("Some tests cause returned with unknown state");
  }
}
