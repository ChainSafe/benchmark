import * as github from "@actions/github";
import {getHistoryProvider} from "../history/index.js";
import {resolveShouldPersist} from "../history/shouldPersist.js";
import {validateBenchmark} from "../history/schema.js";
import {Benchmark, BenchmarkOpts, FileCollectionOptions, StorageOptions} from "../types.js";
import {renderCompareWith, resolveCompareWith, resolvePrevBenchmark} from "../compare/index.js";
import {parseBranchFromRef, getCurrentCommitInfo, shell, getCurrentBranch, collectFiles} from "../utils/index.js";
import {computePerformanceReport} from "../compare/compute.js";
import {postGaComment} from "../github/comments/index.js";
import {isGaRun} from "../github/context.js";
import {BenchmarkRunner} from "../benchmark/runner.js";
import {optionsDefault} from "./options.js";
import {consoleLog} from "../utils/output.js";
import {HistoryProviderType} from "../history/provider.js";
import {performanceReportComment} from "../github/comments/performanceReportComment.js";
import {GithubCommentTag} from "../github/octokit.js";

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

  const runner = new BenchmarkRunner({prevBench, benchmarkOpts: opts});
  const results = await runner.process(files);

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
  if (shouldPersist === true) {
    const branch =
      currentCommit.branch ??
      parseBranchFromRef(
        github.context.ref ?? (await shell("git symbolic-ref HEAD")),
        historyProvider.type === HistoryProviderType.Local
      );
    consoleLog(`Persisting new benchmark data for branch '${branch}' commit '${currBench.commitSha}'`);
    // TODO: prune and limit total entries
    // appendBenchmarkToHistoryAndPrune(history, currBench, branch, opts);
    await historyProvider.writeLatestInBranch(branch, currBench);
    await historyProvider.writeToHistory(currBench);
  }

  const resultsComp = computePerformanceReport(currBench, prevBench, opts.threshold);

  if (!opts.skipPostComment && isGaRun()) {
    await postGaComment({
      commentBody: performanceReportComment(resultsComp),
      tag: GithubCommentTag.PerformanceReport,
      commentOnPush: resultsComp.someFailed,
    });
  }

  if (resultsComp.someFailed && !opts.noThrow) {
    throw Error("Performance regression");
  }
}
