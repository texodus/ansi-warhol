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

import type { RawImage } from "./types";

/**
 * Glyphs are rasterized (and image cells resampled) at the source cell's
 * pixel height, clamped to this range: too few pixels and distinct glyphs
 * become indistinguishable, too many and matching gets slow without
 * improving the result.
 */
export const MIN_GLYPH_RASTER_HEIGHT = 12;
export const MAX_GLYPH_RASTER_HEIGHT = 24;

export interface GridGeometry {
	/** Output grid size in characters. */
	cols: number;
	rows: number;
	/** Source image pixels covered by one cell (fractional). */
	cellWidth: number;
	cellHeight: number;
	/** Pixel height to rasterize glyphs at. */
	glyphRasterHeight: number;
}

/**
 * Map an image onto a character grid `cols` wide whose cells have aspect
 * `fontRatio` (width / height), preserving the image's aspect ratio.
 */
export function gridGeometry(
	imageWidth: number,
	imageHeight: number,
	cols: number,
	fontRatio: number,
): GridGeometry {
	const cellWidth = imageWidth / cols;
	const idealCellHeight = cellWidth / fontRatio;
	const rows = Math.max(1, Math.round(imageHeight / idealCellHeight));
	const glyphRasterHeight = Math.min(
		MAX_GLYPH_RASTER_HEIGHT,
		Math.max(MIN_GLYPH_RASTER_HEIGHT, Math.round(idealCellHeight)),
	);
	return {
		cols,
		rows,
		cellWidth,
		cellHeight: imageHeight / rows,
		glyphRasterHeight,
	};
}

/** Source taps and normalized weights for one output pixel along one axis. */
interface Taps {
	start: number;
	weights: Float32Array;
}

/** Area-coverage weights for resampling `srcN` pixels to `dstN`. */
function boxTaps(srcN: number, dstN: number): Taps[] {
	const scale = srcN / dstN;
	const taps: Taps[] = [];
	for (let d = 0; d < dstN; d++) {
		const a = d * scale;
		const b = (d + 1) * scale;
		const start = Math.floor(a);
		const end = Math.min(srcN, Math.ceil(b));
		const weights = new Float32Array(Math.max(1, end - start));
		for (let s = start; s < end; s++) {
			weights[s - start] = (Math.min(b, s + 1) - Math.max(a, s)) / scale;
		}
		taps.push({ start, weights });
	}
	return taps;
}

/** Output channels as weighted sums of a pixel's R, G and B. */
const LUMINANCE: number[][] = [[0.299, 0.587, 0.114]];
const RGB: number[][] = [
	[1, 0, 0],
	[0, 1, 0],
	[0, 0, 1],
];

/**
 * Resample an image to `dstW` × `dstH` with an area-averaging box filter, so
 * every source pixel contributes in proportion to its coverage. Output is
 * interleaved, one value per entry of `channels`.
 */
function boxResample(
	png: RawImage,
	dstW: number,
	dstH: number,
	channels: number[][],
): Float32Array {
	const srcW = png.width;
	const srcH = png.height;
	const data = png.data;
	const nc = channels.length;
	const xTaps = boxTaps(srcW, dstW);
	const yTaps = boxTaps(srcH, dstH);

	// Horizontal pass: srcH rows × dstW columns
	const tmp = new Float32Array(srcH * dstW * nc);
	for (let y = 0; y < srcH; y++) {
		const rowOffset = y * srcW;
		for (let x = 0; x < dstW; x++) {
			const { start, weights } = xTaps[x];
			const o = (y * dstW + x) * nc;
			for (let k = 0; k < weights.length; k++) {
				const i = (rowOffset + start + k) * 4;
				const w = weights[k];
				for (let c = 0; c < nc; c++) {
					const [wr, wg, wb] = channels[c];
					tmp[o + c] +=
						w * (wr * data[i] + wg * data[i + 1] + wb * data[i + 2]);
				}
			}
		}
	}

	// Vertical pass: dstH rows × dstW columns
	const rowLen = dstW * nc;
	const out = new Float32Array(dstH * rowLen);
	for (let y = 0; y < dstH; y++) {
		const { start, weights } = yTaps[y];
		const outOffset = y * rowLen;
		for (let k = 0; k < weights.length; k++) {
			const w = weights[k];
			const srcOffset = (start + k) * rowLen;
			for (let x = 0; x < rowLen; x++) {
				out[outOffset + x] += w * tmp[srcOffset + x];
			}
		}
	}
	return out;
}

/** Area-averaged luminance at `dstW` × `dstH`. */
export function resampleLuminance(
	png: RawImage,
	dstW: number,
	dstH: number,
): Float32Array {
	return boxResample(png, dstW, dstH, LUMINANCE);
}

/** Area-averaged colour at `dstW` × `dstH`, as interleaved R, G, B. */
export function resampleRGB(
	png: RawImage,
	dstW: number,
	dstH: number,
): Float32Array {
	return boxResample(png, dstW, dstH, RGB);
}
