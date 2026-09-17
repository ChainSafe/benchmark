import {mkdtemp, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {expect, it, vi} from "vitest";
import {run} from "../../../lib/cli/run.js";

it("does not construct a shared-process runner in isolated mode", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "benchmark-run-"));
  const resolve = vi.spyOn(path, "resolve");
  try {
    const file = path.join(dir, "bench.mjs");
    const setup = path.join(dir, "setup.mjs");
    const api = new URL("../../../lib/index.js", import.meta.url).href;
    await writeFile(setup, "");
    await writeFile(file, `import {bench} from ${JSON.stringify(api)}; bench.skip('skipped', () => {});`);
    await expect(
      run({
        spec: [file],
        extension: ["mjs"],
        ignore: [],
        recursive: false,
        isolate: true,
        setupFiles: [setup],
        historyLocal: path.join(dir, "history"),
        defaultBranch: "main",
        compareBranch: "main",
        skipPostComment: true,
        persist: false,
      })
    ).rejects.toThrow("No benchmark result was produced");
    // The real runner resolves setup paths in its constructor. Only the child
    // should do that; this spy observes calls in the parent process alone.
    expect(resolve).not.toHaveBeenCalledWith(setup);
  } finally {
    resolve.mockRestore();
    await rm(dir, {recursive: true, force: true});
  }
});
