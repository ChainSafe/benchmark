import {BenchmarkComparisonReport} from "../../types.ts";
import {renderBenchmarkComparisonTable} from "../../utils/render.ts";

export function benchmarkComparisonComment(report: BenchmarkComparisonReport): string {
  return `
## Benchmark Comparison Report

${renderBenchmarkComparisonTable(report, "html")}
`;
}
