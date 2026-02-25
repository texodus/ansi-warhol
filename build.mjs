import * as esbuild from "esbuild";

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

console.log("Build complete: dist/cli.cjs, dist/utf8-painter.esm.js");
