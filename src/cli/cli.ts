// Must not use `* as yargs`, see https://github.com/yargs/yargs/issues/1131
import yargs from "yargs";
import fs from "node:fs";
import path from "node:path";
import Debug from "debug";
import {parse as parseYaml} from "yaml";
import {hideBin} from "yargs/helpers";

const debug = Debug("@chainsafe/benchmark/cli");

import {benchmarkOptions, CLIOptions, fileCollectionOptions, storageOptions} from "./options.js";
import {run} from "./run.js";
import {compare} from "./compare.js";

void yargs(hideBin(process.argv))
  .env("BENCHMARK")
  .scriptName("benchmark")
  .command({
    command: ["$0 [spec..]", "inspect"],
    describe: "Run benchmarks",
    builder: function (yar) {
      return yar.options({...fileCollectionOptions, ...storageOptions, ...benchmarkOptions});
    },
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
    builder: function (yar) {
      return yar.option("dir", {type: "string", array: true, normalize: true, desc: "List of directories to compare"});
    },
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
    } else if (ext === ".yaml" || ext === ".yml") {
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
    if (msg) {
      // Show command help message when no command is provided
      if (msg.includes("Not enough non-option arguments")) {
        // eslint-disable-next-line no-console
        console.log("\n");
      }
    }

    const errorMessage = err ? err.stack || err.message : msg || "Unknown error";

    // eslint-disable-next-line no-console
    console.error(` ✖ ${errorMessage}\n`);
    process.exit(1);
  })
  .parse();
