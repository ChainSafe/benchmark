import {EnumLike} from "../types.ts";

export const MAX_FRACTION = 8;

export function roundDecimal(n: number): number {
  return Number(n.toFixed(MAX_FRACTION));
}

/**
 * Computes the total of all values in the array by sequentially adding each element.
 * Handles both positive and negative BigInt values without precision loss.
 */
export function calcSum<T extends number | bigint>(arr: T[]): bigint {
  let s = BigInt(0);

  for (const n of arr) {
    s = s + BigInt(n);
  }

  return s;
}

/**
 * Determines the central tendency by dividing the total sum by the number of elements.
 * Uses integer division that naturally truncates decimal remainders.
 */
export function calcMean<T extends number | bigint>(arr: T[]): number {
  if (arr.length < 1) throw new Error("Can not find mean of any empty array");

  return roundDecimal(Number(calcSum(arr)) / arr.length);
}

/**
 * Quantifies data spread by averaging squared deviations from the mean.
 * A value of zero indicates identical values, larger values show greater dispersion.
 */
export function calcVariance<T extends number | bigint>(arr: T[], mean: number): number {
  if (arr.length === 0) throw new Error("Can not find variance of an empty array");
  let base = 0;

  for (const n of arr) {
    const diff = Number(n) - mean;
    base += diff * diff;
  }

  return roundDecimal(base / arr.length);
}

/**
 * Quantifies data spread by averaging squared deviations from the mean.
 * A value of zero indicates identical values, larger values show greater dispersion.
 */
export function calcUnbiasedVariance<T extends number | bigint>(arr: T[], mean: number): number {
  if (arr.length === 0) throw new Error("Can not find variance of an empty array");
  let base = 0;

  for (const n of arr) {
    const diff = Number(n) - mean;
    base += diff * diff;
  }

  if (arr.length < 2) return roundDecimal(base);

  return roundDecimal(base / arr.length - 1);
}

/**
 * Organizes values from smallest to largest while preserving the original array.
 * Essential for percentile-based calculations like median and quartiles.
 */
export function sortData<T extends bigint | number>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Identifies the middle value that separates higher and lower halves of the dataset.
 * For even-sized arrays, averages the two central values to find the midpoint.
 */
export function calcMedian<T extends bigint | number>(arr: T[], sorted: boolean): number {
  if (arr.length === 0) throw new Error("Can not calculate median for empty values");

  // 1. Sort the BigInt array
  const data = sorted ? arr : sortData(arr);

  // 3. Calculate median
  const mid = Math.floor(data.length / 2);
  if (data.length % 2 === 0) {
    return roundDecimal((Number(data[mid - 1]) + Number(data[mid])) / 2); // Average two middle values
  }

  return roundDecimal(Number(data[mid])); // Single middle value
}

/**
 * Determines cutoff points that divide data into four equal-frequency segments.
 * Uses linear interpolation to estimate values between actual data points.
 */
export function calcQuartile<T extends number | bigint>(arr: T[], sorted: boolean, percentile: number): number {
  const sortedData = sorted ? arr : sortData(arr);

  const index = (sortedData.length - 1) * percentile;
  const floor = Math.floor(index);
  const fraction = index - floor;

  if (sortedData[floor + 1] !== undefined) {
    const base = Number(sortedData[floor]);
    const next = Number(sortedData[floor + 1]);
    return roundDecimal(base + fraction * (next - base));
  }

  return roundDecimal(Number(sortedData[floor]));
}

/**
 * Configures how aggressively outlier detection removes edge values.
 * - Mild: Removes typical anomalies (e.g., temporary CPU spikes)
 * - Strict: Only filters extreme deviations (e.g., measurement errors)
 */
export const OutlierSensitivityEnum = {
  /**
   * A standard multiplier for detecting mild outliers. Captures ~99.3% of normally distributed data.
   */
  Mild: 1.5,
  /**
   * A stricter multiplier for detecting extreme outliers. Captures ~99.99% of normally distributed data.
   */
  Strict: 3.0,
} as const;
export type OutlierSensitivity = EnumLike<typeof OutlierSensitivityEnum>;

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
export function filterOutliers<T extends number | bigint>(
  arr: T[],
  sorted: boolean,
  sensitivity: OutlierSensitivity
): T[] {
  if (arr.length < 4) return arr; // Too few data points

  const data = sorted ? arr : sortData(arr);

  // Calculate quartiles and IQR
  const q1 = calcQuartile(data, true, 0.25);
  const q3 = calcQuartile(data, true, 0.75);
  const iqr = q3 - q1;

  // Define outlier bounds (adjust multiplier for sensitivity)
  const lowerBound = q1 - sensitivity * iqr;
  const upperBound = q3 + sensitivity * iqr;

  // Filter original BigInt values
  return data.filter((n) => {
    return n >= lowerBound && n <= upperBound;
  });
}
