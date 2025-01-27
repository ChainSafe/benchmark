import {describe, it, expect} from "vitest";
import {
  calcSum,
  calcMean,
  calcVariance,
  sortData,
  calcMedian,
  calcQuartile,
  OutlierSensitivity,
  filterOutliers,
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
      // By default, dividing by BigInt(0) will throw in JavaScript.
      // If you want a different behavior, you can wrap your function or catch errors here.
      expect(() => calcMean([])).toThrow();
    });

    it("should correctly calculate the mean of a single-element array", () => {
      const arr = [5n];
      expect(calcMean(arr)).toBe(5n);
    });

    it("should correctly calculate the mean of multiple BigInts", () => {
      const arr = [2n, 4n, 6n];
      // sum=12, length=3 => mean=4
      expect(calcMean(arr)).toBe(4n);
    });

    it("should handle negative values correctly", () => {
      const arr = [-5n, -15n, 10n];
      // sum=-10, length=3 => mean=-3.333..., but truncated to BigInt => -3n if using integer division
      expect(calcMean(arr)).toBe(-3n);
    });
  });

  describe("calcVariance", () => {
    it("should compute variance for a small sample of integers", () => {
      const arr = [2n, 4n, 4n, 6n, 8n];
      // mean = (2+4+4+6+8)/5 = 24/5 = 4.8 => truncated to 4n if using integer division
      // If mean=4n, diffs = (-2,0,0,2,4), squares = (4,0,0,4,16), sum=24 => var=24/5=4.8 => truncated to 4n
      const meanBigInt = calcMean(arr);
      const varianceBigInt = calcVariance(arr, meanBigInt);
      expect(varianceBigInt).toBe(4n);
    });

    it("should handle a single-element array (variance=0)", () => {
      const arr = [100n];
      const mean = calcMean(arr); // 100n
      const variance = calcVariance(arr, mean);
      expect(variance).toBe(0n);
    });

    it("should handle negative values", () => {
      const arr = [-10n, -4n, -2n];
      // sum = -16, length=3 => mean = floor(-16/3) = -5n
      // diffs = (-5,1,3), squares=(25,1,9)=35 => var=35/3=11 => 11n
      const mean = calcMean(arr);
      const variance = calcVariance(arr, mean);
      expect(variance).toBe(11n);
    });

    it("should return 0 for an array of identical values", () => {
      const arr = [5n, 5n, 5n];
      const mean = calcMean(arr);
      const variance = calcVariance(arr, mean);
      expect(variance).toBe(0n);
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
      expect(calcMedian(arr, false)).toBe(2n);
    });

    it("should return the average of two middle elements when the array length is even", () => {
      const arr = [3n, 1n, 2n, 4n];
      // sorted = [1n, 2n, 3n, 4n]
      // middle indices = 1,2 => average => (2n+3n)/2n=2n
      expect(calcMedian(arr, false)).toBe(2n);
    });

    it("should skip re-sorting if 'sorted=true' is provided", () => {
      // already sorted
      const arr = [1n, 2n, 3n, 4n];
      expect(calcMedian(arr, true)).toBe(2n); // middle indices => 1n,2n => average=2n
    });
  });

  describe("calcQuartile", () => {
    const sortedData = sortData([1n, 2n, 4n, 10n, 20n, 100n]);

    it("should return the first quartile (Q1) => percentile=0.25", () => {
      // sorted array = [1n, 2n, 4n, 10n, 20n, 100n]
      // length=6 => index = (6-1)*0.25=1.25 => floor=1 => fraction=0.25
      // base=2n, next=4n => difference=2n => fraction=0.25 => 2 + 0.25*2=2.5 => ~ BigInt(2.5)
      // Because we must do BigInt arithmetic carefully, the function does Number(...) inside
      // => the result = 2n + 0.25*(4-2)=2n + 0.5=2.5 => cast => 2n if trunc
      // But the function does => BigInt(2 + fraction*(4-2)) => 2 + 0.25*2 => 2.5
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
      expect(filterOutliers(arr, false, OutlierSensitivity.Mild)).toEqual([1n, 100n]);
    });

    it("should remove outliers using the Mild (1.5x IQR) approach", () => {
      // Example: [1n, 2n, 4n, 10n, 20n, 100n]
      // sorted => [1n,2n,4n,10n,20n,100n]
      // Q1=2n, Q3=20n => iqr=18 => mild => +/- 1.5*18=27 => lower=2-27=-25 => upper=20+27=47
      // So any element outside -25..47 is out => 100n is out
      const arr = [20n, 100n, 2n, 10n, 1n, 4n];
      const filtered = filterOutliers(arr, false, OutlierSensitivity.Mild);
      expect(filtered).toEqual([1n, 2n, 4n, 10n, 20n]);
    });

    it("should remove outliers using the Strict (3.0x IQR) approach", () => {
      // same array => Q1=2n, Q3=20n => iqr=18 => strict => +/- 3.0*18=54 => lower=-52 => upper=74
      // 100 is outside => filter it out
      const arr = [20n, 100n, 2n, 10n, 1n, 4n];
      const filtered = filterOutliers(arr, false, OutlierSensitivity.Strict);
      expect(filtered).toEqual([1n, 2n, 4n, 10n, 20n]);
    });

    it("should handle negative values correctly", () => {
      // e.g. [-100n, -10n, -5n, -2n, -1n, 0n, 1n, 5n, 6n]
      // We'll skip the exact math here, but we test that they are sorted and outliers removed
      const arr = [-10n, 6n, -2n, -100n, -5n, 1n, -1n, 5n, 0n];
      const filtered = filterOutliers(arr, false, OutlierSensitivity.Mild);
      // We can check that -100n is probably an outlier
      expect(filtered).not.toContain(-100n);
    });

    it("should not filter anything if all values are within the mild IQR range", () => {
      const arr = [10n, 12n, 11n, 9n, 8n, 10n, 10n];
      const filtered = filterOutliers(arr, false, OutlierSensitivity.Mild);
      // all within a small range => no outliers
      expect(filtered).toEqual(sortData(arr));
    });
  });
});
