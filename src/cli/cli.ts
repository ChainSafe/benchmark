import fs from "node:fs";
import path from "node:path";
import Debug from "debug";
import {parse as parseYaml} from "yaml";
// Must not use `* as yargs`, see https://github.com/yargs/yargs/issues/1131
import yargs from "yargs";
import {hideBin} from "yargs/helpers";

const debug = Debug("@chainsafe/benchmark/cli");

import {consoleLog} from "../utils/output.ts";
import {compare} from "./compare.ts";
import {CLIOptions, benchmarkOptions, fileCollectionOptions, storageOptions} from "./options.ts";
import {run} from "./run.ts";

void yargs(hideBin(process.argv))
  .env("BENCHMARK")
  .scriptName("benchmark")
  .command({
    command: ["$0 [spec..]", "inspect"],
    describe: "Run benchmarks",
    builder: (yar) => yar.options({...fileCollectionOptions, ...storageOptions, ...benchmarkOptions}),
    handler: async (argv) => {
      const cliOpts = {...argv} as unknown as CLIOptions & {spec: string[]};
      debug("Executing command run with %O", cliOpts);

      await run(cliOpts);
    },
  })
  .command({
    command: "compare <dirs...>",
    aliases: ["cmp"],
    describe: "Compare multiple benchmark outputs",
    builder: (yar) =>
      yar.option("dir", {type: "string", array: true, normalize: true, desc: "List of directories to compare"}),
    handler: async (argv) => {
      const cliOpts = {...argv} as unknown as {dirs: string[]};
      debug("Executing command compare with %O", cliOpts);

      await compare(cliOpts);
    },
  })
  .config("config", (configPath): CLIOptions => {
    const ext = path.extname(configPath);
    if (ext === ".json") {
      return JSON.parse(fs.readFileSync(configPath, "utf-8")) as CLIOptions;
    }

    if (ext === ".yaml" || ext === ".yml") {
      return parseYaml(fs.readFileSync(configPath, "utf8")) as CLIOptions;
    }

    throw new Error(`Can not recognized file ${configPath}`);
  })
  .parserConfiguration({
    // As of yargs v16.1.0 dot-notation breaks strictOptions()
    // Manually processing options is typesafe tho more verbose
    "dot-notation": false,
    "combine-arrays": true,
    "short-option-groups": false,
    "strip-aliased": true,
  })
  .usage(
    `Benchmark runner to track performance.

  benchmark --local 'test/**/*.perf.ts'
`
  )
  .epilogue("For more information, check the CLI reference _TBD_")
  // DO NOT USE "h", "v" aliases. Those break the --help functionality
  // .alias("h", "help")
  // .alias("v", "version")
  .recommendCommands()
  .showHelpOnFail(true)
  .fail((msg, err) => {
    // Show command help message when no command is provided
    if (msg?.includes("Not enough non-option arguments")) {
      consoleLog("\n");
    }

    const errorMessage = err ? err.stack || err.message : msg || "Unknown error";

    console.error(` ✖ ${errorMessage}\n`);
    process.exit(1);
  })
  .parse();
