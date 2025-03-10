"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLinearConvergenceCriteria = createLinearConvergenceCriteria;
var debug_1 = require("debug");
var debug = (0, debug_1.default)("@chainsafe/benchmark/convergence");
function createLinearConvergenceCriteria(startMs, _a) {
    var maxMs = _a.maxMs, maxRuns = _a.maxRuns, minRuns = _a.minRuns, minMs = _a.minMs, convergeFactor = _a.convergeFactor;
    var prevAvg0 = 0;
    var prevAvg1 = 0;
    var lastConvergenceSample = startMs;
    var sampleEveryMs = 100;
    return function canTerminate(runIdx, totalNs, _runNs) {
        var currentMs = Date.now();
        var elapsedMs = currentMs - startMs;
        var timeSinceLastCheck = currentMs - lastConvergenceSample;
        var mustStop = elapsedMs >= maxMs || runIdx >= maxRuns;
        var mayStop = elapsedMs >= minMs && runIdx >= minRuns;
        debug("trying to converge benchmark via confidence-interval mustStop=%o, mayStop=%o, timeSinceLastCheck=%o", mustStop, mayStop, timeSinceLastCheck);
        // Must stop
        if (mustStop)
            return true;
        // When is a good time to stop a benchmark? A naive answer is after N milliseconds or M runs.
        // This code aims to stop the benchmark when the average fn run time has converged at a value
        // within a given convergence factor. To prevent doing expensive math to often for fast fn,
        // it only takes samples every `sampleEveryMs`. It stores two past values to be able to compute
        // a very rough linear and quadratic convergence.a
        if (timeSinceLastCheck <= sampleEveryMs)
            return false;
        lastConvergenceSample = currentMs;
        var avg = Number(totalNs / BigInt(runIdx));
        // Compute convergence (1st order + 2nd order)
        var a = prevAvg0;
        var b = prevAvg1;
        var c = avg;
        if (mayStop) {
            // Approx linear convergence
            var convergence1 = Math.abs(c - a);
            // Approx quadratic convergence
            var convergence2 = Math.abs(b - (a + c) / 2);
            // Take the greater of both to enforce linear and quadratic are below convergeFactor
            var convergence = Math.max(convergence1, convergence2) / a;
            debug("checking convergence convergeFactor=%o, convergence=%o", convergeFactor, convergence);
            // Okay to stop + has converged, stop now
            if (convergence < convergeFactor)
                return true;
        }
        prevAvg0 = prevAvg1;
        prevAvg1 = avg;
        return false;
    };
}
