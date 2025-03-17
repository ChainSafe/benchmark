import * as github from "@actions/github";
import {Benchmark, StorageOptions} from "../types.js";
import {getGithubEventData, GithubActionsEventData, parseBranchFromRef, getDefaultBranch} from "../utils/index.js";
import {isGaRun} from "../github/context.js";
import {IHistoryProvider} from "../history/provider.js";
import {validateBenchmark} from "../history/schema.js";

const CompareWith = {
  latestCommitInBranch: "latestCommitInBranch",
  exactCommit: "exactCommit",
} as const;

export type CompareWithType =
  | {type: typeof CompareWith.latestCommitInBranch; branch: string; before?: string}
  | {type: typeof CompareWith.exactCommit; commitSha: string};

export async function resolveCompare(provider: IHistoryProvider, opts: StorageOptions): Promise<Benchmark | null> {
  const compareWith = await resolveCompareWith(opts);
  const prevBench = await resolvePrevBenchmark(compareWith, provider);
  if (!prevBench) return null;

  validateBenchmark(prevBench);

  return prevBench;
}

export async function resolvePrevBenchmark(
  compareWith: CompareWithType,
  provider: IHistoryProvider
): Promise<Benchmark | null> {
  switch (compareWith.type) {
    case CompareWith.exactCommit:
      return await provider.readHistoryCommit(compareWith.commitSha);

    case CompareWith.latestCommitInBranch: {
      // Try first latest commit in branch
      return await provider.readLatestInBranch(compareWith.branch);
    }
  }
}

export function renderCompareWith(compareWith: CompareWithType): string {
  switch (compareWith.type) {
    case CompareWith.exactCommit:
      return `exactCommit ${compareWith.commitSha}`;

    case CompareWith.latestCommitInBranch: {
      if (compareWith.before) {
        return `latestCommitInBranch '${compareWith.branch}' before commit ${compareWith.before}`;
      } else {
        return `latestCommitInBranch '${compareWith.branch}'`;
      }
    }
  }
}

export async function resolveCompareWith(opts: StorageOptions): Promise<CompareWithType> {
  // compare may be a branch or commit
  if (opts.compareBranch) {
    return {type: CompareWith.latestCommitInBranch, branch: opts.compareBranch};
  }

  if (opts.compareCommit) {
    return {type: CompareWith.exactCommit, commitSha: opts.compareCommit};
  }

  // In GA CI figure out what to compare against with github actions events
  if (isGaRun()) {
    switch (github.context.eventName) {
      case "pull_request": {
        const eventData = getGithubEventData<GithubActionsEventData["pull_request"]>();
        const baseBranch = eventData.pull_request.base.ref; // base.ref is already parsed
        return {type: CompareWith.latestCommitInBranch, branch: baseBranch};
      }

      case "push": {
        const eventData = getGithubEventData<GithubActionsEventData["push"]>();
        const branch = parseBranchFromRef(github.context.ref);
        return {type: CompareWith.latestCommitInBranch, branch: branch, before: eventData.before};
      }

      default:
        throw Error(`event not supported ${github.context.eventName}`);
    }
  }

  // Otherwise compare against the default branch
  const defaultBranch = await getDefaultBranch(opts);
  return {type: CompareWith.latestCommitInBranch, branch: defaultBranch};
}
