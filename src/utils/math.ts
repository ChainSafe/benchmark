/**
 * Computes the total of all values in the array by sequentially adding each element.
 * Handles both positive and negative BigInt values without precision loss.
 */
export function calcSum(arr: bigint[]): bigint {
  let s = BigInt(0);

  for (const n of arr) {
    s += n;
  }
  return s;
}

/**
 * Determines the central tendency by dividing the total sum by the number of elements.
 * Uses integer division that naturally truncates decimal remainders.
 */
export function calcMean(arr: bigint[]): bigint {
  return BigInt(calcSum(arr) / BigInt(arr.length));
}

/**
 * Quantifies data spread by averaging squared deviations from the mean.
 * A value of zero indicates identical values, larger values show greater dispersion.
 */
export function calcVariance(arr: bigint[], mean: bigint): bigint {
  let base = BigInt(0);

  for (const n of arr) {
    const diff = n - mean;
    base += diff * diff;
  }

  return base / BigInt(arr.length);
}

/**
 * Organizes values from smallest to largest while preserving the original array.
 * Essential for percentile-based calculations like median and quartiles.
 */
export function sortData(arr: bigint[]): bigint[] {
  return [...arr].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Identifies the middle value that separates higher and lower halves of the dataset.
 * For even-sized arrays, averages the two central values to find the midpoint.
 */
export function calcMedian(arr: bigint[], sorted: boolean): bigint {
  // 1. Sort the BigInt array
  const data = sorted ? arr : sortData(arr);

  // 3. Calculate median
  const mid = Math.floor(data.length / 2);
  if (data.length % 2 === 0) {
    return (data[mid - 1] + data[mid]) / BigInt(2); // Average two middle values
  } else {
    return data[mid]; // Single middle value
  }
}

/**
 * Determines cutoff points that divide data into four equal-frequency segments.
 * Uses linear interpolation to estimate values between actual data points.
 */
export function calcQuartile(arr: bigint[], sorted: boolean, percentile: number): number {
  const sortedData = sorted ? arr : sortData(arr);

  const index = (sortedData.length - 1) * percentile;
  const floor = Math.floor(index);
  const fraction = index - floor;

  if (sortedData[floor + 1] !== undefined) {
    return Number(sortedData[floor]) + fraction * Number(sortedData[floor + 1] - sortedData[floor]);
  }

  return Number(sortedData[floor]);
}

/**
 * Configures how aggressively outlier detection removes edge values.
 * - Mild: Removes typical anomalies (e.g., temporary CPU spikes)
 * - Strict: Only filters extreme deviations (e.g., measurement errors)
 */
export enum OutlierSensitivity {
  Mild = 1.5,
  Strict = 3.0,
}

/**
 * Isolates the core dataset by excluding values far from the central cluster.
 * Uses quartile ranges to establish inclusion boundaries, preserving data integrity
 * while eliminating measurement noise. Sorting can be bypassed for pre-processed data.
 */
export function filterOutliers(arr: bigint[], sorted: boolean, sensitivity: OutlierSensitivity): bigint[] {
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
