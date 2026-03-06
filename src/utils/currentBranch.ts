import * as github from "@actions/github";
import {isGaRun} from "../github/context.ts";
import {GithubActionsEventData, getGithubEventData, parseBranchFromRef} from "../utils/index.ts";
import {shell} from "./shell.ts";
import {detectVcs} from "./vcs.ts";

export async function getCurrentBranch(): Promise<string> {
  if (isGaRun()) {
    switch (github.context.eventName) {
      case "pull_request": {
        const eventData = getGithubEventData<GithubActionsEventData["pull_request"]>();
        return eventData.pull_request.head.ref; // base.ref is already parsed
      }

      case "push": {
        return parseBranchFromRef(github.context.ref);
      }
    }
  }

  if (detectVcs() === "jj") {
    const branchStr = await shell(
      'jj log --no-graph -r @ -T \'if(bookmarks, bookmarks.map(|b| b.name()).join(","), "")\''
    );
    const branch = branchStr.trim().split(",")[0];
    if (branch) return branch;
  }

  const refStr = github.context.ref || (await shell("git symbolic-ref HEAD"));
  return parseBranchFromRef(refStr);
}
