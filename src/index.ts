export {suite as describe, beforeEach, beforeAll} from "@vitest/runner";
export {bench, setBenchOpts, setBenchmarkOptions} from "./benchmark/index.js";

import {bench} from "./benchmark/index.js";
import {test} from "@vitest/runner";

/**
 * @deprecated We recommend to use `bench` instead.
 */
export const itBench = bench;

/**
 * Defines a test case with a given name and test function. The test function can optionally be configured with test options.
 *
 *  * **Note:** We expose this utility for user flexibility but recommends users to not mix normal tests with benchmarks
 *
 * @param {string | Function} name - The name of the test or a function that will be used as a test name.
 * @param {TestOptions | TestFunction} [optionsOrFn] - Optional. The test options or the test function if no explicit name is provided.
 * @param {number | TestOptions | TestFunction} [optionsOrTest] - Optional. The test function or options, depending on the previous parameters.
 * @throws {Error} If called inside another test function.
 * @example
 * ```ts
 * // Define a simple test
 * it('should add two numbers', () => {
 *   expect(add(1, 2)).toBe(3);
 * });
 * ```
 * @example
 * ```ts
 * // Define a test with options
 * it('should subtract two numbers', { retry: 3 }, () => {
 *   expect(subtract(5, 2)).toBe(3);
 * });
 * ```
 */
export const it = test;
