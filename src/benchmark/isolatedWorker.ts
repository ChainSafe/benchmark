import {Benchmark, BenchmarkOpts} from "../types.ts";
import {BenchmarkRunner} from "./runner.ts";

process.once(
  "message",
  async ({
    file,
    prevBench,
    benchmarkOpts,
  }: {file: string; prevBench: Benchmark | null; benchmarkOpts: BenchmarkOpts}) => {
    try {
      const runner = new BenchmarkRunner({prevBench, benchmarkOpts});
      const results = await runner.process([file]);
      if (runner.failedCount > 0) throw new Error(`Failed to run ${file}`);
      // Flush IPC before exiting; benchmark-owned handles must not keep workers alive.
      process.send?.(results, (error: Error | null) => process.exit(error ? 1 : 0));
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
);
