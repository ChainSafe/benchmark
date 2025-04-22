import {File, Suite, Task} from "@vitest/runner";
import {Benchmark, BenchmarkOpts, BenchmarkResult} from "../types.ts";
import {color, consoleLog, symbols} from "../utils/output.ts";
import {formatResultRow} from "./format.ts";
import {store} from "./globalState.ts";
import {defaultBenchmarkOptions} from "./options.ts";

export class BenchmarkReporter {
  indents = 0;
  failed = 0;
  passed = 0;
  skipped = 0;

  readonly prevResults: Map<string, BenchmarkResult>;
  readonly threshold: number;

  constructor({prevBench, benchmarkOpts}: {prevBench: Benchmark | null; benchmarkOpts: BenchmarkOpts}) {
    this.prevResults = new Map<string, BenchmarkResult>();
    this.threshold = benchmarkOpts.threshold ?? defaultBenchmarkOptions.threshold;

    if (prevBench) {
      for (const bench of prevBench.results) {
        this.prevResults.set(bench.id, bench);
      }
    }
  }

  onTestStarted(task: Task): void {
    if (task.mode === "skip") {
      this.skipped++;
      consoleLog(`${this.indent()}${color("pending", "  - %s")}`, task.name);
    } else if (task.mode === "todo") {
      this.skipped++;
      consoleLog(`${this.indent()}${color("pending", "  - %s")}`, task.name);
    }
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
        const fmt = this.indent() + color("fail", "  " + symbols.err) + color("fail", " %s");
        consoleLog(fmt, task.name);
        consoleLog(task.result?.errors?.map((e) => e.stackStr).join("\n"));
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

    if (suite.result?.state === "fail") {
      consoleLog("Error loading suit.", suite.result?.errors);

      --this.indents;
      consoleLog();
      return;
    }

    // If the suit contains only skipped tests then runner does not start the test tasks at all
    if (suite.tasks.filter((t) => t.mode !== "skip" && t.mode !== "todo").length === 0) {
      for (const task of suite.tasks) {
        if (task.type === "suite") {
          this.onSuiteStarted(task);
        } else {
          this.skipped++;
          consoleLog(`${this.indent()}${color("pending", "  - %s")}`, task.name);
        }
      }

      --this.indents;
      consoleLog();
    }
  }

  onSuiteFinished(_suite: Suite): void {
    --this.indents;

    if (this.indents === 1) {
      consoleLog();
    }
  }

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
