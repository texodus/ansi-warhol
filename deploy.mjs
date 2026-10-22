//   ▁__▂▂▃◽▵▁▁▁▁▵▁◡◡◡◡▂__▁
//  ▗▇◙▃◄F⊂⊟≣≣▁▂▂▂▂▁⊟g◥▬⊇g▂▋  ▐██████ ▐██████ ▐██████ ▐██
//  ▐▆▅◘◘◒▇▇▆▆▆▆▆▆▆▆▆▇▇▄▅▅▆▌  ▐██ ▐██ ▐██ ▐██ ▐██     ▐██
//  ▐▋▘▅▃▟█████████▛▀▐█▛7▃▟▌  ▐██████ ▐██ ▐██ ▐██████ ▐██
//  ▐▌▟D▜7▐▀▛╏▜▀7▜▀▖▐▀▞yy▍█▌  ▐██ ▐██ ▐██ ▐██     ▐██ ▐██
//  ▐▇▆▙▅▄▙▟▟▃▚▟▄▙▃▅▃▄▄▄▅▆▇▌  ▐██ ▐██ ▐██ ▐██ ▐██████ ▐██
//  ▐████⋡◘◘◘▙■▛▜◘◘▜◘▛▜████▌
//  ▐████▇▆▆▆▆▲◼■▲▅▅▆▆▇████▌  ▐██  ▐██ ▐██████ ▐██████ ▐██ ▐██ ▐██████ ▐██
//  ▝▀◘▜████▛┇▅▚▟≽▝▜████▛◘▀▌  ▐██  ▐██ ▐██ ▐██ ▐██ ▐██ ▐██ ▐██ ▐██ ▐██ ▐██
//  │   ▔▔▔""1≦▅⋡▩√▝""▔▔   r  ▐██  ▐██ ▐██████ ▐██████ ▐██████ ▐██ ▐██ ▐██
//  │        ▔^◠"▔         r  ▐██▐█▐██ ▐██ ▐██ ▐██▐██  ▐██ ▐██ ▐██ ▐██ ▐██
//  │  ▗▄▂▃▁_▁▁▁ ▁▁_▂▂▃▃▎  ▍   ▐█████  ▐██ ▐██ ▐██ ▐██ ▐██ ▐██ ▐██████ ▐█████
//  │  d▍▐▂▋▐▀▟▜▁▞▐▎▐▎▚▟▎  ▍
//  │     ▔ ▔▔▔▔▔▔▔▔▔      ▍  Copyright (c) 2026, the `ansi-warhol` authors.
//  ╽▁   ◀▆▴▗▄▃▂▄▖▄▗▄▅▎   ▁▍  This project is distributed under the terms of the
//  ╰⋟▄▃▂▝◓▀▝◆▞▘╚L┛◂▀▔◡▁▂▃0╯  [MIT License](https://opensource.org/license/mit).
//    ▔^◝∼╼≘⊂⊐◻◻◻◻◻⊏⊐≘┴▘^▔

// Build the web app and commit it to the root of the gh-pages branch, for
// GitHub Pages. The branch is checked out in a temporary worktree, so the
// current checkout is left alone. Pass --push to push the branch to origin.

import { execFileSync } from "child_process";
import { cpSync, existsSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const BRANCH = "gh-pages";
const ASSETS = ["index.html", "app.js", "styles.css"];
const push = process.argv.includes("--push");

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function hasRef(ref) {
  try {
    git(["rev-parse", "--verify", "--quiet", ref]);
    return true;
  } catch {
    return false;
  }
}

execFileSync("node", ["build.mjs"], { stdio: "inherit" });
for (const asset of ASSETS) {
  if (!existsSync(join("dist", asset))) {
    throw new Error(`Build did not produce dist/${asset}`);
  }
}

const source = git(["rev-parse", "--short", "HEAD"]);
const dirty = git(["status", "--porcelain"]) !== "";
const dir = mkdtempSync(join(tmpdir(), "ansi-warhol-deploy-"));

try {
  if (hasRef(`refs/heads/${BRANCH}`)) {
    git(["worktree", "add", "--quiet", dir, BRANCH]);
  } else if (hasRef(`refs/remotes/origin/${BRANCH}`)) {
    git(["worktree", "add", "--quiet", "-b", BRANCH, dir, `origin/${BRANCH}`]);
  } else {
    git(["worktree", "add", "--quiet", "--detach", dir]);
    git(["checkout", "--quiet", "--orphan", BRANCH], dir);
  }

  // Replace the branch's contents with the fresh build
  git(["rm", "-r", "-f", "--quiet", "--ignore-unmatch", "."], dir);
  for (const asset of ASSETS) cpSync(join("dist", asset), join(dir, asset));
  writeFileSync(join(dir, ".nojekyll"), "");
  git(["add", "--all"], dir);

  if (git(["status", "--porcelain"], dir) === "") {
    console.log(`${BRANCH} is already up to date with ${source}.`);
  } else {
    const note = dirty ? " (with uncommitted changes)" : "";
    git(["commit", "--quiet", "-m", `Deploy ${source}${note}`], dir);
    console.log(`Committed ${git(["log", "--oneline", "-1"], dir)} to ${BRANCH}.`);
  }

  if (push) {
    execFileSync("git", ["push", "origin", BRANCH], { cwd: dir, stdio: "inherit" });
  } else {
    console.log(`Not pushed; run \`git push origin ${BRANCH}\` or \`npm run deploy -- --push\`.`);
  }
} finally {
  git(["worktree", "remove", "--force", dir]);
}
