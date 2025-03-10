"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCVConvergenceCriteria = createCVConvergenceCriteria;
var debug_1 = require("debug");
var math_ts_1 = require("../../utils/math.ts");
var debug = (0, debug_1.default)("@chainsafe/benchmark/convergence");
function createCVConvergenceCriteria(startMs, _a) {
    var maxMs = _a.maxMs, maxRuns = _a.maxRuns, minRuns = _a.minRuns, minMs = _a.minMs, convergeFactor = _a.convergeFactor;
    var lastConvergenceSample = startMs;
    var sampleEveryMs = Math.min(100, minMs);
    var minSamples = Math.max(5, minRuns);
    var maxSamplesForCV = 1000;
    return function canTerminate(runIdx, _totalNs, runsNs) {
        var currentMs = Date.now();
        var elapsedMs = currentMs - startMs;
        var timeSinceLastCheck = currentMs - lastConvergenceSample;
        var mustStop = elapsedMs >= maxMs || runIdx >= maxRuns;
        var mayStop = elapsedMs >= minMs && runIdx >= minRuns && runIdx >= minSamples;
        debug("trying to converge benchmark via cv mustStop=%o, mayStop=%o, timeSinceLastCheck=%o", mustStop, mayStop, timeSinceLastCheck);
        // Must stop
        if (mustStop)
            return true;
        if (!mayStop)
            return false;
        // Only attempt to compute the confidence interval every sampleEveryMs
        if (timeSinceLastCheck < sampleEveryMs) {
            // If last call was wade 50% faster than the sampleEveryMs, let's reduce the sample interval to 10%
            if (sampleEveryMs > 2 && sampleEveryMs / 2 > timeSinceLastCheck) {
                sampleEveryMs -= sampleEveryMs * 0.1;
            }
            return false;
        }
        if (timeSinceLastCheck < sampleEveryMs)
            return false;
        lastConvergenceSample = currentMs;
        // For all statistical calculations we don't want to loose the precision so have to convert to numbers first
        var samples = (0, math_ts_1.filterOutliers)((0, math_ts_1.sortData)(runsNs.map(function (n) { return Number(n); })), true, OutlierSensitivityEnum.Mild);
        // If CV does not stabilize we fallback to the median approach
        if (runsNs.length > maxSamplesForCV) {
            var median = (0, math_ts_1.calcMedian)(samples, true);
            var mean_1 = (0, math_ts_1.calcMean)(samples);
            var medianFactor = Math.abs(Number(mean_1 - median)) / Number(median);
            debug("checking convergence median convergeFactor=%o, medianFactor=%o", convergeFactor, medianFactor);
            return medianFactor < convergeFactor;
        }
        var mean = (0, math_ts_1.calcMean)(samples);
        var variance = (0, math_ts_1.calcVariance)(samples, mean);
        var cv = Math.sqrt(variance) / mean;
        debug("checking convergence via cv convergeFactor=%o, cv=%o, samples=%o, outliers=%o", convergeFactor, cv, runsNs.length, runsNs.length - samples.length);
        return cv < convergeFactor;
    };
}
