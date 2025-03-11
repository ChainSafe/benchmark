import logSymbols from "log-symbols";

const colors = {
  pass: 90,
  fail: 31,
  brightPass: 92,
  brightFail: 91,
  brightYellow: 93,
  pending: 36,
  suite: 0,
  errorTitle: 0,
  errorMessage: 31,
  errorStack: 90,
  checkmark: 32,
  fast: 90,
  medium: 33,
  slow: 31,
  green: 32,
  light: 90,
  diffGutter: 90,
  diffAdded: 32,
  diffRemoved: 31,
  diffAddedInline: "30;42",
  diffRemovedInline: "30;41",
};

export const symbols = {
  ok: logSymbols.success,
  err: logSymbols.error,
  dot: ".",
  comma: ",",
  bang: "!",
};

export function color(type: keyof typeof colors, str: string): string {
  return "\u001b[" + colors[type] + "m" + str + "\u001b[0m";
}

export function consoleLog(...args: unknown[]): void {
  // biome-ignore lint/suspicious/noConsoleLog: We explicitly need to log some output
  console.log(...args);
}
