// eslint-disable-next-line import/no-extraneous-dependencies
import {defineConfig, ViteUserConfig} from "vitest/config";

type Runtime = "node" | "deno" | "bun";

function getRuntime(): Runtime {
  if ("bun" in process.versions) return "bun";
  if ("deno" in process.versions) return "deno";

  return "node";
}

function getPoolOptions(runtime: Runtime): ViteUserConfig["test"] {
  if (runtime === "node") {
    return {
      pool: "threads",
      poolOptions: {
        threads: {
          singleThread: true,
          minThreads: 2,
          maxThreads: 10,
        },
      },
    };
  }

  return {
    pool: "vitest-in-process-pool",
  };
}

export default defineConfig({
  test: {
    ...getPoolOptions(getRuntime()),
  },
});
