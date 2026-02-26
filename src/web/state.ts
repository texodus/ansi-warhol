import {
	browserCanvasFactory,
	measureFontRatio,
	type DISTANCE_FNS,
	type EVALUTATE_FNS,
	type WebGPURenderer,
} from "../index";

import { DOM } from "./dom";
import { getSelectedChars } from "./blocks";

export interface ConvertParams {
	width: number;
	fontName: string;
	lineHeight: number | "normal";
	fontRatio: number;
	distance_fn: keyof typeof DISTANCE_FNS;
	evaluate_fn: keyof typeof EVALUTATE_FNS;
	chars: string[];
	invertGlyphs: boolean;
	invertImage: boolean;
	brightness: number;
	contrast: number;
}

export let currentImageData: ImageData | null = null;
export let gpuRenderer: WebGPURenderer | null = null;

export function setImageData(data: ImageData) {
	currentImageData = data;
}

export function setGpuRenderer(r: WebGPURenderer) {
	gpuRenderer = r;
}

/** 
 * Read all form values into a single typed object. Returns null on validation 
 * error (with status message set). 
 */
export function getParams(): ConvertParams | null {
	const width = parseInt(DOM.widthInput.value, 10) || 76;
	const chars = getSelectedChars();
	if (chars.length === 0) {
		DOM.status.textContent = "Enable at least one Unicode block.";
		return null;
	}

	const lhRaw = DOM.lineHeightInput.value.trim();
	const lineHeight = lhRaw === "normal" ? "normal" : parseFloat(lhRaw);
	if (
		lineHeight !== "normal" &&
		(Number.isNaN(lineHeight as number) || (lineHeight as number) <= 0)
	) {
		DOM.status.textContent =
			"Invalid line-height. Use 'normal' or a positive number.";
		return null;
	}

	const fontName = DOM.fontInput.value.trim() || "monospace";
	const fontRatio = measureFontRatio(
		browserCanvasFactory,
		fontName,
		lineHeight,
	);
	const distance_fn = DOM.distanceSelect.value as keyof typeof DISTANCE_FNS;
	const evaluate_fn = DOM.evaluateSelect.value as keyof typeof EVALUTATE_FNS;
	const invertGlyphs = DOM.invertGlyphsCheck.checked;
	const invertImage = DOM.invertImageCheck.checked;
	const brightness = parseFloat(DOM.brightnessInput.value) || 0;
	const contrast = parseFloat(DOM.contrastInput.value) || 1;

	return {
		width,
		fontName,
		lineHeight,
		fontRatio,
		distance_fn,
		evaluate_fn,
		chars,
		invertGlyphs,
		invertImage,
		brightness,
		contrast,
	};
}
