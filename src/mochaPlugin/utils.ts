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
