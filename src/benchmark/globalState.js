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
exports.store = void 0;
var debug_1 = require("debug");
var debug = (0, debug_1.default)("@chainsafe/benchmark/state");
/**t
 * Map of results by root suite.
 */
var results = new Map();
/**
 * Global opts from CLI
 */
var globalOpts;
/**
 * Map to persist options set in describe blocks
 */
var optsMap = new Map();
exports.store = {
    getResult: function (id) {
        return results.get(id);
    },
    setResult: function (id, result) {
        debug("setting result for %o", id);
        results.set(id, result);
    },
    getAllResults: function () {
        return __spreadArray([], results.values(), true);
    },
    getOptions: function (suite) {
        return optsMap.get(suite);
    },
    setOptions: function (suite, opts) {
        if (Object.keys(opts).length === 0)
            return;
        debug("setting options for %o with name %o %O", suite.type, suite.name, opts);
        optsMap.set(suite, opts);
    },
    removeOptions: function (suite) {
        debug("removing options for %o with name %o", suite.type, suite.name);
        optsMap.delete(suite);
    },
    setGlobalOptions: function (opts) {
        debug("setting global options %O", opts);
        globalOpts = opts;
    },
    getGlobalOptions: function () {
        return globalOpts;
    },
};
