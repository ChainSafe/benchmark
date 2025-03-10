"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBenchmarkOptions = exports.bench = void 0;
exports.setBenchOpts = setBenchOpts;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var runner_1 = require("@vitest/runner");
var utils_1 = require("@vitest/runner/utils");
var globalState_ts_1 = require("./globalState.ts");
var runBenchmarkFn_ts_1 = require("./runBenchmarkFn.ts");
var options_ts_1 = require("./options.ts");
exports.bench = createBenchmarkFunction(function (idOrOpts, fn) {
    var _a, _b, _c, _d;
    var _e = coerceToOptsObj(idOrOpts, fn), benchTask = _e.fn, before = _e.before, beforeEach = _e.beforeEach, opts = __rest(_e, ["fn", "before", "beforeEach"]);
    var currentSuite = (0, runner_1.getCurrentSuite)();
    var globalOptions = (_a = globalState_ts_1.store.getGlobalOptions()) !== null && _a !== void 0 ? _a : {};
    var parentOptions = (_b = globalState_ts_1.store.getOptions(currentSuite)) !== null && _b !== void 0 ? _b : {};
    var options = (0, options_ts_1.getBenchmarkOptionsWithDefaults)(__assign(__assign(__assign({}, globalOptions), parentOptions), opts));
    function handler() {
        return __awaiter(this, void 0, void 0, function () {
            var _a, result, runsNs, benchmarkResultsCsvDir, filename, filepath;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Ensure bench id is unique
                        if (globalState_ts_1.store.getResult(opts.id) && !opts.skip) {
                            throw Error("test titles must be unique, duplicated: '".concat(opts.id, "'"));
                        }
                        return [4 /*yield*/, (0, runBenchmarkFn_ts_1.runBenchFn)(__assign(__assign({}, options), { fn: benchTask, before: before, beforeEach: beforeEach }))];
                    case 1:
                        _a = _b.sent(), result = _a.result, runsNs = _a.runsNs;
                        // Store result for:
                        // - to persist benchmark data latter
                        // - to render with the custom reporter
                        globalState_ts_1.store.setResult(opts.id, result);
                        benchmarkResultsCsvDir = process.env.BENCHMARK_RESULTS_CSV_DIR;
                        if (benchmarkResultsCsvDir) {
                            node_fs_1.default.mkdirSync(benchmarkResultsCsvDir, { recursive: true });
                            filename = "".concat(result.id, ".csv");
                            filepath = node_path_1.default.join(benchmarkResultsCsvDir, filename);
                            node_fs_1.default.writeFileSync(filepath, runsNs.join("\n"));
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    var task = currentSuite.task(opts.id, {
        skip: (_c = opts.skip) !== null && _c !== void 0 ? _c : this.skip,
        only: (_d = opts.only) !== null && _d !== void 0 ? _d : this.only,
        sequential: true,
        concurrent: false,
        timeout: options.timeoutBench,
        meta: {
            "chainsafe/benchmark": true,
        },
    });
    (0, runner_1.setFn)(task, handler);
    globalState_ts_1.store.setOptions(task, opts);
    var cleanup = function () {
        globalState_ts_1.store.removeOptions(task);
        // Clear up the assigned handler to clean the memory
        // @ts-expect-error
        (0, runner_1.setFn)(task, null);
    };
    task.onFailed = [cleanup];
    task.onFinished = [cleanup];
});
function createBenchmarkFunction(fn) {
    return (0, utils_1.createChainable)(["skip", "only"], fn);
}
function coerceToOptsObj(idOrOpts, fn) {
    var opts;
    if (typeof idOrOpts === "string") {
        if (!fn)
            throw Error("fn arg must be set");
        opts = { id: idOrOpts, fn: fn };
    }
    else {
        if (fn) {
            opts = __assign(__assign({}, idOrOpts), { fn: fn });
        }
        else {
            var optsWithFn = idOrOpts;
            if (!optsWithFn.fn)
                throw Error("opts.fn arg must be set");
            opts = optsWithFn;
        }
    }
    return opts;
}
/**
 * Customize benchmark opts for a describe block
 * ```ts
 * describe("suite A1", function () {
 *   setBenchOpts({runs: 100});
 *   // 100 runs
 *   itBench("bench A1.1", function() {});
 *   itBench("bench A1.2", function() {});
 *   // 300 runs
 *   itBench({id: "bench A1.3", runs: 300}, function() {});
 *
 *   // Supports nesting, child has priority over parent.
 *   // Arrow functions can be used, won't break it.
 *   describe("suite A2", () => {
 *     setBenchOpts({runs: 200});
 *     // 200 runs.
 *     itBench("bench A2.1", () => {});
 *   })
 * })
 * ```
 */
function setBenchOpts(opts) {
    var suite = (0, runner_1.getCurrentSuite)();
    globalState_ts_1.store.setOptions(suite, opts);
    suite.on("afterAll", function () {
        globalState_ts_1.store.removeOptions(suite);
    });
}
exports.setBenchmarkOptions = setBenchOpts;
