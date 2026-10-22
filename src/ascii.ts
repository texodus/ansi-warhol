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
import { solveCellColors } from "./color";
import {
	type GridGeometry,
	gridGeometry,
	resampleLuminance,
	resampleRGB,
} from "./grid";
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

/** Font metrics in em units (multiply by font size for pixels). */
interface FontMetrics {
	advance: number;
	ascent: number;
	descent: number;
	/** Height of one line box, i.e. one output cell. */
	lineBox: number;
}

function measureFont(
	canvasFactory: CanvasFactory,
	fontName: string,
	lineHeight: number | "normal",
): FontMetrics {
	const size = 100;
	const ctx = canvasFactory(size, size);
	ctx.font = `${size}px ${fontName}`;
	ctx.textRendering = "geometricPrecision";
	const metrics = ctx.measureText("M");
	const hasFontBox = metrics.fontBoundingBoxAscent !== undefined;
	const ascent = hasFontBox ? metrics.fontBoundingBoxAscent / size : 0.8;
	const descent = hasFontBox ? metrics.fontBoundingBoxDescent / size : 0.2;
	const normal = hasFontBox ? ascent + descent : 1.2;
	return {
		advance: metrics.width / size,
		ascent,
		descent,
		lineBox: lineHeight === "normal" ? normal : lineHeight,
	};
}

/** Width / height of one output cell for this font and line height. */
export function measureFontRatio(
	canvasFactory: CanvasFactory,
	fontName = "monospace",
	lineHeight: number | "normal" = "normal",
): number {
	const m = measureFont(canvasFactory, fontName, lineHeight);
	return m.advance / m.lineBox;
}

/**
 * Pick the glyph best matching one grid cell. `lum` is the image resampled so
 * each cell is exactly one glyph raster (`glyphW` × `glyphH`) in size.
 */
function matchCell(
	lum: Float32Array,
	lumWidth: number,
	glyphs: GlyphEntry[],
	col: number,
	row: number,
	distance_fn: keyof typeof DISTANCE_FNS,
	brightness: number = 0,
	contrast: number = 1,
	invertImage: boolean = false,
): number {
	const glyphW = glyphs[0].width;
	const glyphH = glyphs[0].height;
	const n = glyphW * glyphH;
	const base = row * glyphH * lumWidth + col * glyphW;

	// Optimization 2: compute source luminance patch once for all glyph comparisons
	const srcLum = new Float32Array(n);
	let sumS = 0,
		sumS2 = 0;
	for (let gy = 0; gy < glyphH; gy++) {
		const rowOffset = base + gy * lumWidth;
		for (let gx = 0; gx < glyphW; gx++) {
			// Optimization 3: apply brightness/contrast inline instead of adjustImage
			let v = lum[rowOffset + gx];
			v = ((v / 255 + brightness - 0.5) * contrast + 0.5) * 255;
			if (v < 0) v = 0;
			else if (v > 255) v = 255;
			if (invertImage) v = 255 - v;
			const idx = gy * glyphW + gx;
			srcLum[idx] = v;
			sumS += v;
			sumS2 += v * v;
		}
	}

	let bestIndex = 0;
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
			bestIndex = gi;
		}
	}

	return bestIndex;
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
	lineHeight: number | "normal" = "normal",
): GlyphEntry[] {
	const metrics = measureFont(canvasFactory, fontName, lineHeight);
	const ratio = fontRatio ?? metrics.advance / metrics.lineBox;
	const w = Math.max(1, Math.round(scale * ratio));
	const h = scale;
	// `scale` is the cell (line box) height; render glyphs at the font size
	// that produces that line box, with the baseline placed as CSS does:
	// half the leading above the font's ascent.
	const fontSize = scale / metrics.lineBox;
	const halfLeading = (metrics.lineBox - metrics.ascent - metrics.descent) / 2;
	const baseline = (halfLeading + metrics.ascent) * fontSize;
	const ctx = canvasFactory(w, h);
	ctx.font = `${fontSize}px ${fontName}`;
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
		ctx.textBaseline = "alphabetic";
		ctx.fillText(ch, w / 2, baseline);
		const imageData = ctx.getImageData(0, 0, w, h);

		const n = w * h;
		const lum = new Float32Array(n);
		let sumG = 0,
			sumG2 = 0,
			ink = 0;
		for (let i = 0; i < n; i++) {
			const idx = i * 4;
			let l =
				0.299 * imageData.data[idx] +
				0.587 * imageData.data[idx + 1] +
				0.114 * imageData.data[idx + 2];
			ink += l;
			if (invertGlyphs) l = 255 - l;
			lum[i] = l;
			sumG += l;
			sumG2 += l * l;
		}

		const coverage = ink / (n * 255);
		glyphs.push({ char: ch, lum, width: w, height: h, sumG, sumG2, coverage });
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

/** Everything needed to render one image at one grid size. */
export interface PreparedRender {
	geom: GridGeometry;
	glyphs: GlyphEntry[];
	/** Image luminance resampled to (cols × glyphW) × (rows × glyphH). */
	lum: Float32Array;
	lumWidth: number;
	/** Average colour per cell (R, G, B), when rendering in colour. */
	cellRGB: Float32Array | null;
	/** Output background luminance the glyphs are drawn over (0 or 255). */
	background: number;
}

/**
 * Compute the grid, rasterize glyphs and resample the image once, so repeated
 * renders (e.g. a brightness/contrast search) only redo the matching.
 */
export function prepareRender(
	png: RawImage,
	width: number,
	canvasFactory: CanvasFactory,
	chars: string[],
	fontRatio: number,
	invertGlyphs: boolean,
	fontName: string,
	lineHeight: number | "normal",
	color = false,
): PreparedRender {
	const geom = gridGeometry(png.width, png.height, width, fontRatio);
	const glyphs = createCharacterPortraits(
		geom.glyphRasterHeight,
		canvasFactory,
		chars,
		fontRatio,
		invertGlyphs,
		fontName,
		lineHeight,
	);
	const lumWidth = geom.cols * glyphs[0].width;
	const lum = resampleLuminance(png, lumWidth, geom.rows * glyphs[0].height);
	const cellRGB = color ? resampleRGB(png, geom.cols, geom.rows) : null;
	const background = invertGlyphs ? 255 : 0;
	return { geom, glyphs, lum, lumWidth, cellRGB, background };
}

/** Glyph colours for chosen glyph `indices`, if this render is in colour. */
export function preparedColors(
	prep: PreparedRender,
	indices: ArrayLike<number>,
	offset = 0,
): Uint8ClampedArray | undefined {
	if (!prep.cellRGB) return undefined;
	return solveCellColors(
		prep.cellRGB,
		indices,
		prep.glyphs,
		prep.background,
		offset,
	);
}

export function preparedStats(prep: PreparedRender, ascii: string): AsciiStats {
	return computeStats(
		ascii,
		prep.geom.cellWidth,
		prep.geom.cellHeight,
		prep.geom.cols,
		prep.geom.rows,
		prep.glyphs.length,
	);
}

function renderAscii(
	prep: PreparedRender,
	distance_fn: keyof typeof DISTANCE_FNS,
	brightness: number = 0,
	contrast: number = 1,
	invertImage: boolean = false,
): { ascii: string; stats: AsciiStats; colors?: Uint8ClampedArray } {
	const { geom, glyphs, lum, lumWidth } = prep;
	const indices = new Uint32Array(geom.cols * geom.rows);
	const lines: string[] = [];
	for (let row = 0; row < geom.rows; row++) {
		let line = "";
		for (let col = 0; col < geom.cols; col++) {
			const gi = matchCell(
				lum,
				lumWidth,
				glyphs,
				col,
				row,
				distance_fn,
				brightness,
				contrast,
				invertImage,
			);
			indices[row * geom.cols + col] = gi;
			line += glyphs[gi].char;
		}
		lines.push(line);
	}
	const ascii = lines.join("\n");
	const colors = preparedColors(prep, indices);
	return { ascii, stats: preparedStats(prep, ascii), colors };
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
	lineHeight: number | "normal" = "normal",
	color = false,
): Generator<AsciiResult, AsciiResult> {
	const ratio =
		fontRatio ?? measureFontRatio(canvasFactory, fontName, lineHeight);
	const prep = prepareRender(
		png,
		width,
		canvasFactory,
		chars,
		ratio,
		invertGlyphs,
		fontName,
		lineHeight,
		color,
	);

	let contrast = 4;
	let brightness = 0.1;

	// Optimization 3: brightness/contrast passed to renderAscii instead of allocating
	// a new image on every iteration
	function f(
		c: number,
		b: number,
	): {
		val: number;
		ascii: string;
		stats: AsciiStats;
		colors?: Uint8ClampedArray;
	} {
		const { ascii, stats, colors } = renderAscii(
			prep,
			distance_fn,
			b,
			c,
			invertImage,
		);
		const val = EVALUTATE_FNS[evaluate_fn](
			ascii.split("").map((x) => chars.indexOf(x)),
		);
		return { val, ascii, stats, colors };
	}

	let cur = f(contrast, brightness);
	yield { ascii: cur.ascii, brightness, contrast, stats: cur.stats, colors: cur.colors };
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
			yield { ascii: cur.ascii, brightness: b, contrast: c, stats: cur.stats, colors: cur.colors };
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
			yield { ascii: cur.ascii, brightness: b, contrast: c, stats: cur.stats, colors: cur.colors };
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
	return { ascii: cur.ascii, brightness, contrast, stats: cur.stats, colors: cur.colors };
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
	lineHeight: number | "normal" = "normal",
	color = false,
): AsciiResult {
	const ratio =
		fontRatio ?? measureFontRatio(canvasFactory, fontName, lineHeight);
	const prep = prepareRender(
		png,
		width,
		canvasFactory,
		chars,
		ratio,
		invertGlyphs,
		fontName,
		lineHeight,
		color,
	);
	const { ascii, stats, colors } = renderAscii(
		prep,
		distance_fn,
		brightness,
		contrast,
		invertImage,
	);
	return { ascii, brightness, contrast, stats, colors };
}
