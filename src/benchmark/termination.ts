import {BenchmarkOpts} from "../types.js";

export type TerminationCriteria = (runIdx: number, totalNs: bigint) => boolean;

export function createConvergenceCriteria(
  startMs: number,
  {maxMs, maxRuns, minRuns, minMs, convergeFactor}: Required<BenchmarkOpts>
): TerminationCriteria {
  let prevAvg0 = 0;
  let prevAvg1 = 0;
  let lastConvergenceSample = startMs;
  const sampleEveryMs = 100;

  return function canTerminate(runIdx: number, totalNs: bigint): boolean {
    const currentMs = Date.now();
    const elapsedMs = currentMs - startMs;
    const mustStop = elapsedMs >= maxMs || runIdx >= maxRuns;
    const mayStop = elapsedMs >= minMs && runIdx >= minRuns;

    // Must stop
    if (mustStop) return true;

    // When is a good time to stop a benchmark? A naive answer is after N milliseconds or M runs.
    // This code aims to stop the benchmark when the average fn run time has converged at a value
    // within a given convergence factor. To prevent doing expensive math to often for fast fn,
    // it only takes samples every `sampleEveryMs`. It stores two past values to be able to compute
    // a very rough linear and quadratic convergence.a
    if (currentMs - lastConvergenceSample <= sampleEveryMs) return false;

    lastConvergenceSample = currentMs;
    const avg = Number(totalNs / BigInt(runIdx));

    // Compute convergence (1st order + 2nd order)
    const a = prevAvg0;
    const b = prevAvg1;
    const c = avg;

    if (mayStop) {
      // Approx linear convergence
      const convergence1 = Math.abs(c - a);
      // Approx quadratic convergence
      const convergence2 = Math.abs(b - (a + c) / 2);
      // Take the greater of both to enforce linear and quadratic are below convergeFactor
      const convergence = Math.max(convergence1, convergence2) / a;

      // Okay to stop + has converged, stop now
      if (convergence < convergeFactor) return true;
    }

    prevAvg0 = prevAvg1;
    prevAvg1 = avg;
    return false;
  };
}

// test/perf/iteration.test.ts
//   Array iteration
//     ✔ sum array with raw for loop                                         1573.007 ops/s    635.7250 us/op        -       4765 runs   3.53 s
//     ✔ sum array with reduce                                               176.6890 ops/s    5.659663 ms/op        -        271 runs   2.04 s
//     ✔ sum array with reduce beforeEach                                    214638.3 ops/s    4.659000 us/op        -     102478 runs   25.6 s
//     ✔ sum array with reduce before beforeEach                             269251.5 ops/s    3.714000 us/op        -     997136 runs   5.66 s
//     ✔ sum array with reduce high threshold                                176.4852 ops/s    5.666196 ms/op        -        109 runs   1.12 s
//     ✔ sum array with reduce no threshold                                  177.5273 ops/s    5.632938 ms/op        -         73 runs  0.915 s
