import * as fs from "fs";
import { PNG } from "pngjs";

const ASCII_CHARS = " .:-=+*#%@";

function samplePixel(png: PNG, x: number, y: number): number {
    const idx = (png.width * y + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const a = png.data[idx + 3];
    return a === 0 ? 0 : (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function pngToAscii(png: PNG, width: number, height: number): string {
    const lines: string[] = [];
    for (let row = 0; row < height; row++) {
        let line = "";
        const srcY = Math.floor((row / height) * png.height);
        for (let col = 0; col < width; col++) {
            const srcX = Math.floor((col / width) * png.width);
            const brightness = samplePixel(png, srcX, srcY);
            const charIdx = Math.floor(brightness * (ASCII_CHARS.length - 1));
            line += ASCII_CHARS[charIdx];
        }
        lines.push(line);
    }
    return lines.join("\n");
}

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
    console.log(args)
    const idx = args.indexOf(name);
    if (idx === -1) return undefined;
    const val = parseInt(args[idx + 1], 10);
    if (isNaN(val) || val <= 0) {
        console.error(`Error: ${name} requires a positive integer.`);
        process.exit(1);
    }
    return val;
}

const optWidth = parseArg(args, "--width");
const optHeight = parseArg(args, "--height");
const inputPath = args.find((a) => !a.startsWith("-") && a !== String(optWidth) && a !== String(optHeight));

if (!inputPath) {
    console.error("Error: Please provide a path to a PNG file.");
    console.error("Usage: utf8-painter <image.png>");
    process.exit(1);
}

// npm run build && npm run start --  --width=100 --height=100 Cassius_Marcellus_Coolidge_-_Poker_Game_\(1894\).png

if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
}

const buffer = fs.readFileSync(inputPath);
const png = PNG.sync.read(buffer);
const outWidth = optWidth ?? png.width;
const outHeight = optHeight ?? png.height;
const ascii = pngToAscii(png, outWidth, outHeight);

fs.writeFileSync("out.txt", ascii);
console.log(`Rendered ${outWidth}x${outHeight} image to out.txt`);
