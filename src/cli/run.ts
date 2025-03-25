import * as github from "@actions/github";
import Debug from "debug";
import {getHistoryProvider} from "../history/index.js";
import {resolveShouldPersist} from "../history/shouldPersist.js";
import {validateBenchmark} from "../history/schema.js";
import {Benchmark, BenchmarkOpts, FileCollectionOptions, StorageOptions} from "../types.js";
import {renderCompareWith, resolveCompareWith, resolvePrevBenchmark} from "../compare/index.js";
import {
  parseBranchFromRef,
  getCurrentCommitInfo,
  shell,
  getCurrentBranch,
  collectFiles,
  sortFiles,
} from "../utils/index.js";
import {computePerformanceReport} from "../compare/compute.js";
import {postGaComment} from "../github/comments/index.js";
import {isGaRun} from "../github/context.js";
import {BenchmarkRunner} from "../benchmark/runner.js";
import {optionsDefault} from "./options.js";
import {consoleLog} from "../utils/output.js";
import {HistoryProviderEnum} from "../history/provider.js";
import {performanceReportComment} from "../github/comments/performanceReportComment.js";
import {GithubCommentTagEnum} from "../github/octokit.js";
import {defaultBenchmarkOptions} from "../benchmark/options.js";

const debug = Debug("@chainsafe/benchmark/cli");

export async function run(opts_: FileCollectionOptions & StorageOptions & BenchmarkOpts): Promise<void> {
  const opts = Object.assign({}, optionsDefault, opts_);

  // Retrieve history
  const historyProvider = getHistoryProvider(opts);
  consoleLog(`Connected to historyProvider: ${historyProvider.providerInfo()}`);

  // Select prev benchmark to compare against
  const compareWith = await resolveCompareWith(opts);
  const prevBench = await resolvePrevBenchmark(compareWith, historyProvider);
  if (prevBench) {
    consoleLog(`Found previous benchmark for ${renderCompareWith(compareWith)}, at commit ${prevBench.commitSha}`);
    validateBenchmark(prevBench);
  } else {
    consoleLog(`No previous benchmark found for ${renderCompareWith(compareWith)}`);
  }

  const {files, unmatchedFiles} = await collectFiles(opts).catch((err) => {
    consoleLog("Error loading up spec patterns");
    throw err;
  });

  if (unmatchedFiles.length > 0) {
    consoleLog(`Found unmatched files: \n${unmatchedFiles.join("\n")}\n`);
  }

  if (files.length === 0) {
    consoleLog(`Can not find any matching spec file for ${opts.spec.join(",")}\n`);
    process.exit(1);
  }

  try {
    const runner = new BenchmarkRunner({prevBench, benchmarkOpts: opts});
    const results = await runner.process(opts.sort ? sortFiles(files) : files);

    if (results.length === 0) {
      throw Error("No benchmark result was produced");
    }

    const currentCommit = await getCurrentCommitInfo();
    const currBench: Benchmark = {
      commitSha: currentCommit.commitSha,
      results,
    };

    // Persist new benchmark data
    const currentBranch = await getCurrentBranch();
    const shouldPersist = await resolveShouldPersist(opts, currentBranch);

    debug("detecting to persist results. found: %o", shouldPersist);
    if (shouldPersist === true) {
      const branch =
        currentCommit.branch ??
        parseBranchFromRef(
          github.context.ref ?? (await shell("git symbolic-ref HEAD")),
          historyProvider.type === HistoryProviderEnum.Local
        );
      consoleLog(`Persisting new benchmark data for branch '${branch}' commit '${currBench.commitSha}'`);
      // TODO: prune and limit total entries
      // appendBenchmarkToHistoryAndPrune(history, currBench, branch, opts);
      await historyProvider.writeLatestInBranch(branch, currBench);
      await historyProvider.writeToHistory(currBench);
    }

    const resultsComp = computePerformanceReport(
      currBench,
      prevBench,
      opts.threshold ?? defaultBenchmarkOptions.threshold
    );

    debug("detecting to post comment. skipPostComment: %o, isGaRun: %o", !opts.skipPostComment, isGaRun());
    if (!opts.skipPostComment && isGaRun()) {
      await postGaComment({
        commentBody: performanceReportComment(resultsComp),
        tag: GithubCommentTagEnum.PerformanceReport,
        commentOnPush: resultsComp.someFailed,
      });
    }

    if (resultsComp.someFailed && !opts.noThrow) {
      throw Error("Performance regression");
    }
  } catch (err) {
    consoleLog(`Error processing benchmark files. ${(err as Error).message}`);
    throw err;
  }
}
