import {BenchmarkComparisonReport} from "../../types.js";
import {renderBenchmarkComparisonTable} from "../../utils/render.js";

export function benchmarkComparisonComment(report: BenchmarkComparisonReport): string {
  return `
## Comparison Report

${renderBenchmarkComparisonTable(report, "html")}
`;
}
