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

import type { CanvasFactory } from "./canvas-factory";
import { DISTANCE_FNS, type GlyphEntry } from "./distance";
import { EVALUTATE_FNS } from "./evaluate";
import type { AsciiResult, AsciiStats, RawImage } from "./types";
import { UNICODE_BLOCKS } from "./unicode-blocks";

export { DEFAULT_BLOCKS, UNICODE_BLOCKS } from "./unicode-blocks";

function parseBlockChars(block: string): string[] {
	return [...block].filter((x) => x !== "\n" && x !== " " && x !== "\t");
}

export const ASCII_CHARS =
	Object.values(UNICODE_BLOCKS).flatMap(parseBlockChars);

export function buildCharList(enabledBlocks: string[]): string[] {
	return enabledBlocks.flatMap((name) => parseBlockChars(UNICODE_BLOCKS[name]));
}

export function measureFontRatio(
	canvasFactory: CanvasFactory,
	fontName = "monospace",
	lineHeight: number | "normal" = "normal",
): number {
	const size = 100;
	const ctx = canvasFactory(size, size);
	ctx.font = `${size}px ${fontName}`;
	ctx.textRendering = "geometricPrecision";
	const metrics = ctx.measureText("M");
	let effectiveHeight: number;
	if (lineHeight === "normal") {
		effectiveHeight =
			metrics.fontBoundingBoxAscent !== undefined
				? metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
				: size * 1.2;
	} else {
		effectiveHeight = size * lineHeight;
	}
	return metrics.width / effectiveHeight;
}

function samplePixel(
	png: RawImage,
	glyphs: GlyphEntry[],
	x: number,
	y: number,
	width: number,
	height: number,
	distance_fn: keyof typeof DISTANCE_FNS,
	brightness: number = 0,
	contrast: number = 1,
	invertImage: boolean = false,
): string {
	const x0 = Math.floor((x / width) * png.width);
	const x1 = Math.floor(((x + 1) / width) * png.width);
	const y0 = Math.floor((y / height) * png.height);
	const y1 = Math.floor(((y + 1) / height) * png.height);
	const regionW = x1 - x0;
	const regionH = y1 - y0;

	const glyphW = glyphs[0].width;
	const glyphH = glyphs[0].height;
	const n = glyphW * glyphH;

	// Optimization 2: compute source luminance patch once for all glyph comparisons
	const srcLum = new Float32Array(n);
	let sumS = 0,
		sumS2 = 0;
	for (let gy = 0; gy < glyphH; gy++) {
		const srcY = y0 + Math.floor((gy / glyphH) * regionH);
		for (let gx = 0; gx < glyphW; gx++) {
			const srcX = x0 + Math.floor((gx / glyphW) * regionW);
			const srcIdx = (png.width * srcY + srcX) * 4;
			// Optimization 3: apply brightness/contrast inline instead of adjustImage
			let lum =
				0.299 * png.data[srcIdx] +
				0.587 * png.data[srcIdx + 1] +
				0.114 * png.data[srcIdx + 2];
			lum = ((lum / 255 + brightness - 0.5) * contrast + 0.5) * 255;
			if (lum < 0) lum = 0;
			else if (lum > 255) lum = 255;
			if (invertImage) lum = 255 - lum;
			const idx = gy * glyphW + gx;
			srcLum[idx] = lum;
			sumS += lum;
			sumS2 += lum * lum;
		}
	}

	let bestChar = " ";
	let bestDist = Infinity;
	const muS = sumS / n;
	const muS2 = muS * muS;
	const sigS2 = sumS2 / n - muS2;

	for (let gi = 0; gi < glyphs.length; gi++) {
		const dist = DISTANCE_FNS[distance_fn](
			glyphs[gi],
			srcLum,
			n,
			muS,
			muS2,
			sigS2,
		);
		if (dist < bestDist) {
			bestDist = dist;
			bestChar = glyphs[gi].char;
		}
	}

	return bestChar;
}

function mode(array: number[]): number | null {
	if (array.length === 0) return null;

	var modeMap: Record<number, number> = {};
	var maxEl = array[0],
		maxCount = 1;
	for (let i = 0; i < array.length; i++) {
		let el = array[i];
		if (modeMap[el] == null) modeMap[el] = 1;
		else modeMap[el]++;
		if (modeMap[el] > maxCount) {
			maxEl = el;
			maxCount = modeMap[el];
		}
	}
	return maxEl;
}

// Optimization 1: pre-compute luminance arrays and SSIM stats per glyph
export function createCharacterPortraits(
	scale: number,
	canvasFactory: CanvasFactory,
	chars: string[] = ASCII_CHARS,
	fontRatio?: number,
	invertGlyphs: boolean = false,
	fontName: string = "monospace",
): GlyphEntry[] {
	const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName);
	const w = Math.floor(scale * ratio);
	const h = scale;
	const ctx = canvasFactory(w, h);
	ctx.font = `${scale}px ${fontName}`;
	// const base = ctx.measureText("M").width;
	const glyphs: GlyphEntry[] = [];

	const charWidths = chars.map((x) => ctx.measureText(x).width);
	const base = mode(charWidths);

	for (const i in chars) {
		const ch = chars[i];
		if (charWidths[i] !== base && ch !== " ") {
			console.warn(`Skipping |${ch}|`);
			continue;
		}

		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(ch, w / 2, h / 2);
		const imageData = ctx.getImageData(0, 0, w, h);

		const n = w * h;
		const lum = new Float32Array(n);
		let sumG = 0,
			sumG2 = 0;
		for (let i = 0; i < n; i++) {
			const idx = i * 4;
			let l =
				0.299 * imageData.data[idx] +
				0.587 * imageData.data[idx + 1] +
				0.114 * imageData.data[idx + 2];
			if (invertGlyphs) l = 255 - l;
			lum[i] = l;
			sumG += l;
			sumG2 += l * l;
		}

		glyphs.push({ char: ch, lum, width: w, height: h, sumG, sumG2 });
	}

	console.log(glyphs.map((x) => x.char));

	return glyphs;
}

export function computeStats(
	ascii: string,
	cell_width: number,
	cell_height: number,
	width: number,
	height: number,
	numGlyphs: number,
): AsciiStats {
	const chars = width * height;
	const uniqueChars = new Set(ascii.replace(/\n/g, "")).size;
	return {
		cell_width,
		cell_height,
		width,
		height,
		chars,
		chars_ratio: chars / numGlyphs,
		unique_chars: uniqueChars,
		unique_chars_ratio: uniqueChars / numGlyphs,
	};
}

function renderAscii(
	png: RawImage,
	width: number,
	glyphs: GlyphEntry[],
	distance_fn: keyof typeof DISTANCE_FNS,
	brightness: number = 0,
	contrast: number = 1,
	fontRatio: number = 0.5,
	invertImage: boolean = false,
): { ascii: string; stats: AsciiStats } {
	const cell_width = Math.floor(png.width / width);
	const cell_height = Math.ceil(cell_width / fontRatio);
	const height = Math.round(png.height / cell_height);
	const lines: string[] = [];
	for (let row = 0; row < height; row++) {
		let line = "";
		for (let col = 0; col < width; col++) {
			line += samplePixel(
				png,
				glyphs,
				col,
				row,
				width,
				height,
				distance_fn,
				brightness,
				contrast,
				invertImage,
			);
		}
		lines.push(line);
	}
	const ascii = lines.join("\n");
	const stats = computeStats(
		ascii,
		cell_width,
		cell_height,
		width,
		height,
		glyphs.length,
	);
	return { ascii, stats };
}

export function* estimateAscii(
	png: RawImage,
	width: number,
	canvasFactory: CanvasFactory,
	evaluate_fn: keyof typeof EVALUTATE_FNS,
	distance_fn: keyof typeof DISTANCE_FNS,
	chars: string[] = ASCII_CHARS,
	fontRatio?: number,
	invertGlyphs: boolean = false,
	invertImage: boolean = false,
	fontName: string = "monospace",
): Generator<AsciiResult, AsciiResult> {
	const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName);
	const cell_width = Math.floor(png.width / width);
	const cell_height = Math.ceil(cell_width / ratio);
	const glyphs = createCharacterPortraits(
		cell_height,
		canvasFactory,
		chars,
		ratio,
		invertGlyphs,
		fontName,
	);

	let contrast = 4;
	let brightness = 0.1;

	// Optimization 3: brightness/contrast passed to renderAscii instead of allocating
	// a new image on every iteration
	function f(
		c: number,
		b: number,
	): { val: number; ascii: string; stats: AsciiStats } {
		const { ascii, stats } = renderAscii(
			png,
			width,
			glyphs,
			distance_fn,
			b,
			c,
			ratio,
			invertImage,
		);
		const val = EVALUTATE_FNS[evaluate_fn](
			ascii.split("").map((x) => chars.indexOf(x)),
		);
		return { val, ascii, stats };
	}

	let cur = f(contrast, brightness);
	yield { ascii: cur.ascii, brightness, contrast, stats: cur.stats };
	console.log(
		`Contrast ${contrast}, Brightness ${brightness}, Total ${cur.val}`,
	);

	// Phase 1: Coarse grid search
	let bestC = contrast,
		bestB = brightness,
		bestF = cur.val;
	const cSteps = 10,
		bSteps = 10;
	const cMin = 0.5,
		cMax = 8;
	const bMin = -0.5,
		bMax = 0.5;

	for (let ci = 0; ci <= cSteps; ci++) {
		for (let bi = 0; bi <= bSteps; bi++) {
			const c = cMin + ((cMax - cMin) * ci) / cSteps;
			const b = bMin + ((bMax - bMin) * bi) / bSteps;
			cur = f(c, b);
			yield { ascii: cur.ascii, brightness: b, contrast: c, stats: cur.stats };
			console.log(
				`  Search -- Contrast ${c}, Brightness ${b}, Total ${cur.val}`,
			);
			if (cur.val > bestF) {
				bestF = cur.val;
				bestC = c;
				bestB = b;
			}
		}
	}

	// Phase 2: Refine around the best point
	const cRadius = (cMax - cMin) / cSteps / 2;
	const bRadius = (bMax - bMin) / bSteps / 2;
	for (let ci = -2; ci <= 2; ci++) {
		for (let bi = -2; bi <= 2; bi++) {
			const c = Math.max(cMin, Math.min(cMax, bestC + ci * cRadius));
			const b = Math.max(bMin, Math.min(bMax, bestB + bi * bRadius));
			cur = f(c, b);
			yield { ascii: cur.ascii, brightness: b, contrast: c, stats: cur.stats };
			console.log(
				`  Refine -- Contrast ${c}, Brightness ${b}, Total ${cur.val}`,
			);
			if (cur.val > bestF) {
				bestF = cur.val;
				bestC = c;
				bestB = b;
			}
		}
	}

	contrast = bestC;
	brightness = bestB;
	cur = f(contrast, brightness);
	console.log(`Final -- Contrast ${contrast}, Brightness ${brightness}`);
	return { ascii: cur.ascii, brightness, contrast, stats: cur.stats };
}

export function pngToAscii(
	png: RawImage,
	width: number,
	canvasFactory: CanvasFactory,
	distance_fn: keyof typeof DISTANCE_FNS,
	chars: string[] = ASCII_CHARS,
	fontRatio?: number,
	invertGlyphs: boolean = false,
	invertImage: boolean = false,
	brightness: number = 0,
	contrast: number = 1,
	fontName: string = "monospace",
): AsciiResult {
	const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName);
	const cell_width = Math.floor(png.width / width);
	const cell_height = Math.ceil(cell_width / ratio);
	const height = Math.round(png.height / (cell_width / ratio));
	console.log(`Palette cell size ${cell_width}w * ${cell_height}h`);
	console.log(`Output size ${width}w (fixed) * ${height}h`);
	const glyphs = createCharacterPortraits(
		cell_height,
		canvasFactory,
		chars,
		ratio,
		invertGlyphs,
		fontName,
	);
	const { ascii, stats } = renderAscii(
		png,
		width,
		glyphs,
		distance_fn,
		brightness,
		contrast,
		ratio,
		invertImage,
	);
	return { ascii, brightness, contrast, stats };
}
