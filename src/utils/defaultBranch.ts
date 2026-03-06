import {isGaRun} from "../github/context.ts";
import {getGithubDefaultBranch} from "../github/octokit.ts";
import {StorageOptions} from "../types.ts";
import {shell} from "./shell.ts";
import {detectVcs} from "./vcs.ts";

let defaultBranch: string | null = null;

/**
 * Return a cached value of a best guess of the repo's default branch
 */
export async function getDefaultBranch(opts?: Pick<StorageOptions, "defaultBranch">): Promise<string> {
  if (opts?.defaultBranch) {
    return opts.defaultBranch;
  }

  if (defaultBranch === null) {
    defaultBranch = isGaRun() ? await getGithubDefaultBranch() : await guessLocalDefaultBranch();
  }

  return defaultBranch;
}

async function guessLocalDefaultBranch(): Promise<string> {
  if (detectVcs() === "jj") {
    const bookmarksRes = await shell(
      'jj log --no-graph -r \'heads(bookmarks())\' -T \'bookmarks.map(|b| b.name()).join("\\n") ++ "\\n"\''
    );
    const bookmarks = bookmarksRes.trim().split("\n");
    const bookmarkSet = new Set(bookmarks);

    for (const branch of ["main", "master"]) {
      if (bookmarkSet.has(branch)) return branch;
    }

    throw Error("Could not figure out local default branch. Use persistBranches option");
  }

  const branchesRes = await shell("git branch --all --format='%(refname:short)'");
  const branches = branchesRes.split("\n");
  const branchSet = new Set(branches);

  for (const branch of ["main", "master"]) {
    if (branchSet.has(branch) || branchSet.has(`origin/${branch}`)) return branch;
  }

  throw Error("Could not figure out local default branch. Use persistBranches option");
}
