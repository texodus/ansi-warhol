import * as fs from "fs";
import { PNG } from "pngjs";
import { pngToAscii } from "./ascii";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: utf8-painter <image.png>");
    console.log();
    console.log("Renders a PNG image as ASCII art to out.txt");
    console.log();
    console.log("Options:");
    console.log("  --width <n>    Output width in characters (default: image width)");
    console.log("  --height <n>   Output height in characters (default: image height)");
    console.log("  -h, --help     Show this help message");
    console.log("  -v, --version  Show version number");
    process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
    console.log("0.1.0");
    process.exit(0);
}

function parseArg(args: string[], name: string): number | undefined {
    const idx = args.indexOf(name);
    if (idx === -1) return undefined;
    const val = parseInt(args[idx + 1], 10);
    if (isNaN(val) || val <= 0) {
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


function nextOutputPath(): string {
    if (!fs.existsSync("out.txt")) return "out.txt";
    let i = 1;
    while (fs.existsSync(`out_${i}.txt`)) i++;
    return `out_${i}.txt`;
}

const optWidth = parseArg(args, "--width");
const optHeight = parseArg(args, "--height");
const outPath = parseStringArg(args, "--out") || nextOutputPath();
const inputPath = args.pop();

if (!inputPath) {
    console.error("Error: Please provide a path to a PNG file.");
    console.error("Usage: utf8-painter <image.png>");
    process.exit(1);
}

// npm run build && npm run start --  --width=100 --height=100 Cassius_Marcellus_Coolidge_-_Poker_Game_\(1894\).png

console.log(`${inputPath} -> ${outPath}`)
if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
}

const buffer = fs.readFileSync(inputPath);
const png = PNG.sync.read(buffer);
const outWidth = optWidth ?? png.width;
const ascii = pngToAscii(png, outWidth);

fs.writeFileSync(outPath, ascii);
console.log(`Rendered ${outWidth}x${Math.ceil(ascii.length / outWidth)} image to ${outPath}`);
