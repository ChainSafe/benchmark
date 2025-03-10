import {describe, expect, it} from "vitest";
import {fromCsv, toCsv} from "../../../src/utils/index.ts";

describe("utils / file - csv", () => {
  it("Convert to and from CSV", () => {
    const data = [
      {a: 1, b: "x"},
      {a: 3, b: "y"},
    ];

    const csv = toCsv(data);
    expect(csv).to.equal(`a,b
1,x
3,y
`);

    const dataRev = fromCsv(csv).data;
    expect(dataRev).toEqual(data);
  });

  it("Handle comma in value", () => {
    const data = [{id: "1,2,3"}];
    const csv = toCsv(data);
    expect(csv).toEqual(`id
"1,2,3"
`);
  });

  it("Parse CSV with embedded metadata", () => {
    const data = [
      {a: 1, b: "x"},
      {a: 3, b: "y"},
    ];
    const metadata = {
      commit: "4b235978fa5227dae61a6bed6d73461eeb550dac",
    };

    const csv = toCsv(data, metadata);
    expect(csv).toEqual(`#,commit,4b235978fa5227dae61a6bed6d73461eeb550dac
a,b
1,x
3,y
`);

    const dataRev = fromCsv(csv);
    expect(dataRev.data).toEqual(data);
    expect(dataRev.metadata).toEqual(metadata);
  });

  it("Parse CSV with only embedded metadata", () => {
    const data: unknown[] = [];
    const metadata = {
      commit: "4b235978fa5227dae61a6bed6d73461eeb550dac",
    };

    const csv = toCsv(data, metadata);
    expect(csv).toEqual(`#,commit,4b235978fa5227dae61a6bed6d73461eeb550dac
`);

    const dataRev = fromCsv(csv);
    expect(dataRev.data).toEqual(data);
    expect(dataRev.metadata).toEqual(metadata);
  });
});
