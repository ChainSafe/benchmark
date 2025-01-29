import Debug from "debug";
import {BenchmarkOpts, ConvergenceCheckFn} from "../../types.js";
import {calcMean, calcUnbiasedVariance} from "../../utils/math.js";

const debug = Debug("@chainsafe/benchmark/convergence");

/**
 * Creates a termination criteria function that stops once we have enough samples
 * such that the 95% confidence interval half-width is below the `convergeFactor`
 * fraction of the mean or below an absolute threshold if you choose.
 */
export function createConfidenceIntervalConvergenceCriteria(
  startMs: number,
  {maxMs, maxRuns, minRuns, minMs, convergeFactor}: Required<BenchmarkOpts>
): ConvergenceCheckFn {
  let sampleEveryMs = Math.min(100, minMs);
  const minSamples = Math.max(minRuns, 5);
  let lastConvergenceSample = startMs;

  return function canTerminate(runIdx: number, totalNs: bigint, runsNs: bigint[]): boolean {
    const currentMs = Date.now();
    const elapsedMs = currentMs - startMs;
    const timeSinceLastCheck = currentMs - lastConvergenceSample;
    const mustStop = elapsedMs >= maxMs || runIdx >= maxRuns;
    const mayStop = elapsedMs >= minMs && runIdx >= minRuns && runIdx >= minSamples;

    debug(
      "trying to converge benchmark via confidence-interval mustStop=%o, mayStop=%o, sampleEveryMs=%o, timeSinceLastCheck=%o",
      mustStop,
      mayStop,
      sampleEveryMs,
      timeSinceLastCheck
    );

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
    lastConvergenceSample = currentMs;

    // Convert runsNs (BigInt) to numbers for statistical math. For extremely large values,
    // you might risk floating precision, but typically these benchmarks measure relatively
    // small times (ns to ms), so it's safe.
    const samples = runsNs.map((v) => Number(v));

    // STEP 2: Calculate mean and sample variance
    const n = samples.length;
    const mean = calcMean(samples);
    const variance = calcUnbiasedVariance(samples, mean);

    // Standard error of the mean (SEM)
    const sem = Math.sqrt(variance / n);

    // 95% CI half-width
    const z = 1.96; // ~95% for large n
    const halfWidth = z * sem;
    const relativeFactor = Math.abs(halfWidth / mean);

    debug("checking convergence convergeFactor=%o, relativeFactor=%o", convergeFactor, relativeFactor);

    // Convergence checks
    //   1) Relative threshold => halfWidth < mean * convergeFactor
    //   2) (Optional) Absolute threshold => halfWidth < someEpsilon (like 500 ns)
    const relCheckOk = relativeFactor < convergeFactor;

    // Suppose we only rely on the relative check. Or define:
    //  const absEpsilon = 500; // in ns
    //  const absCheckOk = halfWidth < absEpsilon;

    // If it meets your criteria, we can stop
    const hasConverged = relCheckOk; /* && absCheckOk (if you want both) */

    return hasConverged;
  };
}
