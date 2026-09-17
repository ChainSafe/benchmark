import {fork} from "node:child_process";
import {Benchmark, BenchmarkOpts, BenchmarkResults} from "../types.ts";

/** Run sequentially: do not start another file until the previous process has exited. */
export async function runIsolated(
  files: string[],
  prevBench: Benchmark | null,
  benchmarkOpts: BenchmarkOpts
): Promise<BenchmarkResults> {
  const results: BenchmarkResults = [];
  for (const file of files) {
    const fileResults = await new Promise<BenchmarkResults>((resolve, reject) => {
      const worker = new URL(
        import.meta.url.endsWith(".ts") ? "./isolatedWorker.ts" : "./isolatedWorker.js",
        import.meta.url
      );
      const child = fork(worker, [], {stdio: ["inherit", "inherit", "inherit", "ipc"], serialization: "advanced"});
      let received: BenchmarkResults | undefined;
      let interrupted = false;
      const interrupt = (signal: NodeJS.Signals): void => {
        interrupted = true;
        child.kill(signal);
      };
      const onInt = (): void => interrupt("SIGINT");
      const onTerm = (): void => interrupt("SIGTERM");
      process.once("SIGINT", onInt);
      process.once("SIGTERM", onTerm);
      child.on("message", (message: BenchmarkResults) => {
        received = message;
      });
      child.on("error", reject);
      child.on("close", (code, signal) => {
        process.removeListener("SIGINT", onInt);
        process.removeListener("SIGTERM", onTerm);
        if (interrupted) reject(new Error(`Isolated benchmark ${file} interrupted`));
        else if (code !== 0 || signal) reject(new Error(`Isolated benchmark ${file} exited with ${signal ?? code}`));
        else if (!received) reject(new Error(`Isolated benchmark ${file} exited without results`));
        else resolve(received);
      });
      child.send({file, prevBench, benchmarkOpts});
    });
    for (const result of fileResults) {
      if (results.some((existing) => existing.id === result.id)) {
        throw new Error(`Duplicate benchmark ID: ${result.id}`);
      }
      results.push(result);
    }
  }
  return results;
}
