import fs from "node:fs";
import path from "node:path";
import {glob} from "glob";
import {parse as csvParse} from "csv-parse/sync";
import {stringify as csvStringify} from "csv-stringify/sync";
import {FileCollectionOptions} from "../types.js";

type CsvMetadata = Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CsvData = any[];

export function readJson<T>(filepath: string): T {
  const jsonStr = fs.readFileSync(filepath, "utf8");

  let json: T;
  try {
    json = JSON.parse(jsonStr) as T;
  } catch (e) {
    throw Error(`Error parsing JSON ${filepath}: ${(e as Error).message}`);
  }

  // TODO: Validate schema

  return json;
}

export function writeJson<T>(filepath: string, json: T): void {
  const jsonStr = JSON.stringify(json, null, 2);
  fs.writeFileSync(filepath, jsonStr);
}

export function fromCsv<T extends CsvData>(str: string): {data: T; metadata: CsvMetadata} {
  const {csv, metadata} = splitCsvMetadata(str);
  return {
    data: csvParse(csv, {columns: true, cast: true}) as T,
    metadata,
  };
}

export function toCsv<T extends CsvData>(data: T, metadata?: CsvMetadata): string {
  // Support Embedded Metadata https://www.w3.org/TR/tabular-data-model/#embedded-metadata
  const csv = csvStringify(data, {header: true});
  if (metadata) {
    const metadataStr = toCsvMetadata(metadata);
    return `${metadataStr}\n${csv}`;
  } else {
    return csv;
  }
}

// CSV metadata

export function toCsvMetadata(metadata: Record<string, string>): string {
  return Object.entries(metadata)
    .map(([key, value]) => `#,${key},${value}`)
    .join("\n");
}

/**
 * Embedded Metadata https://www.w3.org/TR/tabular-data-model/#embedded-metadata
 */
function splitCsvMetadata(str: string): {csv: string; metadata: Record<string, string>} {
  const metadata: Record<string, string> = {};
  const rows = str.trim().split("\n");

  let i = 0;
  for (i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.startsWith("#")) {
      const [key, value] = row.slice(2).split(",");
      metadata[key] = value;
    } else {
      break;
    }
  }
  return {csv: rows.slice(i).join("\n"), metadata};
}

export async function collectFiles({spec, extension, ignore, recursive}: FileCollectionOptions): Promise<{
  files: string[];
  unmatchedFiles: string[];
}> {
  const matchedFiles = new Set<string>();
  const unmatchedFiles: string[] = [];

  // Normalize extensions to ensure leading dots
  const normalizedExtensions = extension.map((ext) => (ext.startsWith(".") ? ext : `.${ext}`));

  for (const pattern of spec) {
    const files = await glob(pattern, {
      ignore,
      nodir: true,
      cwd: process.cwd(),
      absolute: true,
      follow: recursive,
    });

    for (const file of files) {
      if (normalizedExtensions.includes(path.extname(file))) {
        matchedFiles.add(file);
      } else {
        unmatchedFiles.push(file);
      }
    }
  }

  return {
    files: Array.from(matchedFiles),
    unmatchedFiles,
  };
}

export function sortFiles(files: string[]): string[] {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });

  return files.sort(collator.compare);
}
