import {Suite} from "@vitest/runner";

export function getParentSuite(ctx: Mocha.Context): Mocha.Suite {
  const test = ctx.currentTest ?? ctx.test;
  if (!test) throw Error("this.test not set");
  if (!test.parent) throw Error("this.test.parent not set");
  return test.parent;
}

export function getRootSuite(suite: Suite): Suite {
  if (!suite.suite) return suite;
  return getRootSuite(suite.suite);
}

// export function getAllTestsInRootSuite(ctx: Mocha.Context): Mocha.Test[] {
//   const parent = getParentSuite(ctx);
//   const rootSuite = getRootSuite(parent);

//   const tests: Mocha.Test[] = [];

//   function getTests(suite: Mocha.Suite): void {
//     for (const test of suite.tests) {
//       tests.push(test);
//     }
//     for (const childSuite of suite.suites) {
//       getTests(childSuite);
//     }
//   }

//   getTests(rootSuite);

//   return tests;
// }
