import {expect, describe, it, vi, beforeAll} from "vitest";
import {Benchmark} from "../../../src/types.js";
import {getGaCacheHistoryProvider} from "../../../src/history/gaCache.js";
import {isGaRun} from "../../../src/github/context.js";

// Currently fails with
//
// Error: reserveCache failed: Cache Service Url not found, unable to restore cache
//
// See:
//  - https://github.com/nektos/act/issues/329
//  - https://github.com/nektos/act/issues/285
describe.skip("benchmark history gaCache", function () {
  vi.setConfig({testTimeout: 60 * 1000});

  const branch = "main";
  const benchmark: Benchmark = {
    commitSha: "010101010101010101010101",
    results: [{id: "for loop", averageNs: 16573, runsDone: 1024, totalMs: 465, threshold: 2}],
  };

  const cacheKey = "ga-cache-testing";
  let historyProvider: ReturnType<typeof getGaCacheHistoryProvider>;
  beforeAll(() => {
    historyProvider = getGaCacheHistoryProvider(cacheKey);
  });

  it("writeLatestInBranch", async ({skip}) => {
    if (!isGaRun()) return skip();

    await historyProvider.writeLatestInBranch(branch, benchmark);
  });

  it("readLatestInBranch", async ({skip}) => {
    if (!isGaRun()) return skip();

    const benchRead = await historyProvider.readLatestInBranch(branch);
    expect(benchRead).to.deep.equal(benchmark, "Wrong bench read from disk");
  });
});
