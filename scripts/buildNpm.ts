import {build, emptyDir} from "@deno/dnt";
import process from "node:process";
import fs from "node:fs";

import {getPackageJson} from "./utils.ts";
const packageJSON = await getPackageJson();
const currentDir = process.cwd();

const {name, version, description, author, license, bugs, homepage, repository, dependencies, exports} = packageJSON;

await emptyDir(`${currentDir}/npm`);

await build({
  outDir: `${currentDir}/npm`,
  entryPoints: [
    {name: ".", path: "./src/index.ts"},
    {name: "benchmark", path: "./bin/index.ts", kind: "bin"},
  ],
  shims: {
    // see JS docs for overview and more options
    deno: false,
  },
  test: false,
  skipSourceOutput: true,
  esModule: true,
  scriptModule: false,
  typeCheck: "both",
  package: {
    name,
    version,
    description,
    author,
    license,
    bugs,
    homepage,
    repository,
    dependencies,
  },
  filterDiagnostic(diagnostic) {
    if (diagnostic.messageText?.endsWith("Cannot find name 'WebAssembly'.")) {
      return false;
    }
    return true;
  },
  postBuild() {
    // steps to run after building and before running the tests
    fs.copyFileSync("LICENSE", "npm/LICENSE");
    fs.copyFileSync("README.md", "npm/README.md");
  },
});
