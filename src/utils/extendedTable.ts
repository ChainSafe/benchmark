import CliTable3, {TableConstructorOptions, Cell, CellOptions} from "cli-table3";
export type {CellValue, CellOptions} from "cli-table3";

export class ExtendedTable extends CliTable3 {
  constructor(options?: TableConstructorOptions) {
    super(options);
  }

  /**
   * Render the table as HTML
   */
  toHTML(): string {
    let html = "\n<table>\n";

    if (this.options.head && this.options.head.length > 0) {
      html += "<thead>\n<tr>\n";
      for (const cell of this.options.head) {
        if (typeof cell === "object" && cell !== null) {
          const {content, colSpan, rowSpan} = cell as CellOptions;
          const colSpanAttr = colSpan ? ` colspan="${colSpan}"` : "";
          const rowSpanAttr = rowSpan ? ` rowspan="${rowSpan}"` : "";
          html += `    <th${colSpanAttr}${rowSpanAttr}>${content}</th>\n`;
        } else {
          html += `    <th>${cell}</th>\n`;
        }
      }
      html += "</tr>\n</thead>\n";
    }

    html += "<tbody>\n";
    for (const row of this) {
      html += "  <tr>\n";
      for (const cell of row as Cell[]) {
        if (typeof cell === "object" && cell !== null) {
          const {content, colSpan, rowSpan} = cell as CellOptions;
          const colSpanAttr = colSpan ? ` colspan="${colSpan}"` : "";
          const rowSpanAttr = rowSpan ? ` rowspan="${rowSpan}"` : "";
          html += `    <td${colSpanAttr}${rowSpanAttr}>${content}</td>\n`;
        } else {
          html += `    <td>${cell}</td>\n`;
        }
      }
      html += "  </tr>\n";
    }
    html += "</tbody>\n";
    html += "</table>";
    return html;
  }
}
