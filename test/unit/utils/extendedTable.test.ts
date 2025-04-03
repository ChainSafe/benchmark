import {describe, expect, it} from "vitest";
import {ExtendedTable} from "../../../src/utils/extendedTable.ts";

describe("table", () => {
  describe("ExtendedTable", () => {
    it("should convert normal table to the right markdown", () => {
      const table = new ExtendedTable({head: ["Col1", "Col2"]});
      table.push(["Row 1 1", "Row 1 2"]);
      table.push(["Row 2 1", "Row 2 2"]);

      const html = `

      <table>
      <thead>
      <tr>
      <th>Col1</th>
      <th>Col2</th>
      </tr>
      </thead>
      <tbody>
      <tr>
      <td>Row 1 1</td>
      <td>Row 1 2</td>
      </tr>
      <tr>
      <td>Row 2 1</td>
      <td>Row 2 2</td>
      </tr>
      </tbody>
      </table>

      `;

      expect(table.toHTML().replace(/ /g, "")).toEqual(html.replace(/ /g, ""));
    });

    it("should convert table without head to the right markdown", () => {
      const table = new ExtendedTable({head: []});
      table.push(["Col1", "Col2"]);
      table.push(["Row 1 1", "Row 1 2"]);
      table.push(["Row 2 1", "Row 2 2"]);

      const html = `

      <table>
      <tbody>
      <tr>
      <td>Col1</td>
      <td>Col2</td>
      </tr>
      <tr>
      <td>Row 1 1</td>
      <td>Row 1 2</td>
      </tr>
      <tr>
      <td>Row 2 1</td>
      <td>Row 2 2</td>
      </tr>
      </tbody>
      </table>

      `;

      expect(table.toHTML().replace(/ /g, "")).toEqual(html.replace(/ /g, ""));
    });

    it("should convert table with colSpan to right markdown", () => {
      const table = new ExtendedTable({head: []});
      table.push([{colSpan: 2, content: "Col1"}, "Col2"]);
      table.push(["Row 1 1", "Row 1 2", "Row 1 3"]);
      table.push(["Row 2 1", "Row 2 2", "Row 2 3"]);

      const html = `

      <table>
      <tbody>
      <tr>
      <td colspan="2">Col1</td>
      <td>Col2</td>
      </tr>
      <tr>
      <td>Row 1 1</td>
      <td>Row 1 2</td>
      <td>Row 1 3</td>
      </tr>
      <tr>
      <td>Row 2 1</td>
      <td>Row 2 2</td>
      <td>Row 2 3</td>
      </tr>
      </tbody>
      </table>

      `;

      expect(table.toHTML().replace(/^\s+/gm, "")).toEqual(html.replace(/^\s+/gm, ""));
    });
  });
});
