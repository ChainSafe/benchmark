import {expect, describe, it, vi, beforeAll, afterAll} from "vitest";
import S3 from "aws-sdk/clients/s3.js";
import {Benchmark} from "../../../src/types.js";
import {S3HistoryProvider} from "../../../src/history/s3.js";
import dotenv from "dotenv";
dotenv.config();

describe("benchmark history S3 paths", () => {
  const Bucket = "myproject-benchmark-data";
  const keyPrefix = "myorg/myproject/Linux";

  let historyProvider: S3HistoryProvider;
  beforeAll(() => {
    historyProvider = new S3HistoryProvider({Bucket, keyPrefix});
  });

  it("getLatestInBranchKey", () => {
    const branch = "master";
    expect(historyProvider["getLatestInBranchKey"](branch)).to.equal("myorg/myproject/Linux/latest/master");
  });

  it("getHistoryCommitKey", () => {
    const commit = "9de601df50796e6a4bdedfd1ba515bb8a02b71e8";
    expect(historyProvider["getHistoryCommitKey"](commit)).to.equal(
      "myorg/myproject/Linux/history/9de601df50796e6a4bdedfd1ba515bb8a02b71e8"
    );
  });

  it("getHistoryDir", () => {
    expect(historyProvider["getHistoryDir"]()).to.equal("myorg/myproject/Linux/history");
  });
});

describe.skip("benchmark history S3", function () {
  vi.setConfig({testTimeout: 60 * 1000});

  const branch = "main";
  const benchmark: Benchmark = {
    commitSha: "010101010101010101010101",
    results: [{id: "for loop", averageNs: 16573, runsDone: 1024, totalMs: 465, threshold: 2}],
  };

  let historyProvider: S3HistoryProvider;
  beforeAll(() => {
    historyProvider = S3HistoryProvider.fromEnv();
  });

  it("writeLatestInBranch", async function () {
    await historyProvider.writeLatestInBranch(branch, benchmark);
  });

  it("readLatestInBranch", async function () {
    const benchRead = await historyProvider.readLatestInBranch(branch);
    expect(benchRead).toEqual(benchmark);
  });

  it("writeToHistory", async function () {
    await historyProvider.writeToHistory(benchmark);
  });

  it("readHistory", async function () {
    const benchmarks = await historyProvider.readHistory();
    expect(benchmarks).toEqual([benchmark]);
  });

  afterAll(async () => {
    const config = historyProvider["config"];
    const s3 = new S3(config);
    const keys = [
      historyProvider["getLatestInBranchKey"](branch),
      historyProvider["getHistoryCommitKey"](benchmark.commitSha),
    ];
    for (const key of keys) {
      try {
        await s3.deleteObject({Bucket: config.Bucket, Key: key}).promise();
      } catch (e) {
        console.error(`Error deleting key ${key}`, e);
      }
    }
  });
});
