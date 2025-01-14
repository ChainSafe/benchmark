import {Task, Suite, File} from "@vitest/runner";
import {color, consoleLog, symbols} from "../utils/output.js";
import {store} from "./globalState.js";
import {Benchmark, BenchmarkOpts, BenchmarkResult} from "../types.js";
import {formatResultRow} from "./format.js";
import {optionsDefault} from "../cli/options.js";

export class BenchmarkReporter {
  indents = 0;
  failed = 0;
  passed = 0;
  skipped = 0;

  readonly prevResults: Map<string, BenchmarkResult>;
  readonly threshold: number;

  constructor({prevBench, benchmarkOpts}: {prevBench: Benchmark | null; benchmarkOpts: BenchmarkOpts}) {
    this.prevResults = new Map<string, BenchmarkResult>();
    this.threshold = benchmarkOpts.threshold ?? optionsDefault.threshold;

    if (prevBench) {
      for (const bench of prevBench.results) {
        this.prevResults.set(bench.id, bench);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTestStarted(_task: Task): void {
    // this.log(task.name, "started");
  }

  onTestFinished(task: Task): void {
    const {result} = task;

    if (!result) {
      consoleLog(`${this.indent()}${color("pending", " - %s")}`, `${task.name} - can not find result`);
      return;
    }

    switch (result.state) {
      case "skip": {
        this.skipped++;
        consoleLog(`${this.indent()}${color("pending", "  - %s")}`, task.name);
        break;
      }
      case "fail": {
        this.failed++;
        consoleLog(this.indent() + color("fail", "  %d) %s"), ++this.failed, task.name);
        consoleLog(task.result?.errors);
        break;
      }
      case "pass": {
        try {
          const result = store.getResult(task.name);

          if (!result) {
            // Render regular test
            const fmt = this.indent() + color("checkmark", "  " + symbols.ok) + color("pass", " %s");
            consoleLog(fmt, task.name);
            this.passed++;
            return;
          }

          // Render benchmark
          const threshold = result.threshold ?? this.threshold;
          const prevResult = this.prevResults.get(result.id) ?? null;
          const resultRow = formatResultRow(result, prevResult, threshold);

          if (!prevResult) {
            const fmt = this.indent() + color("checkmark", "  " + symbols.ok) + " " + resultRow;
            consoleLog(fmt);
            this.passed++;
            return;
          }

          const ratio = result.averageNs / prevResult.averageNs;
          if (ratio > threshold) {
            const fmt = this.indent() + color("fail", "  " + symbols.bang) + " " + resultRow;
            consoleLog(fmt);
            this.failed++;
            return;
          }

          const fmt = this.indent() + color("checkmark", "  " + symbols.ok) + " " + resultRow;
          consoleLog(fmt);
          this.passed++;
        } catch (e) {
          this.failed++;
          consoleLog(e);
          process.exitCode = 1;
          throw e;
        }
      }
    }
  }

  onSuiteStarted(suite: Suite): void {
    this.indents++;
    consoleLog(color("suite", "%s%s"), this.indent(), suite.name);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSuiteFinished(_suite: Suite): void {
    --this.indents;

    if (this.indents === 1) {
      consoleLog();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onComplete(_files: File[]): void {
    consoleLog();
    this.indents += 2;
    consoleLog(color("checkmark", "%s%s"), this.indent(), `${this.passed} passing`);
    consoleLog(color("fail", "%s%s"), this.indent(), `${this.failed} failed`);
    consoleLog(color("pending", "%s%s"), this.indent(), `${this.skipped} pending`);
    consoleLog();
  }

  protected indent(): string {
    return Array(this.indents).join("  ");
  }
}
