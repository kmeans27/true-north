/* ------------------------------------------------------------------
   Publish the built site to the gh-pages branch.

   GitHub Pages can serve a branch with no CI at all, which is useful
   when Actions minutes are not available. Run via `npm run deploy`.

   It writes a throwaway git repo from dist/ and force-pushes it as
   gh-pages; the source branch is never touched.
   ------------------------------------------------------------------ */

import { execSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit" });

const remote = execSync("git remote get-url origin", { cwd: root, encoding: "utf8" }).trim();
const sha = execSync("git rev-parse --short HEAD", { cwd: root, encoding: "utf8" }).trim();
const name = execSync("git log -1 --format=%an", { cwd: root, encoding: "utf8" }).trim();
const email = execSync("git log -1 --format=%ae", { cwd: root, encoding: "utf8" }).trim();

const work = mkdtempSync(join("/tmp/opencode", "tn-deploy-"));
try {
  cpSync(join(root, "dist"), work, { recursive: true });
  writeFileSync(join(work, ".nojekyll"), "");
  run("git init -q -b gh-pages", work);
  run("git add -A", work);
  execSync(`git -c user.name=${JSON.stringify(name)} -c user.email=${JSON.stringify(email)} commit -q -m ${JSON.stringify(`deploy ${sha}`)}`, {
    cwd: work,
    stdio: "inherit",
  });
  run(`git push -f ${JSON.stringify(remote)} gh-pages`, work);
  console.log(`\npublished ${sha} to gh-pages`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
