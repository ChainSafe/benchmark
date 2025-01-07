import path from "node:path";
import fs from "node:fs";
import {LocalHistoryProvider} from "../history/local.js";
import {consoleLog} from "../utils/output.js";
import {compareBenchmarks} from "../compare/compute.js";
import {renderBenchmarkComparisonTable} from "../utils/render.js";
import {isGaRun} from "../github/context.js";
import {postGaCommentCrossComparison} from "../github/comment.js";

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
        throw Error(`Benchmark directory ${dirPath} does not contain nay history.`);
      }
      benchmarks.push(history[0]);
    } catch {
      throw Error(`Benchmark directory ${dirPath} does not contain nay history. Or not a valid benchmark.`);
    }
  }

  const resultsComp = compareBenchmarks(benchmarks);

  consoleLog(renderBenchmarkComparisonTable(resultsComp, "cli"));

  if (isGaRun()) {
    await postGaCommentCrossComparison(resultsComp);
  }
}
