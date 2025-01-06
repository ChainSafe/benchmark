import * as github from "@actions/github";
import {BenchmarkCrossComparison, BenchmarkSelfComparison} from "../types.js";
import {commentToCommit, commentToPrUpdatable} from "./octokit.js";
import {
  getGithubEventData,
  GithubActionsEventData,
  renderBenchmarkComparisonTable,
  renderComment,
} from "../utils/index.js";

export async function postGaCommentSelfComparison(resultsComp: BenchmarkSelfComparison): Promise<void> {
  switch (github.context.eventName) {
    case "pull_request": {
      const eventData = getGithubEventData<GithubActionsEventData["pull_request"]>();
      const prNumber = eventData.number;
      if (!prNumber) {
        throw Error("github event data has no PR number");
      }

      // Build a comment to publish to a PR
      const commentBody = renderComment(resultsComp);
      await commentToPrUpdatable(prNumber, commentBody);

      break;
    }

    case "push": {
      // Only comment on performance regression
      if (resultsComp.someFailed) {
        const commentBody = renderComment(resultsComp);
        await commentToCommit(github.context.sha, commentBody);
      }

      break;
    }

    default:
      throw Error(`event not supported ${github.context.eventName}`);
  }
}

export async function postGaCommentCrossComparison(resultsComp: BenchmarkCrossComparison): Promise<void> {
  switch (github.context.eventName) {
    case "pull_request": {
      const eventData = getGithubEventData<GithubActionsEventData["pull_request"]>();
      const prNumber = eventData.number;
      if (!prNumber) {
        throw Error("github event data has no PR number");
      }

      const commentBody = `
      \`\`\`
      ${renderBenchmarkComparisonTable(resultsComp)}
      \`\`\`
      `;
      await commentToPrUpdatable(prNumber, commentBody);

      break;
    }

    case "push": {
      const commentBody = `
      \`\`\`
      ${renderBenchmarkComparisonTable(resultsComp)}
      \`\`\`
      `;
      await commentToCommit(github.context.sha, commentBody);

      break;
    }

    default:
      throw Error(`event not supported ${github.context.eventName}`);
  }
}
