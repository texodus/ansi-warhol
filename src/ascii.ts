import { PNG } from "pngjs";

const ASCII_CHARS = " .:-=+*#%@";

function samplePixel(
    png: PNG,
    x: number,
    y: number,
    width: number,
    height: number
): number {
    const x0 = Math.floor((x / width) * png.width);
    const x1 = Math.floor(((x + 1) / width) * png.width);
    const y0 = Math.floor((y / height) * png.height);
    const y1 = Math.floor(((y + 1) / height) * png.height);
    let totalR = 0,
        totalG = 0,
        totalB = 0,
        totalA = 0,
        count = 0;
    for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
            const idx = (png.width * py + px) * 4;
            totalR += png.data[idx];
            totalG += png.data[idx + 1];
            totalB += png.data[idx + 2];
            totalA += png.data[idx + 3];
            count++;
        }
    }
    if (count === 0 || totalA === 0) return 0;
    const r = totalR / count;
    const g = totalG / count;
    const b = totalB / count;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function pngToAscii(png: PNG, width: number, height: number): string {
    const lines: string[] = [];
    for (let row = 0; row < height; row++) {
        let line = "";
        for (let col = 0; col < width; col++) {
            const brightness = samplePixel(png, col, row, width, height);
            const charIdx = Math.floor(brightness * (ASCII_CHARS.length - 1));
            line += ASCII_CHARS[charIdx];
        }
        lines.push(line);
    }
    return lines.join("\n");
}
