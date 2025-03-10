"use strict";
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBenchFn = runBenchFn;
var debug_1 = require("debug");
var math_ts_1 = require("../utils/math.ts");
var options_ts_1 = require("./options.ts");
var linearAverage_ts_1 = require("./convergence/linearAverage.ts");
var coefficientOfVariance_ts_1 = require("./convergence/coefficientOfVariance.ts");
var debug = (0, debug_1.default)("@chainsafe/benchmark/run");
var convergenceCriteria = (_a = {},
    _a[ConvergenceEnum.Linear] = linearAverage_ts_1.createLinearConvergenceCriteria,
    _a[ConvergenceEnum.CV] = coefficientOfVariance_ts_1.createCVConvergenceCriteria,
    _a);
function runBenchFn(opts) {
    return __awaiter(this, void 0, void 0, function () {
        var id, before, beforeEach, fn, rest, benchOptions, maxMs, maxRuns, maxWarmUpMs, maxWarmUpRuns, runsFactor, threshold, convergence, averageCalculation, maxWarmUpRatio, maxWarmUpNs, runsNs, startRunMs, shouldTerminate, runIdx, totalNs, totalWarmUpNs, totalWarmUpRuns, isWarmUpPhase, inputAll, _a, elapsedMs, input, _b, startNs, endNs, runNs, averageNs, cleanData;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    id = opts.id, before = opts.before, beforeEach = opts.beforeEach, fn = opts.fn, rest = __rest(opts, ["id", "before", "beforeEach", "fn"]);
                    debug("running %o", id);
                    benchOptions = (0, options_ts_1.getBenchmarkOptionsWithDefaults)(rest);
                    maxMs = benchOptions.maxMs, maxRuns = benchOptions.maxRuns, maxWarmUpMs = benchOptions.maxWarmUpMs, maxWarmUpRuns = benchOptions.maxWarmUpRuns, runsFactor = benchOptions.runsFactor, threshold = benchOptions.threshold, convergence = benchOptions.convergence, averageCalculation = benchOptions.averageCalculation;
                    if (maxWarmUpMs >= maxMs) {
                        throw new Error("Warmup time must be lower than max run time. maxWarmUpMs: ".concat(maxWarmUpMs, ", maxMs: ").concat(maxMs));
                    }
                    if (maxWarmUpRuns >= maxRuns) {
                        throw new Error("Warmup runs must be lower than max runs. maxWarmUpRuns: ".concat(maxWarmUpRuns, ", maxRuns: ").concat(maxRuns));
                    }
                    if (averageCalculation !== "simple" && averageCalculation !== "clean-outliers") {
                        throw new Error("Average calculation logic is not defined. ".concat(averageCalculation));
                    }
                    if (!Object.values(ConvergenceEnum).includes(convergence)) {
                        throw new Error("Unknown convergence value ".concat(convergence, ". Valid values are ").concat(Object.values(ConvergenceEnum)));
                    }
                    maxWarmUpRatio = 0.5;
                    maxWarmUpNs = BigInt(benchOptions.maxWarmUpMs) * BigInt(1e6);
                    runsNs = [];
                    startRunMs = Date.now();
                    shouldTerminate = convergenceCriteria[convergence](startRunMs, benchOptions);
                    runIdx = 0;
                    totalNs = BigInt(0);
                    totalWarmUpNs = BigInt(0);
                    totalWarmUpRuns = 0;
                    isWarmUpPhase = maxWarmUpNs > 0 && maxWarmUpRuns > 0;
                    debug("starting before");
                    if (!before) return [3 /*break*/, 2];
                    return [4 /*yield*/, before()];
                case 1:
                    _a = _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = undefined;
                    _c.label = 3;
                case 3:
                    inputAll = _a;
                    debug("finished before");
                    _c.label = 4;
                case 4:
                    if (!true) return [3 /*break*/, 11];
                    debug("executing individual run isWarmUpPhase=%o", isWarmUpPhase);
                    elapsedMs = Date.now() - startRunMs;
                    debug("starting beforeEach");
                    if (!beforeEach) return [3 /*break*/, 6];
                    return [4 /*yield*/, beforeEach(inputAll, runIdx)];
                case 5:
                    _b = _c.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _b = undefined;
                    _c.label = 7;
                case 7:
                    input = _b;
                    debug("finished beforeEach");
                    startNs = process.hrtime.bigint();
                    return [4 /*yield*/, fn(input)];
                case 8:
                    _c.sent();
                    endNs = process.hrtime.bigint();
                    runNs = endNs - startNs;
                    if (!opts.yieldEventLoopAfterEach) return [3 /*break*/, 10];
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 0); })];
                case 9:
                    _c.sent();
                    _c.label = 10;
                case 10:
                    if (isWarmUpPhase) {
                        // Warm-up, do not count towards results
                        totalWarmUpRuns += 1;
                        totalWarmUpNs += runNs;
                        // On any warm-up finish condition, mark isWarmUp = true to prevent having to check them again
                        if (totalWarmUpNs >= maxWarmUpNs || totalWarmUpRuns >= maxWarmUpRuns || elapsedMs / maxMs >= maxWarmUpRatio) {
                            isWarmUpPhase = false;
                        }
                        return [3 /*break*/, 4];
                    }
                    // Persist results
                    runIdx += 1;
                    totalNs += runNs;
                    runsNs.push(runNs);
                    if (shouldTerminate(runIdx, totalNs, runsNs)) {
                        return [3 /*break*/, 11];
                    }
                    return [3 /*break*/, 4];
                case 11:
                    if (runIdx === 0) {
                        // Try to guess what happened
                        if (totalWarmUpRuns > 0) {
                            throw Error("\nNo run was completed before 'maxMs' ".concat(maxMs, ", but did ").concat(totalWarmUpRuns, " warm-up runs.\nConsider adjusting 'maxWarmUpMs' or 'maxWarmUpRuns' options orextend 'maxMs'\nif your function is very slow.\n").trim());
                        }
                        throw Error("\nNo run was completed before 'maxMs' ".concat(maxMs, ". Consider extending the 'maxMs' time if\neither the before(), beforeEach() or fn() functions are too slow.\n").trim());
                    }
                    if (averageCalculation === "simple") {
                        averageNs = Number(totalNs / BigInt(runIdx)) / runsFactor;
                    }
                    if (averageCalculation === "clean-outliers") {
                        cleanData = (0, math_ts_1.filterOutliers)(runsNs, false, OutlierSensitivityEnum.Mild);
                        averageNs = Number((0, math_ts_1.calcSum)(cleanData) / BigInt(cleanData.length)) / runsFactor;
                    }
                    return [2 /*return*/, {
                            result: {
                                id: id,
                                averageNs: averageNs,
                                runsDone: runIdx,
                                totalMs: Date.now() - startRunMs,
                                threshold: threshold,
                            },
                            runsNs: runsNs,
                        }];
            }
        });
    });
}
