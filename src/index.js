"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itBench = exports.setBenchmarkOptions = exports.setBenchOpts = exports.bench = exports.afterEach = exports.afterAll = exports.beforeAll = exports.beforeEach = exports.describe = void 0;
var runner_1 = require("@vitest/runner");
Object.defineProperty(exports, "describe", { enumerable: true, get: function () { return runner_1.suite; } });
Object.defineProperty(exports, "beforeEach", { enumerable: true, get: function () { return runner_1.beforeEach; } });
Object.defineProperty(exports, "beforeAll", { enumerable: true, get: function () { return runner_1.beforeAll; } });
Object.defineProperty(exports, "afterAll", { enumerable: true, get: function () { return runner_1.afterAll; } });
Object.defineProperty(exports, "afterEach", { enumerable: true, get: function () { return runner_1.afterEach; } });
var index_ts_1 = require("./benchmark/index.ts");
Object.defineProperty(exports, "bench", { enumerable: true, get: function () { return index_ts_1.bench; } });
Object.defineProperty(exports, "setBenchOpts", { enumerable: true, get: function () { return index_ts_1.setBenchOpts; } });
Object.defineProperty(exports, "setBenchmarkOptions", { enumerable: true, get: function () { return index_ts_1.setBenchmarkOptions; } });
var index_ts_2 = require("./benchmark/index.ts");
/**
 * @deprecated We recommend to use `bench` instead.
 */
exports.itBench = index_ts_2.bench;
