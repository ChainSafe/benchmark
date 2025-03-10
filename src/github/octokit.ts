import {EnumLike} from "../types.js";
import {getContext} from "./context.js";

export const githubCommentTag = {
  PerformanceReport: "benchmarkbot/action",
  ComparisonReport: "benchmarkbot/compare",
} as const;
export type GithubCommentTag = EnumLike<typeof githubCommentTag>;

export async function commentToPrUpdatable(prNumber: number, body: string, tag: GithubCommentTag): Promise<void> {
  const {repo, octokit} = getContext();

  // Append tag so the comment is findable latter
  const bodyWithTag = `${body}\n\n\n> by ${tag}`;

  const comments = await octokit.rest.issues.listComments({
    ...repo,
    issue_number: prNumber,
  });
  const prevComment = comments.data.find((c) => c.body && c.body.includes(tag));

  if (prevComment) {
    // Update
    await octokit.rest.issues.updateComment({
      ...repo,
      issue_number: prNumber,
      comment_id: prevComment.id,
      body: bodyWithTag,
    });
  } else {
    // Create
    await octokit.rest.issues.createComment({
      ...repo,
      issue_number: prNumber,
      body: bodyWithTag,
    });
  }
}

export async function commentToCommit(commitSha: string, body: string): Promise<void> {
  const {repo, octokit} = getContext();

  await octokit.rest.repos.createCommitComment({
    ...repo,
    commit_sha: commitSha,
    body,
  });
}

export async function getGithubDefaultBranch(): Promise<string> {
  const {repo, octokit} = getContext();

  const thisRepo = await octokit.rest.repos.get({
    ...repo,
  });
  return thisRepo.data.default_branch;
}
