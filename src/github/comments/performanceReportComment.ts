import {PerformanceReport} from "../../types.js";
import {renderPerformanceTable} from "../../utils/render.js";

export function performanceReportComment(report: PerformanceReport): string {
  const isFailedResults = report.results.filter((r) => r.isFailed);
  const isImprovedResults = report.results.filter((r) => r.isImproved);

  if (report.someFailed) {
    return `
## :warning: **Performance Alert** :warning:

Possible performance regression was detected for some benchmarks.
Benchmark result of this commit is worse than the previous benchmark result exceeding threshold.

${renderPerformanceTable(isFailedResults, report, "html")}

<details><summary>Full benchmark results</summary>
${renderPerformanceTable(report.results, report, "html")}
</details>
`;
  }

  if (isImprovedResults.length > 0) {
    return `
## Performance Report

🚀🚀 Significant benchmark improvement detected

${renderPerformanceTable(isImprovedResults, report, "html")}

<details><summary>Full benchmark results</summary>
${renderPerformanceTable(report.results, report, "html")}
</details>
`;
  }

  return `
## Performance Report

✔️ no performance regression detected

<details><summary>Full benchmark results</summary>
${renderPerformanceTable(report.results, report, "html")}
</details>
`;
}
