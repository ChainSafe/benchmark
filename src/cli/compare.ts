import fs from "node:fs";
import path from "node:path";
import {computeComparisonReport} from "../compare/compute.ts";
import {benchmarkComparisonComment} from "../github/comments/comparisonReportComment.ts";
import {postGaComment} from "../github/comments/index.ts";
import {isGaRun} from "../github/context.ts";
import {GithubCommentTagEnum} from "../github/octokit.ts";
import {LocalHistoryProvider} from "../history/local.ts";
import {consoleLog} from "../utils/output.ts";
import {renderBenchmarkComparisonTable} from "../utils/render.ts";

export async function compare({dirs}: {dirs: string[]}): Promise<void> {
  consoleLog("Comparing benchmarks:");
  for (const dir of dirs) {
    consoleLog(`- ${dir}`);
  }

  const benchmarks = [];

  for (const dir of dirs) {
    const dirPath = path.resolve(dir);
    if (!fs.existsSync(dirPath)) {
      throw Error(`Benchmark directory ${dirPath} does not exits`);
    }
    const provider = new LocalHistoryProvider(dirPath);
    try {
      const history = await provider.readHistory();
      if (history.length === 0) {
        throw Error(`Benchmark directory ${dirPath} does not contain history.`);
      }
      benchmarks.push(history[0]);
    } catch {
      throw Error(`Benchmark directory ${dirPath} does not contain history, nor a valid benchmark.`);
    }
  }

  const resultsComp = computeComparisonReport(benchmarks);

  consoleLog(renderBenchmarkComparisonTable(resultsComp, "cli"));

  if (isGaRun()) {
    await postGaComment({
      commentBody: benchmarkComparisonComment(resultsComp),
      tag: GithubCommentTagEnum.ComparisonReport,
      commentOnPush: true,
    });
  }
}
