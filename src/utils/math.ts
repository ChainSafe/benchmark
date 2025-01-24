export function calcSum(arr: bigint[]): bigint {
  let s = BigInt(0);

  for (const n of arr) {
    s += n;
  }
  return s;
}

export function calcMean(arr: bigint[]): bigint {
  return BigInt(calcSum(arr) / BigInt(arr.length));
}

export function calcVariance(arr: bigint[], mean: bigint): bigint {
  let base = BigInt(0);

  for (const n of arr) {
    const diff = n - mean;
    base += diff * diff;
  }

  return base / BigInt(arr.length);
}

export function sortData(arr: bigint[]): bigint[] {
  return [...arr].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

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

export function calcQuartile(sortedData: bigint[], percentile: number): bigint {
  const index = (sortedData.length - 1) * percentile;
  const floor = Math.floor(index);
  const fraction = index - floor;

  if (sortedData[floor + 1] !== undefined) {
    return BigInt(Number(sortedData[floor]) + fraction * Number(sortedData[floor + 1] - sortedData[floor]));
  } else {
    return sortedData[floor];
  }
}

export enum OutlierSensitivity {
  Mild = 1.5,
  Strict = 3.0,
}

export function filterOutliers(arr: bigint[], sorted: boolean, sensitivity: OutlierSensitivity): bigint[] {
  if (arr.length < 4) return arr; // Too few data points

  const data = sorted ? arr : sortData(arr);

  // Calculate quartiles and IQR
  const q1 = Number(calcQuartile(data, 0.25));
  const q3 = Number(calcQuartile(data, 0.75));
  const iqr = q3 - q1;

  // Define outlier bounds (adjust multiplier for sensitivity)
  const lowerBound = q1 - sensitivity * iqr;
  const upperBound = q3 + sensitivity * iqr;

  // Filter original BigInt values
  return data.filter((n) => {
    return n >= lowerBound && n <= upperBound;
  });
}
