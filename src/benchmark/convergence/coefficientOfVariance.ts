import Debug from "debug";
import {BenchmarkOpts, ConvergenceCheckFn} from "../../types.js";
import {
  OutlierSensitivityEnum,
  calcMean,
  calcMedian,
  calcVariance,
  filterOutliers,
  sortData,
} from "../../utils/math.js";

const debug = Debug("@chainsafe/benchmark/convergence");

export function createCVConvergenceCriteria(
  startMs: number,
  {maxMs, maxRuns, minRuns, minMs, convergeFactor}: Required<BenchmarkOpts>
): ConvergenceCheckFn {
  let lastConvergenceSample = startMs;
  let sampleEveryMs = Math.min(100, minMs);
  const minSamples = Math.max(5, minRuns);
  const maxSamplesForCV = 1000;

  return function canTerminate(runIdx: number, _totalNs: bigint, runsNs: bigint[]): boolean {
    const currentMs = Date.now();
    const elapsedMs = currentMs - startMs;
    const timeSinceLastCheck = currentMs - lastConvergenceSample;
    const mustStop = elapsedMs >= maxMs || runIdx >= maxRuns;
    const mayStop = elapsedMs >= minMs && runIdx >= minRuns && runIdx >= minSamples;

    debug(
      "trying to converge benchmark via cv mustStop=%o, mayStop=%o, timeSinceLastCheck=%o",
      mustStop,
      mayStop,
      timeSinceLastCheck
    );

    // Must stop
    if (mustStop) return true;
    if (!mayStop) return false;

    // Only attempt to compute the confidence interval every sampleEveryMs
    if (timeSinceLastCheck < sampleEveryMs) {
      // If last call was wade 50% faster than the sampleEveryMs, let's reduce the sample interval to 10%
      if (sampleEveryMs > 2 && sampleEveryMs / 2 > timeSinceLastCheck) {
        sampleEveryMs -= sampleEveryMs * 0.1;
      }
      return false;
    }

    if (timeSinceLastCheck < sampleEveryMs) return false;
    lastConvergenceSample = currentMs;
    // For all statistical calculations we don't want to loose the precision so have to convert to numbers first
    const samples = filterOutliers(sortData(runsNs.map((n) => Number(n))), true, OutlierSensitivityEnum.Mild);

    // If CV does not stabilize we fallback to the median approach
    if (runsNs.length > maxSamplesForCV) {
      const median = calcMedian(samples, true);
      const mean = calcMean(samples);
      const medianFactor = Math.abs(Number(mean - median)) / Number(median);

      debug("checking convergence median convergeFactor=%o, medianFactor=%o", convergeFactor, medianFactor);

      return medianFactor < convergeFactor;
    }

    const mean = calcMean(samples);
    const variance = calcVariance(samples, mean);
    const cv = Math.sqrt(variance) / mean;

    debug(
      "checking convergence via cv convergeFactor=%o, cv=%o, samples=%o, outliers=%o",
      convergeFactor,
      cv,
      runsNs.length,
      runsNs.length - samples.length
    );

    return cv < convergeFactor;
  };
}
