import {mkdtemp, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {expect, it, vi} from "vitest";
import {runIsolated} from "../../../src/benchmark/isolate.ts";
import {BenchmarkRunner} from "../../../src/benchmark/runner.ts";
import {run} from "../../../src/cli/run.ts";

// Stub execution boundaries so this test observes only the parent's runner ownership.
vi.mock("../../../src/benchmark/isolate.ts", () => ({runIsolated: vi.fn().mockResolvedValue([])}));
vi.mock("../../../src/benchmark/runner.ts", () => ({BenchmarkRunner: vi.fn()}));

it("does not construct a shared-process runner in isolated mode", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "benchmark-run-"));
  try {
    const file = path.join(dir, "bench.mjs");
    await writeFile(file, "");
    await expect(
      run({
        spec: [file],
        extension: ["mjs"],
        ignore: [],
        recursive: false,
        isolate: true,
        historyLocal: path.join(dir, "history"),
        defaultBranch: "main",
        compareBranch: "main",
        skipPostComment: true,
        persist: false,
      })
    ).rejects.toThrow("No benchmark result was produced");
    expect(runIsolated).toHaveBeenCalledOnce();
    expect(BenchmarkRunner).not.toHaveBeenCalled();
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});
