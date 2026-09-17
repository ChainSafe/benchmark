import {execFile, spawn} from "node:child_process";
import {mkdtemp, readFile, readdir, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {expect, it} from "vitest";

const exec = promisify(execFile);
const root = process.cwd();
const api = new URL(`file://${root}/lib/index.js`).href;

function cliArgs(dir: string, files: string[]): string[] {
  return [
    "bin/index.js",
    ...files,
    "--isolate",
    "--historyLocal",
    path.join(dir, "history"),
    "--defaultBranch",
    "main",
    "--compareBranch",
    "main",
    "--persist",
    "--skipPostComment",
    "--maxRuns",
    "1",
    "--minRuns",
    "1",
    "--maxWarmUpRuns",
    "0",
  ];
}

it("rejects duplicate IDs across files before persisting, even with noThrow", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "benchmark-duplicate-"));
  try {
    const files = [path.join(dir, "a.mjs"), path.join(dir, "b.mjs")];
    for (const file of files)
      await writeFile(file, `import {bench} from ${JSON.stringify(api)}; bench('duplicate', () => {});`);
    await expect(exec("node", [...cliArgs(dir, files), "--noThrow"], {cwd: root})).rejects.toThrow(
      "Duplicate benchmark ID"
    );
    await expect(readdir(path.join(dir, "history"))).rejects.toMatchObject({code: "ENOENT"});
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});

it.each([
  ["collection", "throw Error('collection failed')", "exited with 1"],
  [
    "execution",
    `import {bench} from ${JSON.stringify(api)}; bench('broken', () => {throw Error('broken')});`,
    "exited with 1",
  ],
  ["early exit", "process.exit(0)", "without results"],
  ["crash", "process.exit(7)", "exited with 7"],
  ["signal", "process.kill(process.pid, 'SIGTERM')", "SIGTERM"],
])("does not persist partial results after %s failure", async (_name, source, error) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "benchmark-failure-"));
  try {
    const good = path.join(dir, "good.mjs");
    const bad = path.join(dir, "bad.mjs");
    await writeFile(good, `import {bench} from ${JSON.stringify(api)}; bench('good', () => {});`);
    await writeFile(bad, source);
    await expect(exec("node", [...cliArgs(dir, [good, bad]), "--noThrow"], {cwd: root})).rejects.toThrow(error);
    await expect(readdir(path.join(dir, "history"))).rejects.toMatchObject({code: "ENOENT"});
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});

it("never persists an interrupted run even if the worker handles the signal and succeeds", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "benchmark-interrupt-"));
  try {
    const file = path.join(dir, "wait.mjs");
    await writeFile(
      file,
      `import {bench} from ${JSON.stringify(api)};
      bench('wait', async () => {
        await new Promise(resolve => {
          process.once('SIGTERM', resolve);
          console.log('WORKER_READY');
        });
      });`
    );
    const child = spawn("node", cliArgs(dir, [file]), {cwd: root, stdio: ["ignore", "pipe", "pipe"]});
    const code = await new Promise<number | null>((resolve, reject) => {
      child.on("error", reject);
      child.on("close", resolve);
      child.stdout.on("data", (chunk) => {
        if (chunk.toString().includes("WORKER_READY")) child.kill("SIGTERM");
      });
      child.stderr.resume();
    });
    expect(code).not.toBe(0);
    await expect(readdir(path.join(dir, "history"))).rejects.toMatchObject({code: "ENOENT"});
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});

it.each([false, true])(
  "handles skipped files without inventing results (include passing file: %s)",
  async (includePassing) => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "benchmark-skipped-"));
    try {
      const skipped = path.join(dir, "skipped.mjs");
      const passing = path.join(dir, "passing.mjs");
      await writeFile(skipped, `import {bench} from ${JSON.stringify(api)}; bench.skip('skipped', () => {});`);
      await writeFile(passing, `import {bench} from ${JSON.stringify(api)}; bench('passing', () => {});`);
      const result = exec("node", cliArgs(dir, includePassing ? [skipped, passing] : [skipped]), {cwd: root});
      if (includePassing) {
        await result;
        const history = path.join(dir, "history", "history");
        const [snapshot] = await readdir(history);
        const csv = await readFile(path.join(history, snapshot), "utf8");
        expect(csv).toContain("passing,");
        expect(csv).not.toContain("skipped,");
      } else {
        await expect(result).rejects.toThrow("No benchmark result was produced");
        await expect(readdir(path.join(dir, "history"))).rejects.toMatchObject({code: "ENOENT"});
      }
    } finally {
      await rm(dir, {recursive: true, force: true});
    }
  }
);

it("keeps the default shared-process behavior", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "benchmark-shared-"));
  try {
    const files = [path.join(dir, "a.mjs"), path.join(dir, "b.mjs")];
    await writeFile(
      files[0],
      `import {bench} from ${JSON.stringify(api)}; globalThis.fromFirst = true; bench('first', () => {});`
    );
    await writeFile(
      files[1],
      `import {bench} from ${JSON.stringify(api)}; if (!globalThis.fromFirst) throw Error('not shared'); bench('second', () => {});`
    );
    await exec(
      "node",
      cliArgs(dir, files).filter((arg) => arg !== "--isolate"),
      {cwd: root}
    );
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});

it("runs files sequentially in fresh processes, inheriting setup, flags and environment", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "benchmark-isolation-"));
  try {
    const log = path.join(dir, "order.jsonl");
    await writeFile(path.join(dir, "setup.mjs"), "globalThis.setupLoaded = true;");
    const files = [];
    for (const id of ["first", "second"]) {
      const file = path.join(dir, `${id}.mjs`);
      files.push(file);
      await writeFile(
        file,
        `
        import {bench} from ${JSON.stringify(api)};
        import {appendFileSync, existsSync} from 'node:fs';
        import {store} from ${JSON.stringify(new URL(`file://${root}/lib/benchmark/globalState.js`).href)};
        if (store.getGlobalOptions().threshold !== Infinity) throw Error('lost Infinity in IPC');
        if ('${id}' === 'second' && !existsSync(${JSON.stringify(log)})) throw Error('overlapping workers');
        if (globalThis.leaked || !globalThis.setupLoaded || !global.gc || process.env.ISOLATION_TEST !== 'yes') throw Error('not isolated');
        globalThis.leaked = true;
        process.on('exit', () => appendFileSync(${JSON.stringify(log)}, JSON.stringify({id: '${id}', pid: process.pid}) + '\\n'));
        bench('${id}', () => {});
      `
      );
    }
    await exec(
      "node",
      ["--expose-gc", ...cliArgs(dir, files), "--threshold", "Infinity", "--setupFiles", path.join(dir, "setup.mjs")],
      {
        cwd: root,
        env: {...process.env, ISOLATION_TEST: "yes"},
      }
    );
    const events = (await readFile(log, "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(events.map((event) => event.id)).toEqual(["first", "second"]);
    expect(new Set(events.map((event) => event.pid)).size).toBe(2);
    const history = path.join(dir, "history", "history");
    const snapshots = await readdir(history);
    expect(snapshots).toHaveLength(1);
    const csv = await readFile(path.join(history, snapshots[0]), "utf8");
    expect(csv).toContain("first,");
    expect(csv).toContain("second,");
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});
