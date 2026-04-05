import {shell} from "./shell.ts";
import {detectVcs} from "./vcs.ts";

/**
 * Get the current HEAD ref string (e.g. "refs/heads/main").
 */
export async function getHeadRef(): Promise<string> {
  if (detectVcs() === "jj") {
    // jj bookmarks map to git branches; return as refs/heads/<name>
    const branchStr = await shell(
      'jj log --no-graph -r @ -T \'if(bookmarks, bookmarks.map(|b| b.name()).join(","), "")\''
    );
    const branch = branchStr.trim().split(",")[0];
    if (branch) return `refs/heads/${branch}`;
    // Fallback: return the commit id as a detached ref
    const commitId = await shell('jj log --no-graph -r @ -T \'commit_id\'');
    return commitId.trim();
  }
  return shell("git symbolic-ref HEAD");
}

export async function getCurrentCommitInfo(): Promise<{
  /** commit hash `71f08b12d45d44255c31f7b7d135bd15a93fdaac` */
  commitSha: string;
  /** committer date, UNIX timestamp in seconds */
  timestamp: number;
  /** Branch name for current repo checkout */
  branch?: string;
}> {
  if (detectVcs() === "jj") {
    const commitSha = await shell('jj log --no-graph -r @ -T \'commit_id ++ "\\n"\'');
    const timestampStr = await shell('jj log --no-graph -r @ -T \'committer.timestamp().utc().format("%s") ++ "\\n"\'');
    const branchStr = await shell(
      'jj log --no-graph -r @ -T \'if(bookmarks, bookmarks.map(|b| b.name()).join(","), "")\''
    );
    const timestamp = parseInt(timestampStr, 10);

    if (!timestamp || Number.isNaN(timestamp)) {
      throw Error(`Invalid timestampStr ${timestampStr}`);
    }

    return {
      commitSha: commitSha.trim(),
      timestamp,
      branch: branchStr.trim() === "" ? undefined : branchStr.trim().split(",")[0],
    };
  }

  const commitSha = await shell("git show -s --format=%H");
  const timestampStr = await shell("git show -s --format=%ct");
  const branchStr = await shell("git branch --show-current");
  const timestamp = parseInt(timestampStr, 10);

  if (!timestamp || Number.isNaN(timestamp)) {
    throw Error(`Invalid timestampStr ${timestampStr}`);
  }

  return {
    commitSha,
    timestamp,
    branch: branchStr === "" ? undefined : branchStr,
  };
}

/**
 * Returns a chronological list of commits from `$branch`.
 *
 * - `--format=format:%H`: Print the full commit hash only
 * - `-n`: Display up to n commits
 * - `--no-pager` suppress interactive mode
 *
 * (from git-log docs):
 * List commits that are reachable by following the parent links from the given commit(s),
 * but exclude commits that are reachable from the one(s) given with a ^ in front of them.
 * The output is given in reverse chronological order by default.
 */
export async function getBranchCommitList(branch: string, n = 50): Promise<string[]> {
  if (detectVcs() === "jj") {
    await ensureBranchExists(branch);
    const commitsStr = await shell(
      `jj log --no-graph -r 'ancestors(${branch}, ${n})' -T 'commit_id ++ "\\n"'`
    );
    return commitsStr.trim().split("\n");
  }

  await ensureBranchExists(branch);
  const commitsStr = await shell(`git --no-pager log --format=format:%H -n ${n} ${branch}`);
  return commitsStr.trim().split("\n");
}

/**
 * Resolve a heads ref
 */
export async function getBranchLatestCommit(branch: string): Promise<string> {
  if (detectVcs() === "jj") {
    await ensureBranchExists(branch);
    const res = await shell(`jj log --no-graph -r '${branch}' -T 'commit_id'`);
    return res.trim();
  }

  await ensureBranchExists(branch);
  const res = await shell(`git rev-parse refs/heads/${branch}`);
  return res.trim();
}

/**
 * Ensure branch exists locally or try to fetch it from origin.
 * When using actions/checkout users normally only clone a single commit.
 * Getting the entire git history for all branches is a bit more tricky than this.
 */
async function ensureBranchExists(branch: string): Promise<void> {
  if (detectVcs() === "jj") {
    // In jj, check if the bookmark exists
    const exists = await shell(`jj log --no-graph -r '${branch}' -T 'commit_id'`).then(
      () => true,
      () => false
    );

    if (!exists) {
      await shell(`jj git fetch --remote origin --branch ${branch}`);
    }
    return;
  }

  const refExists = await shell(`git show-ref --verify --quiet refs/heads/${branch}`).then(
    () => true,
    () => false
  );

  if (!refExists) {
    await shell(`git fetch origin ${branch}`);
  }
}
