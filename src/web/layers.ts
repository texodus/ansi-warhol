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

import {
	buildCharList,
	browserCanvasFactory,
	DEFAULT_BLOCKS,
	measureFontRatio,
	type DISTANCE_FNS,
	type EVALUTATE_FNS,
} from "../index";
import { DOM } from "./dom";
import type { ConvertParams } from "./state";

export type CharSource = "blocks" | "custom";

/**
 * Crop rectangle in units of the character grid width, so it stays put when
 * the output width changes (rows scale with columns).
 */
export interface CropRect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export type CropOp = "union" | "subtract";

/** One step of a crop region; steps are combined in order. */
export interface CropShape {
	op: CropOp;
	rect: CropRect;
}

export interface LayerSettings {
	imageData: ImageData | null;
	brightness: number;
	contrast: number;
	invertImage: boolean;
	/** Colour each glyph to match its cell's average colour. */
	color: boolean;
	distance_fn: keyof typeof DISTANCE_FNS;
	enabledBlocks: Set<string>;
	charSource: CharSource;
	includeChars: string;
	excludeChars: string;
	/** Crop region steps; empty means uncropped. */
	crop: CropShape[];
}

export interface Layer {
	id: string;
	name: string;
	settings: LayerSettings;
	visible: boolean;
}

export interface GlobalParams {
	width: number;
	fontName: string;
	lineHeight: number | "normal";
	fontRatio: number;
	evaluate_fn: keyof typeof EVALUTATE_FNS;
	invertGlyphs: boolean;
}

interface LayerState {
	layers: Layer[];
	selectedLayerId: string;
}

let nextLayerId = 1;

const layerState: LayerState = {
	layers: [],
	selectedLayerId: "",
};

export function createDefaultLayerSettings(): LayerSettings {
	return {
		imageData: null,
		brightness: 0,
		contrast: 1,
		invertImage: false,
		color: false,
		distance_fn: "SSIM" as keyof typeof DISTANCE_FNS,
		enabledBlocks: new Set(DEFAULT_BLOCKS),
		charSource: "blocks",
		includeChars: "",
		excludeChars: "",
		crop: [],
	};
}

function cloneLayerSettings(source: LayerSettings): LayerSettings {
	return {
		imageData: source.imageData,
		brightness: source.brightness,
		contrast: source.contrast,
		invertImage: source.invertImage,
		color: source.color,
		distance_fn: source.distance_fn,
		enabledBlocks: new Set(source.enabledBlocks),
		charSource: source.charSource,
		includeChars: source.includeChars,
		excludeChars: source.excludeChars,
		crop: source.crop.map((s) => ({ op: s.op, rect: { ...s.rect } })),
	};
}

export function addLayer(name?: string, cloneFrom?: Layer): Layer {
	const id = String(nextLayerId++);
	const layer: Layer = {
		id,
		name: name ?? `Layer ${id}`,
		settings: cloneFrom
			? cloneLayerSettings(cloneFrom.settings)
			: createDefaultLayerSettings(),
		visible: true,
	};
	layerState.layers.push(layer);
	return layer;
}

/** Discard all layers and start over with one default layer. */
export function resetLayers(): Layer {
	layerState.layers = [];
	nextLayerId = 1;
	return addLayer();
}

export function removeLayer(id: string): void {
	const idx = layerState.layers.findIndex((l) => l.id === id);
	if (idx !== -1) {
		layerState.layers.splice(idx, 1);
	}
}

export function renameLayer(id: string, name: string): void {
	const layer = layerState.layers.find((l) => l.id === id);
	if (layer) layer.name = name;
}

export function selectLayer(id: string): void {
	layerState.selectedLayerId = id;
}

export function moveLayer(fromIndex: number, toIndex: number): void {
	const [layer] = layerState.layers.splice(fromIndex, 1);
	layerState.layers.splice(toIndex, 0, layer);
}

export function getLayerState(): LayerState {
	return layerState;
}

export function getSelectedLayer(): Layer | undefined {
	return layerState.layers.find((l) => l.id === layerState.selectedLayerId);
}

export function getGlobalParams(): GlobalParams | null {
	const width = parseInt(DOM.widthInput.value, 10) || 76;
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
	const evaluate_fn = DOM.evaluateSelect.value as keyof typeof EVALUTATE_FNS;

	const invertGlyphs = DOM.invertGlyphsCheck.checked;

	return { width, fontName, lineHeight, fontRatio, evaluate_fn, invertGlyphs };
}

/** Split text into unique, non-whitespace code points. */
function parseChars(text: string): string[] {
	return [...new Set([...text].filter((c) => !/\s/.test(c)))];
}

/** The layer's glyph palette (excluding the implicit space). */
export function resolveChars(settings: LayerSettings): string[] {
	const base =
		settings.charSource === "custom"
			? parseChars(settings.includeChars)
			: buildCharList([...settings.enabledBlocks]);
	const excluded = new Set(parseChars(settings.excludeChars));
	return [...new Set(base)].filter((c) => !excluded.has(c));
}

export function buildConvertParams(
	layer: Layer,
	global: GlobalParams,
): ConvertParams {
	const chars = [" ", ...resolveChars(layer.settings)];
	return {
		...global,
		chars,
		distance_fn: layer.settings.distance_fn,
		invertGlyphs: global.invertGlyphs,
		invertImage: layer.settings.invertImage,
		color: layer.settings.color,
		brightness: layer.settings.brightness,
		contrast: layer.settings.contrast,
	};
}
