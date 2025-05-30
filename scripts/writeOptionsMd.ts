import {fileCollectionOptions, storageOptions, benchmarkOptions} from "../src/cli/options.ts";

const sections: string[] = [];

for (const [cmd, data] of Object.entries({...fileCollectionOptions, ...storageOptions, ...benchmarkOptions})) {
  const cmds = [cmd, ...(data.alias || [])];
  sections.push(`### ${cmds.map((c) => `\`--${c}\``).join(", ")}
  
${data.description || ""}

- type: ${data.type || "string"}
- default: ${data.default || data.defaultDescription || ""}
`);
}

console.log(sections.join("\n"));
