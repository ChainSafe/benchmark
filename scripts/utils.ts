import fs from "node:fs";
import process from "node:process";

interface PackageJSON {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage: string;
  repository: {
    type: string;
    url: string;
  };
  bugs: string;
  dependencies: Record<string, string>;
  exports: Record<string, string | Record<"import" | "default", "string">>;
}

export async function getPackageJson(dir?: string): Promise<PackageJSON> {
  const pkgFilePath = dir ? `${dir}/package.json` : `${process.cwd()}/package.json`;

  if (fs.existsSync(pkgFilePath)) return JSON.parse(fs.readFileSync(pkgFilePath, "utf8")) as PackageJSON;

  throw new Error("package.json file does not exists");
}
