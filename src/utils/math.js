"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlierSensitivityEnum = exports.MAX_FRACTION = void 0;
exports.roundDecimal = roundDecimal;
exports.calcSum = calcSum;
exports.calcMean = calcMean;
exports.calcVariance = calcVariance;
exports.calcUnbiasedVariance = calcUnbiasedVariance;
exports.sortData = sortData;
exports.calcMedian = calcMedian;
exports.calcQuartile = calcQuartile;
exports.filterOutliers = filterOutliers;
exports.MAX_FRACTION = 8;
function roundDecimal(n) {
    return Number(n.toFixed(exports.MAX_FRACTION));
}
/**
 * Computes the total of all values in the array by sequentially adding each element.
 * Handles both positive and negative BigInt values without precision loss.
 */
function calcSum(arr) {
    var s = BigInt(0);
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var n = arr_1[_i];
        s = s + BigInt(n);
    }
    return s;
}
/**
 * Determines the central tendency by dividing the total sum by the number of elements.
 * Uses integer division that naturally truncates decimal remainders.
 */
function calcMean(arr) {
    if (arr.length < 1)
        throw new Error("Can not find mean of any empty array");
    return roundDecimal(Number(calcSum(arr)) / arr.length);
}
/**
 * Quantifies data spread by averaging squared deviations from the mean.
 * A value of zero indicates identical values, larger values show greater dispersion.
 */
function calcVariance(arr, mean) {
    if (arr.length === 0)
        throw new Error("Can not find variance of an empty array");
    var base = 0;
    for (var _i = 0, arr_2 = arr; _i < arr_2.length; _i++) {
        var n = arr_2[_i];
        var diff = Number(n) - mean;
        base += diff * diff;
    }
    return roundDecimal(base / arr.length);
}
/**
 * Quantifies data spread by averaging squared deviations from the mean.
 * A value of zero indicates identical values, larger values show greater dispersion.
 */
function calcUnbiasedVariance(arr, mean) {
    if (arr.length === 0)
        throw new Error("Can not find variance of an empty array");
    var base = 0;
    for (var _i = 0, arr_3 = arr; _i < arr_3.length; _i++) {
        var n = arr_3[_i];
        var diff = Number(n) - mean;
        base += diff * diff;
    }
    if (arr.length < 2)
        return roundDecimal(base);
    return roundDecimal(base / arr.length - 1);
}
/**
 * Organizes values from smallest to largest while preserving the original array.
 * Essential for percentile-based calculations like median and quartiles.
 */
function sortData(arr) {
    return __spreadArray([], arr, true).sort(function (a, b) { return (a < b ? -1 : a > b ? 1 : 0); });
}
/**
 * Identifies the middle value that separates higher and lower halves of the dataset.
 * For even-sized arrays, averages the two central values to find the midpoint.
 */
function calcMedian(arr, sorted) {
    if (arr.length === 0)
        throw new Error("Can not calculate median for empty values");
    // 1. Sort the BigInt array
    var data = sorted ? arr : sortData(arr);
    // 3. Calculate median
    var mid = Math.floor(data.length / 2);
    if (data.length % 2 === 0) {
        return roundDecimal((Number(data[mid - 1]) + Number(data[mid])) / 2); // Average two middle values
    }
    return roundDecimal(Number(data[mid])); // Single middle value
}
/**
 * Determines cutoff points that divide data into four equal-frequency segments.
 * Uses linear interpolation to estimate values between actual data points.
 */
function calcQuartile(arr, sorted, percentile) {
    var sortedData = sorted ? arr : sortData(arr);
    var index = (sortedData.length - 1) * percentile;
    var floor = Math.floor(index);
    var fraction = index - floor;
    if (sortedData[floor + 1] !== undefined) {
        var base = Number(sortedData[floor]);
        var next = Number(sortedData[floor + 1]);
        return roundDecimal(base + fraction * (next - base));
    }
    return roundDecimal(Number(sortedData[floor]));
}
/**
 * Configures how aggressively outlier detection removes edge values.
 * - Mild: Removes typical anomalies (e.g., temporary CPU spikes)
 * - Strict: Only filters extreme deviations (e.g., measurement errors)
 */
exports.OutlierSensitivityEnum = {
    /**
     * A standard multiplier for detecting mild outliers. Captures ~99.3% of normally distributed data.
     */
    Mild: 1.5,
    /**
     * A stricter multiplier for detecting extreme outliers. Captures ~99.99% of normally distributed data.
     */
    Strict: 3.0,
};
/**
 * Isolates the core dataset by excluding values far from the central cluster.
 * Uses quartile ranges to establish inclusion boundaries, preserving data integrity
 * while eliminating measurement noise. Sorting can be bypassed for pre-processed data.
 *
 * We use the `IQR` Interquartile Range method to detect the outliers. IQR is distribution
 * of difference of Q3 - Q1 and represents the middle 50% of the data.:
 * - Q1 (First Quartile): The 25th percentile (25% of the data is below this value).
 * - Q3 (Third Quartile): The 75th percentile (75% of the data is below this value).
 *
 * The `OutlierSensitivity` is scaling factors applied to the IQR to determine how far data points
 * can deviate from the quartiles before being considered outliers.
 */
function filterOutliers(arr, sorted, sensitivity) {
    if (arr.length < 4)
        return arr; // Too few data points
    var data = sorted ? arr : sortData(arr);
    // Calculate quartiles and IQR
    var q1 = calcQuartile(data, true, 0.25);
    var q3 = calcQuartile(data, true, 0.75);
    var iqr = q3 - q1;
    // Define outlier bounds (adjust multiplier for sensitivity)
    var lowerBound = q1 - sensitivity * iqr;
    var upperBound = q3 + sensitivity * iqr;
    // Filter original BigInt values
    return data.filter(function (n) {
        return n >= lowerBound && n <= upperBound;
    });
}
