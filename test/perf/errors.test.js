"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("../../src/index.js");
// This test file is to validate the error cases manually
// should not be included into actual benchmarks as there are cases
// in this file which will always fail.
(0, index_js_1.describe)("Hooks", function () {
    (0, index_js_1.bench)("normal benchmark", function () {
        var arr = Array.from({ length: 10 }, function (_, i) { return i; });
        arr.reduce(function (total, curr) { return total + curr; }, 0);
    });
    index_js_1.bench.skip("normal skipped", function () {
        var arr = Array.from({ length: 10 }, function (_, i) { return i; });
        arr.reduce(function (total, curr) { return total + curr; }, 0);
    });
    (0, index_js_1.describe)("before", function () {
        (0, index_js_1.bench)({
            id: "before failed",
            before: function () {
                throw new Error("Failed in before");
            },
            fn: function () {
                var arr = Array.from({ length: 10 }, function (_, i) { return i; });
                arr.reduce(function (total, curr) { return total + curr; }, 0);
            },
        });
    });
    (0, index_js_1.describe)("beforeEach", function () {
        (0, index_js_1.bench)({
            id: "beforeEach failed",
            beforeEach: function () {
                throw new Error("Failed in beforeEach");
            },
            fn: function () {
                var arr = Array.from({ length: 10 }, function (_, i) { return i; });
                arr.reduce(function (total, curr) { return total + curr; }, 0);
            },
        });
    });
    (0, index_js_1.bench)({
        id: "error during fn",
        fn: function () {
            throw new Error("Failed in fn");
        },
    });
});
