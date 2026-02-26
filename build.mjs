import * as esbuild from "esbuild";
import { copyFileSync, readFileSync, writeFileSync } from "fs";

await esbuild.build({
  entryPoints: ["src/cli.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: "dist/cli.cjs",
  external: ["canvas"],
  banner: {
    js: "#!/usr/bin/env node",
  },
});

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "browser",
  target: "es2020",
  format: "esm",
  outfile: "dist/utf8-painter.esm.js",
});

await esbuild.build({
  entryPoints: ["src/web/app.ts"],
  bundle: true,
  platform: "browser",
  target: "es2020",
  format: "esm",
  outfile: "dist/app.js",
});

copyFileSync("src/web/styles.css", "dist/styles.css");

// Generate index.html at project root, rewriting paths to dist/
const html = readFileSync("src/web/index.html", "utf-8")
  .replace('href="styles.css"', 'href="dist/styles.css"')
  .replace('src="app.js"', 'src="dist/app.js"');
writeFileSync("index.html", html);

console.log("Build complete: dist/cli.cjs, dist/utf8-painter.esm.js, dist/app.js, dist/styles.css, index.html");
