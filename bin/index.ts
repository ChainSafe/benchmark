// Make a file a module as top-level import is only possible via module
export {};

await import("../src/cli/cli.ts");
