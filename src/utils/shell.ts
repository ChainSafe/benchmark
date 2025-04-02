import child from "node:child_process";
import util from "node:util";

const exec = util.promisify(child.exec);

export async function shell(cmd: string): Promise<string> {
  const {stdout} = await exec(cmd);
  return (stdout || "").trim();
}
