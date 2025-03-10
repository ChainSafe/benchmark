import process from "node:process";
import fs from "node:fs";
import {getPackageJson} from "./utils.ts";

const {name, version} = await getPackageJson();

fs.writeFileSync(
  `${process.cwd()}/deno.json`,
  JSON.stringify({
    name,
    version,
    exports: {".": "./src/index.ts"},
    publish: {
      include: ["LICENSE", "README.md", "src/**/*.ts", "bin/**/*.ts", "deno.json"],
    },
  })
);
