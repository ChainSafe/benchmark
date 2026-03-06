import fs from "node:fs";
import path from "node:path";

export type VcsType = "jj" | "git";

let cachedVcs: VcsType | null = null;

/**
 * Detect whether the current working directory is a jujutsu or git repo.
 * Jujutsu repos have a `.jj` directory; we prefer jj when both exist.
 */
export function detectVcs(cwd = process.cwd()): VcsType {
  if (cachedVcs !== null) return cachedVcs;

  let dir = cwd;
  while (true) {
    if (fs.existsSync(path.join(dir, ".jj"))) {
      cachedVcs = "jj";
      return cachedVcs;
    }
    if (fs.existsSync(path.join(dir, ".git"))) {
      cachedVcs = "git";
      return cachedVcs;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  cachedVcs = "git"; // fallback
  return cachedVcs;
}
