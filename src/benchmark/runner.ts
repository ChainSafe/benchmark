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
import Debug from "debug";
import {Benchmark, BenchmarkOpts, BenchmarkResults} from "../types.js";
import {BenchmarkReporter} from "./reporter.js";
import {store} from "./globalState.js";

const debug = Debug("@chainsafe/benchmark/runner");

export class BenchmarkRunner implements VitestRunner {
  readonly triggerGC: boolean;
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
    this.triggerGC = benchmarkOpts.triggerGC ?? false;
    this.prevBench = prevBench;
    this.benchmarkOpts = benchmarkOpts;
    this.reporter = new BenchmarkReporter({prevBench, benchmarkOpts});
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

  async onTaskFinished(task: Task): Promise<void> {
    this.reporter.onTestFinished(task);

    // To help maintain consistent memory usage patterns
    // we trigger garbage collection manually
    if (this.triggerGC && global.gc) {
      global.gc();
      // Make sure the syn operation is off the event loop
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onAfterRunTask(task: Task): Promise<void> {
    // To help maintain consistent memory usage patterns
    // we trigger garbage collection manually
    if (this.triggerGC && global.gc) {
      global.gc();
      // Make sure the syn operation is off the event loop
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  onAfterRunFiles(files: File[]): void {
    this.reporter.onComplete(files);
  }

  async importFile(filepath: string, source: VitestRunnerImportSource): Promise<void> {
    let url = filepath;
    if (source === "setup") {
      url = `${url}?key=${Date.now()}`;
    }
    // TODO: Implement file caching mechanism later
    await import(url);
  }

  async process(files: string[]): Promise<BenchmarkResults> {
    store.setGlobalOptions(this.benchmarkOpts);

    debug("Starting tests %O", files);
    const res = await startTests(files, this);

    const passed = res.filter((r) => r.result?.state == "pass");
    const skipped = res.filter((r) => r.result?.state == "skip");
    const failed = res.filter((r) => r.result?.state == "fail");

    debug("Finished tests. passed: %i, skipped: %i, failed: %i", passed.length, skipped.length, failed.length);

    if (failed.length > 0) {
      throw failed[0].result?.errors;
    }

    if (passed.length + skipped.length === res.length) {
      return store.getAllResults();
    }

    throw new Error("Some tests cause returned with unknown state");
  }
}
