import path from "node:path";
import {
  File,
  Suite,
  Task,
  VitestRunner,
  VitestRunnerConfig,
  VitestRunnerImportSource,
  startTests,
} from "@vitest/runner";
import Debug from "debug";
import {Benchmark, BenchmarkOpts, BenchmarkResults} from "../types.ts";
import {consoleError} from "../utils/output.ts";
import {store} from "./globalState.ts";
import {BenchmarkReporter} from "./reporter.ts";

const debug = Debug("@chainsafe/benchmark/runner");

export class BenchmarkRunner implements VitestRunner {
  readonly triggerGC: boolean;
  failedCount = 0;
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

  async onAfterRunTask(_task: Task): Promise<void> {
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

    debug("starting tests %O", files);
    const res = await startTests(files, this);

    const passed = res.filter((r) => r.result?.state === "pass");
    const skipped = res.filter((r) => r.result?.state === "skip");
    const failed = res.filter((r) => r.result?.state === "fail");

    debug("finished tests. passed: %i, skipped: %i, failed: %i", passed.length, skipped.length, failed.length);

    if (passed.length + skipped.length + failed.length !== res.length) {
      throw new Error("Some tests returned with unknown state");
    }

    if (failed.length > 0) {
      this.failedCount = failed.length;
      consoleError(`${failed.length} benchmark(s) failed:\n`);
      for (const f of failed) {
        const error = f.result?.errors?.[0];
        const errorMsg = error?.message ?? error?.toString() ?? "unknown error";
        consoleError(`  ✖ ${f.name}: ${errorMsg}`);
      }
    }

    return store.getAllResults();
  }
}
