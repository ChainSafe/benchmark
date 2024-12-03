// Must not use `* as yargs`, see https://github.com/yargs/yargs/issues/1131
import yargs from "yargs";
import {hideBin} from "yargs/helpers";

import {benchmarkOptions, CLIOptions, fileCollectionOptions, storageOptions} from "./options.js";
import {run} from "./run.js";

void yargs(hideBin(process.argv))
  .env("BENCHMARK")
  .scriptName("benchmark")
  .command({
    command: ["$0 [spec..]", "inspect"],
    describe: "Run benchmarks",
    handler: async (argv) => {
      const cliOpts = {...argv} as unknown as CLIOptions & {spec: string[]};

      await run(cliOpts);
    },
  })

  .parserConfiguration({
    // As of yargs v16.1.0 dot-notation breaks strictOptions()
    // Manually processing options is typesafe tho more verbose
    "dot-notation": false,
    // From mocha
    "combine-arrays": true,
    "short-option-groups": false,
    "strip-aliased": true,
  })
  .options({...fileCollectionOptions, ...storageOptions, ...benchmarkOptions})
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
  .fail((msg, err) => {
    if (msg) {
      // Show command help message when no command is provided
      if (msg.includes("Not enough non-option arguments")) {
        yargs.showHelp();
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
