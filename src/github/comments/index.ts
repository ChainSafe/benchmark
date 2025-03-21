import * as github from "@actions/github";
import {getGithubEventData, GithubActionsEventData} from "../../utils/index.js";
import {commentToCommit, commentToPrUpdatable, GithubCommentTag} from "../octokit.js";

export async function postGaComment({
  commentBody,
  tag,
  commentOnPush,
}: {
  commentBody: string;
  tag: GithubCommentTag;
  commentOnPush: boolean;
}): Promise<void> {
  switch (github.context.eventName) {
    case "pull_request": {
      const eventData = getGithubEventData<GithubActionsEventData["pull_request"]>();
      const prNumber = eventData.number;
      if (!prNumber) {
        throw Error("github event data has no PR number");
      }

      await commentToPrUpdatable(prNumber, commentBody, tag);

      break;
    }

    case "push": {
      // Only comment on performance regression
      if (commentOnPush) {
        await commentToCommit(github.context.sha, commentBody);
      }

      break;
    }

    default:
      throw Error(`event not supported ${github.context.eventName}`);
  }
}
