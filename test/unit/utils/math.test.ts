import {describe, it, expect} from "vitest";
import {
  calcSum,
  calcMean,
  calcVariance,
  sortData,
  calcMedian,
  calcQuartile,
  filterOutliers,
  OutlierSensitivityEnum,
} from "../../../src/utils/math.js";

describe("math utility functions", () => {
  describe("calcSum", () => {
    it("should return 0n for an empty array", () => {
      expect(calcSum([])).toBe(BigInt(0));
    });

    it("should correctly sum an array of positive BigInts", () => {
      const arr = [1n, 2n, 3n, 4n];
      expect(calcSum(arr)).toBe(10n);
    });

    it("should correctly sum an array with negative BigInts", () => {
      const arr = [-1n, 2n, -3n, 4n];
      // -1 + 2 = 1; 1 - 3 = -2; -2 + 4 = 2
      expect(calcSum(arr)).toBe(2n);
    });

    it("should handle large BigInt values without overflow", () => {
      const big1 = BigInt("9007199254740991"); // ~ Number.MAX_SAFE_INTEGER
      const big2 = BigInt("9007199254740992");
      expect(calcSum([big1, big2])).toBe(big1 + big2);
    });
  });

  describe("calcMean", () => {
    it("should throw or behave predictably for an empty array", () => {
      expect(() => calcMean([])).toThrow();
    });

    it("should correctly calculate the mean of a single-element array", () => {
      const arr = [5n];
      expect(calcMean(arr)).toBe(5);
    });

    it("should correctly calculate the mean of multiple BigInts", () => {
      const arr = [2n, 4n, 6n];
      // sum=12, length=3 => mean=4
      expect(calcMean(arr)).toBe(4);
    });

    it("should handle negative values correctly", () => {
      const arr = [-5n, -15n, 10n];
      // sum=-10, length=3 => mean=-3.333..., but truncated to BigInt => -3n if using integer division
      expect(calcMean(arr)).toBe(-3.33333333);
    });
  });

  describe("calcVariance", () => {
    it("should compute variance for a small sample of integers", () => {
      const arr = [2n, 4n, 4n, 6n, 8n];
      // sum = 24, length = 5
      // mean = 4.8
      // diffs = (-2.8, -0.7999, -0.7999, 1.2, 3.2)
      // squares = (7.839999999999999, 0.6399999999999997, 0.6399999999999997, 1.4400000000000004, 10.240000000000002) = 20.8
      // var = 20.8 / 5 = 4.16
      const meanBigInt = calcMean(arr);
      const varianceBigInt = calcVariance(arr, meanBigInt);
      expect(varianceBigInt).toBe(4.16);
    });

    it("should handle a single-element array (variance=0)", () => {
      const arr = [100n];
      const mean = calcMean(arr); // 100n
      const variance = calcVariance(arr, mean);
      expect(variance).toBe(0);
    });

    it("should handle negative values", () => {
      const arr = [-10n, -4n, -2n];
      // sum = -16, length=3
      // mean = -16/3 = 5.333333333333333
      // diffs = (-4.666666666666667, 1.333333333333333, 3.333333333333333),
      // squares = (21.777777777777782, 1.777777777777777, 11.111111111111109) = 34.66666666666667
      // var = 34.66666666666667 / 3 = 11.555555555555557
      const mean = calcMean(arr);
      console.log(mean);
      const variance = calcVariance(arr, mean);
      expect(variance).toBe(11.55555556);
    });

    it("should return 0 for an array of identical values", () => {
      const arr = [5n, 5n, 5n];
      const mean = calcMean(arr);
      const variance = calcVariance(arr, mean);
      expect(variance).toBe(0);
    });
  });

  describe("sortData", () => {
    it("should return a new sorted array without mutating the original", () => {
      const arr = [5n, 1n, 3n];
      const sorted = sortData(arr);
      expect(sorted).toEqual([1n, 3n, 5n]);
      // Ensure original is unchanged
      expect(arr).toEqual([5n, 1n, 3n]);
    });

    it("should handle negative and positive numbers", () => {
      const arr = [0n, -1n, 10n, -5n, 2n];
      const sorted = sortData(arr);
      expect(sorted).toEqual([-5n, -1n, 0n, 2n, 10n]);
    });

    it("should handle an empty array", () => {
      expect(sortData([])).toEqual([]);
    });

    it("should handle an already sorted array", () => {
      expect(sortData([1n, 2n, 3n, 4n])).toEqual([1n, 2n, 3n, 4n]);
    });
  });

  describe("calcMedian", () => {
    it("should throw or handle empty array (no median)", () => {
      expect(() => calcMedian([], false)).toThrow();
    });

    it("should return the middle element when the array length is odd", () => {
      const arr = [3n, 1n, 2n];
      // sorted = [1n, 2n, 3n], median = 2n
      expect(calcMedian(arr, false)).toBe(2);
    });

    it("should return the average of two middle elements when the array length is even", () => {
      const arr = [3n, 1n, 2n, 4n];
      // sorted = [1n, 2n, 3n, 4n]
      // middle indices = 1,2 => average => (2+3)/2=2.5
      expect(calcMedian(arr, false)).toBe(2.5);
    });

    it("should skip re-sorting if 'sorted=true' is provided", () => {
      // already sorted
      const arr = [1n, 2n, 3n, 4n];
      expect(calcMedian(arr, true)).toBe(2.5);
    });
  });

  describe("calcQuartile", () => {
    const sortedData = sortData([1n, 2n, 4n, 10n, 20n, 100n]);

    it("should return the first quartile (Q1) => percentile=0.25", () => {
      // sorted array = [1n, 2n, 4n, 10n, 20n, 100n], length=6
      // index = (6-1)*0.25=1.25, floor=1, fraction=0.25
      // base=2, next=4, difference=2
      // result = 2 + 0.25 * (4 - 2) = 2.5
      const q1 = calcQuartile(sortedData, true, 0.25);
      expect(q1).toBe(2.5);
    });

    it("should return the third quartile (Q3) => percentile=0.75", () => {
      // index=(5*0.75)=3.75 => floor=3 => fraction=0.75
      // base=10n, next=20n => difference=10 => 10 + 0.75*10=17.5 => rounded and truncated => 18
      const q3 = calcQuartile(sortedData, true, 0.75);
      expect(q3).toBe(17.5);
    });

    it("should gracefully handle the highest index boundary (percentile=1.0)", () => {
      // index=(6-1)*1.0=5 => floor=5 => fraction=0 => return data[5] => 100n
      const maxVal = calcQuartile(sortedData, true, 1.0);
      expect(maxVal).toBe(100);
    });

    it("should gracefully handle the lowest index boundary (percentile=0.0)", () => {
      // index=(6-1)*0.0=0 => floor=0 => fraction=0 => return data[0] => 1n
      const minVal = calcQuartile(sortedData, true, 0.0);
      expect(minVal).toBe(1);
    });

    it("should handle a single-element array => always that element", () => {
      const arr = [42n];
      expect(calcQuartile(arr, true, 0.25)).toBe(42);
      expect(calcQuartile(arr, true, 0.75)).toBe(42);
    });
  });

  describe("filterOutliers", () => {
    it("should return the same array if length < 4", () => {
      const arr = [1n, 100n];
      expect(filterOutliers(arr, false, OutlierSensitivityEnum.Mild)).toEqual([1n, 100n]);
    });

    it("should remove outliers using the Mild (1.5x IQR) approach", () => {
      // Example: [1n, 2n, 4n, 10n, 20n, 100n]
      // sorted => [1n,2n,4n,10n,20n,100n]
      // Q1=2n, Q3=20n => iqr=18 => mild => +/- 1.5*18=27 => lower=2-27=-25 => upper=20+27=47
      // So any element outside -25..47 is out => 100n is out
      const arr = [20n, 100n, 2n, 10n, 1n, 4n];
      const filtered = filterOutliers(arr, false, OutlierSensitivityEnum.Mild);
      expect(filtered).toEqual([1n, 2n, 4n, 10n, 20n]);
    });

    it("should remove outliers using the Strict (3.0x IQR) approach", () => {
      // same array => Q1=2n, Q3=20n => iqr=18 => strict => +/- 3.0*18=54 => lower=-52 => upper=74
      // 100 is outside => filter it out
      const arr = [20n, 100n, 2n, 10n, 1n, 4n];
      const filtered = filterOutliers(arr, false, OutlierSensitivityEnum.Strict);
      expect(filtered).toEqual([1n, 2n, 4n, 10n, 20n]);
    });

    it("should handle negative values correctly", () => {
      // e.g. [-100n, -10n, -5n, -2n, -1n, 0n, 1n, 5n, 6n]
      // We'll skip the exact math here, but we test that they are sorted and outliers removed
      const arr = [-10n, 6n, -2n, -100n, -5n, 1n, -1n, 5n, 0n];
      const filtered = filterOutliers(arr, false, OutlierSensitivityEnum.Mild);
      // We can check that -100n is probably an outlier
      expect(filtered).not.toContain(-100n);
    });

    it("should not filter anything if all values are within the mild IQR range", () => {
      const arr = [10n, 12n, 11n, 9n, 8n, 10n, 10n];
      const filtered = filterOutliers(arr, false, OutlierSensitivityEnum.Mild);
      // all within a small range => no outliers
      expect(filtered).toEqual(sortData(arr));
    });
  });
});
