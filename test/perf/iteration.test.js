"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("../../src/index.js");
// As of Jun 17 2021
// Compare state root
// ================================================================
// ssz.Root.equals                                                        891265.6 ops/s      1.122000 us/op 10017946 runs    15.66 s
// ssz.Root.equals with valueOf()                                         692041.5 ops/s      1.445000 us/op 8179741 runs    15.28 s
// byteArrayEquals with valueOf()                                         853971.0 ops/s      1.171000 us/op 9963051 runs    16.07 s
(0, index_js_1.describe)("Array iteration", function () {
    (0, index_js_1.setBenchOpts)({ maxMs: 60 * 1000, convergeFactor: 1 / 100 });
    // nonce = 5
    var n = 1e6;
    var arr = Array.from({ length: n }, function (_, i) { return i; });
    (0, index_js_1.bench)("sum array with raw for loop", function () {
        var sum = 0;
        for (var i = 0, len = arr.length; i < len; i++) {
            sum += i;
        }
        return sum;
    });
    (0, index_js_1.bench)("sum array with reduce", function () {
        arr.reduce(function (total, curr) { return total + curr; }, 0);
        // Uncomment below to cause a guaranteed performance regression
        // arr.reduce((total, curr) => total + curr, 0);
        // arr.reduce((total, curr) => total + curr, 0);
    });
    // Test before and beforeEach hooks
    (0, index_js_1.bench)({
        id: "sum array with reduce beforeEach",
        beforeEach: function () { return Array.from({ length: 1e4 }, function (_, i) { return i; }); },
        fn: function (arrayFromBeforeEach) {
            arrayFromBeforeEach.reduce(function (total, curr) { return total + curr; }, 0);
            // Uncomment below to cause a guaranteed performance regression
            // arr.reduce((total, curr) => total + curr, 0);
            // arr.reduce((total, curr) => total + curr, 0);
        },
    });
    (0, index_js_1.bench)({
        id: "sum array with reduce before beforeEach",
        before: function () { return Array.from({ length: 1e4 }, function (_, i) { return i; }); },
        beforeEach: function (arrFromBefore) { return arrFromBefore.slice(0); },
        fn: function (arrayFromBeforeEach) {
            arrayFromBeforeEach.reduce(function (total, curr) { return total + curr; }, 0);
            // Uncomment below to cause a guaranteed performance regression
            // arr.reduce((total, curr) => total + curr, 0);
            // arr.reduce((total, curr) => total + curr, 0);
        },
    });
    // Reporter options
    (0, index_js_1.bench)({
        id: "sum array with reduce high threshold",
        threshold: 5,
        fn: function () {
            arr.reduce(function (total, curr) { return total + curr; }, 0);
        },
    });
    (0, index_js_1.bench)({
        id: "sum array with reduce no threshold",
        threshold: Infinity,
        fn: function () {
            arr.reduce(function (total, curr) { return total + curr; }, 0);
        },
    });
});
