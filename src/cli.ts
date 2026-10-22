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

import * as fs from "fs";
import { PNG } from "pngjs";
import { estimateAscii } from "./ascii";
import { gridFromText, gridToAnsi } from "./chargrid";
import { DISTANCE_FNS } from "./distance";
import { EVALUTATE_FNS } from "./evaluate";
import { nodeCanvasFactory } from "./node-canvas-factory";

declare const __VERSION__: string;

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
	console.log("Usage: ansi-warhol [options] <image.png>");
	console.log();
	console.log("Renders a PNG image as Unicode text art to out.txt");
	console.log("(or out.ans with ANSI 24-bit colour, using --color)");
	console.log();
	console.log("Options:");
	console.log(
		"  --width <n>       Output width in characters (default: image width)",
	);
	console.log(
		`  --distance <fn>   Distance function: ${Object.keys(DISTANCE_FNS).join(", ")} (default: SSIM)`,
	);
	console.log(
		`  --evaluate <fn>   Evaluate function: ${Object.keys(EVALUTATE_FNS).join(", ")} (default: KURTOSIS)`,
	);
	console.log(
		"  --out <file>      Output file (default: out.txt, or out_N.txt if taken)",
	);
	console.log(
		"  --color           Colour each glyph to match the image (ANSI truecolor)",
	);
	console.log("  -h, --help        Show this help message");
	console.log("  -v, --version     Show version number");
	process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
	console.log(__VERSION__);
	process.exit(0);
}

function parseArg(args: string[], name: string): number | undefined {
	const idx = args.indexOf(name);
	if (idx === -1) return undefined;
	const val = parseInt(args[idx + 1], 10);
	if (Number.isNaN(val) || val <= 0) {
		console.error(`Error: ${name} requires a positive integer.`);
		process.exit(1);
	}
	return val;
}

function parseStringArg(args: string[], name: string): string | undefined {
	const idx = args.indexOf(name);
	if (idx === -1) return undefined;
	return args[idx + 1];
}

function nextOutputPath(ext: string): string {
	if (!fs.existsSync(`out.${ext}`)) return `out.${ext}`;
	let i = 1;
	while (fs.existsSync(`out_${i}.${ext}`)) i++;
	return `out_${i}.${ext}`;
}

const color = args.includes("--color");
args.splice(args.indexOf("--color"), color ? 1 : 0);

const optWidth = parseArg(args, "--width");
const outPath = parseStringArg(args, "--out") || nextOutputPath(color ? "ans" : "txt");
const distanceArg = parseStringArg(args, "--distance") || "SSIM";
const evaluateArg = parseStringArg(args, "--evaluate") || "KURTOSIS";

if (!(distanceArg in DISTANCE_FNS)) {
	console.error(
		`Error: Unknown distance function "${distanceArg}". Valid options: ${Object.keys(DISTANCE_FNS).join(", ")}`,
	);
	process.exit(1);
}

if (!(evaluateArg in EVALUTATE_FNS)) {
	console.error(
		`Error: Unknown evaluate function "${evaluateArg}". Valid options: ${Object.keys(EVALUTATE_FNS).join(", ")}`,
	);
	process.exit(1);
}

const distance_fn = distanceArg as keyof typeof DISTANCE_FNS;
const evaluate_fn = evaluateArg as keyof typeof EVALUTATE_FNS;
const inputPath = args.pop();

if (!inputPath) {
	console.error("Error: Please provide a path to a PNG file.");
	console.error("Usage: ansi-warhol [options] <image.png>");
	process.exit(1);
}

// npm run build && npm run start --  --width=100 --height=100 Cassius_Marcellus_Coolidge_-_Poker_Game_\(1894\).png

console.log(`${inputPath} -> ${outPath}`);
if (!fs.existsSync(inputPath)) {
	console.error(`Error: File not found: ${inputPath}`);
	process.exit(1);
}

const buffer = fs.readFileSync(inputPath);
const png = PNG.sync.read(buffer);
const outWidth = optWidth ?? png.width;
let rows = 0;
for (const result of estimateAscii(
	png,
	outWidth,
	nodeCanvasFactory,
	evaluate_fn,
	distance_fn,
	undefined,
	undefined,
	false,
	false,
	"monospace",
	"normal",
	color,
)) {
	rows = result.stats.height;
	const out = color
		? gridToAnsi(gridFromText(result.ascii, result.colors), 0x000000, 0xeeeeee)
		: result.ascii;
	fs.writeFileSync(outPath, out);
}

console.log(`Rendered ${outWidth}x${rows} image to ${outPath}`);
