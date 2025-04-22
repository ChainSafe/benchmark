import fs from "node:fs";
import {rimrafSync} from "rimraf";
import {afterAll, describe, expect, it} from "vitest";
import {LocalHistoryProvider} from "../../../src/history/local.ts";
import {Benchmark} from "../../../src/types.ts";

describe("benchmark history local", () => {
  const testDir = fs.mkdtempSync("test_files_");
  const branch = "main";
  const benchmark: Benchmark = {
    commitSha: "010101010101010101010101",
    dirName: testDir,
    results: [{id: "for loop", averageNs: 16573, runsDone: 1024, totalMs: 465, threshold: 2}],
  };

  const historyProvider = new LocalHistoryProvider(testDir);

  afterAll(() => {
    rimrafSync(testDir);
  });

  it("Should write and read history", async () => {
    await historyProvider.writeToHistory(benchmark);

    const benchmarks = await historyProvider.readHistory();
    expect(benchmarks).toEqual([benchmark]);
  });

  it("Should write and read latest in branch", async () => {
    await historyProvider.writeLatestInBranch(branch, benchmark);

    const benchRead = await historyProvider.readLatestInBranch(branch);
    expect(benchRead).toEqual(benchmark);
  });
});
