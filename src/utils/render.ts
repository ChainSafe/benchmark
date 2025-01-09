import {BenchmarkComparisonReport, PerformanceReport, PerformanceResult} from "../types.js";
import {CellOptions, CellValue, ExtendedTable} from "./extendedTable.js";

type CommitsSha = Pick<PerformanceReport, "currCommitSha" | "prevCommitSha">;

export function renderPerformanceTable(
  results: PerformanceResult[],
  {currCommitSha, prevCommitSha}: CommitsSha,
  output: "cli" | "html"
): string {
  const table = new ExtendedTable({
    head: ["Benchmark suite", `Current: ${currCommitSha}`, `Previous: ${prevCommitSha}`, "Ratio"],
  });

  for (const result of results) {
    const {id, prevAverageNs, currAverageNs, ratio} = result;

    if (prevAverageNs != undefined && ratio != undefined) {
      table.push([id, prettyTimeStr(currAverageNs), prettyTimeStr(prevAverageNs), ratio.toFixed(2)]);
    } else {
      table.push([id, prettyTimeStr(currAverageNs), "", ""]);
    }
  }

  return output === "cli" ? table.toString() : table.toHTML();
}

export function renderBenchmarkComparisonTable(benchComp: BenchmarkComparisonReport, output: "cli" | "html"): string {
  const keys = [...benchComp.results.keys()];
  const benchmarkSize = benchComp.commitsShas.length;

  const heads: (CellValue | CellOptions)[] = [{rowSpan: 2, content: "Benchmark suite"}, benchComp.dirNames[0]];
  const secondaryHead = ["Average Ns"];

  for (let s = 1; s < benchmarkSize; s++) {
    heads.push({colSpan: 2, content: benchComp.dirNames[s]});
    secondaryHead.push(...["Average Ns", "Ratio"]);
  }

  const table = new ExtendedTable({
    head: [],
  });
  table.push(heads);
  table.push(secondaryHead);

  for (const id of keys) {
    const row = [id];

    for (const [index, res] of (benchComp.results.get(id) ?? []).entries()) {
      if (index === 0) {
        row.push(prettyTimeStr(res.originAverageNs ?? 0));
      } else {
        row.push(prettyTimeStr(res.targetAverageNs ?? 0));
        row.push((res.ratio ?? 1).toFixed(2));
      }
    }

    table.push(row);
  }

  return output === "cli" ? table.toString() : table.toHTML();
}

function prettyTimeStr(nanoSec: number): string {
  const [value, unit] = prettyTime(nanoSec);
  return `${value.toPrecision(5)} ${unit}/op`;
}

function prettyTime(nanoSec: number): [number, string] {
  if (nanoSec > 1e9) return [nanoSec / 1e9, " s"];
  if (nanoSec > 1e6) return [nanoSec / 1e6, "ms"];
  if (nanoSec > 1e3) return [nanoSec / 1e3, "us"];
  return [nanoSec, "ns"];
}
