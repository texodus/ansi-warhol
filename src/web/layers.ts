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

export interface LayerSettings {
	imageData: ImageData | null;
	brightness: number;
	contrast: number;
	invertImage: boolean;
	distance_fn: keyof typeof DISTANCE_FNS;
	enabledBlocks: Set<string>;
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
		distance_fn: "SSIM" as keyof typeof DISTANCE_FNS,
		enabledBlocks: new Set(DEFAULT_BLOCKS),
	};
}

function cloneLayerSettings(source: LayerSettings): LayerSettings {
	return {
		imageData: source.imageData,
		brightness: source.brightness,
		contrast: source.contrast,
		invertImage: source.invertImage,
		distance_fn: source.distance_fn,
		enabledBlocks: new Set(source.enabledBlocks),
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

export function removeLayer(id: string): void {
	const idx = layerState.layers.findIndex((l) => l.id === id);
	if (idx !== -1) {
		layerState.layers.splice(idx, 1);
	}
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
	return layerState.layers.find(
		(l) => l.id === layerState.selectedLayerId,
	);
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
	const evaluate_fn =
		DOM.evaluateSelect.value as keyof typeof EVALUTATE_FNS;

	const invertGlyphs = DOM.invertGlyphsCheck.checked;

	return { width, fontName, lineHeight, fontRatio, evaluate_fn, invertGlyphs };
}

export function buildConvertParams(
	layer: Layer,
	global: GlobalParams,
): ConvertParams {
	const chars = [" ", ...buildCharList([...layer.settings.enabledBlocks])];
	return {
		...global,
		chars,
		distance_fn: layer.settings.distance_fn,
		invertGlyphs: global.invertGlyphs,
		invertImage: layer.settings.invertImage,
		brightness: layer.settings.brightness,
		contrast: layer.settings.contrast,
	};
}
