import {
  PerformanceResult,
  PerformanceReport,
  Benchmark,
  BenchmarkResult,
  BenchmarkComparisonReport,
  BenchmarkComparisonResult,
} from "../types.js";

export function computeComparisonReport(benchmarks: Benchmark[]): BenchmarkComparisonReport {
  const originBenchmark = benchmarks[0];
  const targetBenchmarks = benchmarks.slice(1);

  const results = new Map<string, BenchmarkComparisonResult[]>();
  for (const res of originBenchmark.results) {
    results.set(res.id, [
      {...res, targetAverageNs: null, originAverageNs: res.averageNs, isFailed: false, isImproved: false, ratio: 1.0},
    ]);
  }

  let someFailed = false;

  for (const bench of targetBenchmarks) {
    for (const currBench of bench.results) {
      const {id} = currBench;
      const result = results.get(id);
      if (!result) continue;

      const refBench = result[0];
      const thresholdBench = currBench.threshold ?? 0;

      if (refBench && refBench.originAverageNs) {
        const ratio = currBench.averageNs / refBench.originAverageNs;
        const isFailed = ratio > thresholdBench;
        result.push({
          id,
          targetAverageNs: currBench.averageNs,
          originAverageNs: refBench.originAverageNs,
          ratio,
          isFailed: isFailed,
          isImproved: ratio < 1 / thresholdBench,
        });
        if (!someFailed && isFailed) {
          someFailed = true;
        }
      } else {
        result.push({
          id,
          targetAverageNs: currBench.averageNs,
          originAverageNs: null,
          ratio: null,
          isFailed: false,
          isImproved: false,
        });
      }
    }
  }

  return {
    commitsShas: benchmarks.map((b) => b.commitSha),
    dirNames: benchmarks.map((b) => b.dirName ?? ""),
    someFailed,
    results,
  };
}

export function computePerformanceReport(
  currBench: Benchmark,
  prevBench: Benchmark | null,
  threshold: number
): PerformanceReport {
  const prevResults = new Map<string, BenchmarkResult>();
  if (prevBench) {
    for (const bench of prevBench.results) {
      prevResults.set(bench.id, bench);
    }
  }

  const results = currBench.results.map((currBench): PerformanceResult => {
    const {id} = currBench;
    const prevBench = prevResults.get(id);
    const thresholdBench = currBench.threshold ?? threshold;

    if (prevBench) {
      const ratio = currBench.averageNs / prevBench.averageNs;
      return {
        id,
        currAverageNs: currBench.averageNs,
        prevAverageNs: prevBench.averageNs,
        ratio,
        isFailed: ratio > thresholdBench,
        isImproved: ratio < 1 / thresholdBench,
      };
    } else {
      return {
        id,
        currAverageNs: currBench.averageNs,
        prevAverageNs: null,
        ratio: null,
        isFailed: false,
        isImproved: false,
      };
    }
  });

  return {
    currCommitSha: currBench.commitSha,
    prevCommitSha: prevBench?.commitSha ?? null,
    someFailed: results.some((r) => r.isFailed),
    results,
  };
}
