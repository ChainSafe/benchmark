import CliTable, {Table, CellValue, CellOptions} from "cli-table3";
import {BenchmarkCrossComparison, BenchmarkSelfComparison, ResultSelfComparison} from "../types.js";

type CommitsSha = Pick<BenchmarkSelfComparison, "currCommitSha" | "prevCommitSha">;

export function renderComment(benchComp: BenchmarkSelfComparison): string {
  const isFailedResults = benchComp.results.filter((r) => r.isFailed);
  const isImprovedResults = benchComp.results.filter((r) => r.isImproved);

  let body = benchComp.someFailed
    ? // If there was any bad benchmark print a table only with the bad results
      `## :warning: **Performance Alert** :warning:

Possible performance regression was detected for some benchmarks.
Benchmark result of this commit is worse than the previous benchmark result exceeding threshold.
  
${renderBenchmarkTable(isFailedResults, benchComp)}
`
    : // Otherwise, just add a title
      `## Performance Report

✔️ no performance regression detected      

`;

  if (isImprovedResults.length > 0) {
    body += `
  
🚀🚀 Significant benchmark improvement detected

${renderBenchmarkTable(isImprovedResults, benchComp)}
`;
  }

  // For all cases attach the full benchmarks
  return `${body}

<details><summary>Full benchmark results</summary>

${renderBenchmarkTable(benchComp.results, benchComp)}

</details>
`;
}

function renderBenchmarkTable(benchComp: ResultSelfComparison[], {currCommitSha, prevCommitSha}: CommitsSha): string {
  function toRow(arr: (number | string)[]): string {
    // Don't surround string items with \`, it doesn't look great rendered in Github comments
    const row = arr.map((e) => `${e}`).join(" | ");
    return `| ${row} |`;
  }

  const rows = benchComp.map((result) => {
    const {id, prevAverageNs, currAverageNs, ratio} = result;

    if (prevAverageNs != undefined && ratio != undefined) {
      return toRow([id, prettyTimeStr(currAverageNs), prettyTimeStr(prevAverageNs), ratio.toFixed(2)]);
    } else {
      return toRow([id, prettyTimeStr(currAverageNs)]);
    }
  });

  return `| Benchmark suite | Current: ${currCommitSha} | Previous: ${prevCommitSha ?? "-"} | Ratio |
|-|-|-|-|
${rows.join("\n")}
`;
}

export function toMarkdownTable(table: Table): string {
  const chars = {
    middle: "|",

    mid: " ",
    "mid-mid": "",

    right: "|",
    "right-mid": " ",

    top: "",
    "top-left": "",
    "top-right": "",
    "top-mid": "",

    left: "|",
    "left-mid": " ",

    bottom: "-",
    "bottom-left": "|",
    "bottom-right": "|",
    "bottom-mid": "-",
  };
  table.options.chars = chars;

  return table.toString();
}

export function renderBenchmarkComparisonTable(benchComp: BenchmarkCrossComparison): string {
  const keys = [...benchComp.results.keys()];
  const benchmarkSize = benchComp.commitsShas.length;

  const heads: (CellValue | CellOptions)[] = [{rowSpan: 2, content: "Benchmark suite"}, benchComp.dirNames[0]];
  const secondaryHead = ["Average Ns"];

  for (let s = 1; s < benchmarkSize; s++) {
    heads.push({colSpan: 2, content: benchComp.dirNames[s]});
    secondaryHead.push(...["Average Ns", "Ratio"]);
  }

  const table = new CliTable({
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

  return table.toString();
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
