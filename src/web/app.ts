import {
	pngToAscii,
	estimateAscii,
	browserCanvasFactory,
	DISTANCE_FNS,
	EVALUTATE_FNS,
	WebGPURenderer,
} from "../index";
import type { AsciiStats } from "../index";
import { DOM } from "./dom";
import { gpuRenderer, setGpuRenderer } from "./state";
import { BlockPicker } from "./blocks";
import {
	addLayer,
	buildConvertParams,
	getGlobalParams,
	getLayerState,
	getSelectedLayer,
	removeLayer,
	selectLayer,
} from "./layers";
import type { Layer } from "./layers";
import { initLayerList, renderLayerList } from "./layer-list";
import { mergeAsciiLayers } from "./merge";

// --- Helpers ---

function bindSlider(
	range: HTMLInputElement,
	number: HTMLInputElement,
	onChange: () => void,
) {
	range.addEventListener("input", () => {
		number.value = range.value;
		onChange();
	});
	number.addEventListener("input", () => {
		range.value = number.value;
	});
	number.addEventListener("change", () => {
		range.value = number.value;
		onChange();
	});
}

function applyFontStyle(fontName: string, lineHeight: number | "normal") {
	DOM.output.style.fontFamily = `"${fontName}", monospace`;
	DOM.output.style.lineHeight =
		lineHeight === "normal" ? "normal" : String(lineHeight);
}

function renderStats(stats: AsciiStats) {
	DOM.stats.style.display = "block";
	DOM.stats.textContent =
		`Cell: ${stats.cell_width}×${stats.cell_height}\n` +
		`Grid: ${stats.width}×${stats.height}\n` +
		`Chars: ${stats.chars} (${(stats.chars_ratio * 100).toFixed(1)}%)\n` +
		`Unique: ${stats.unique_chars} (${(stats.unique_chars_ratio * 100).toFixed(1)}%)`;
}

function renderPreview(
	imageData: ImageData,
	brightness: number,
	contrast: number,
	invertImage: boolean,
) {
	const src = imageData;
	DOM.preview.width = src.width;
	DOM.preview.height = src.height;
	DOM.preview.style.display = "block";
	const ctx = DOM.preview.getContext("2d");
	if (!ctx) return;
	const out = ctx.createImageData(src.width, src.height);
	for (let i = 0; i < src.data.length; i += 4) {
		let lum =
			0.299 * src.data[i] +
			0.587 * src.data[i + 1] +
			0.114 * src.data[i + 2];
		lum = ((lum / 255 + brightness - 0.5) * contrast + 0.5) * 255;
		if (lum < 0) lum = 0;
		else if (lum > 255) lum = 255;
		if (invertImage) lum = 255 - lum;
		out.data[i] = lum;
		out.data[i + 1] = lum;
		out.data[i + 2] = lum;
		out.data[i + 3] = 255;
	}
	ctx.putImageData(out, 0, 0);
}

function updateOutputColors() {
	if (DOM.invertGlyphsCheck.checked) {
		DOM.output.style.background = "#fff";
		DOM.output.style.color = "#000";
	} else {
		DOM.output.style.background = "#000";
		DOM.output.style.color = "";
	}
}

// --- Per-layer control sync ---

function populateControlsFromLayer(layer: Layer): void {
	DOM.brightnessInput.value = layer.settings.brightness.toFixed(2);
	DOM.brightnessRange.value = layer.settings.brightness.toFixed(2);
	DOM.contrastInput.value = layer.settings.contrast.toFixed(2);
	DOM.contrastRange.value = layer.settings.contrast.toFixed(2);
	DOM.invertImageCheck.checked = layer.settings.invertImage;
	DOM.distanceSelect.value = layer.settings.distance_fn;
	blockPicker.renderBlockLists();
	updateOutputColors();
	if (layer.settings.imageData) {
		renderPreview(
			layer.settings.imageData,
			layer.settings.brightness,
			layer.settings.contrast,
			layer.settings.invertImage,
		);
	} else {
		DOM.preview.style.display = "none";
	}
}

function saveControlsToLayer(): void {
	const layer = getSelectedLayer();
	if (!layer) return;
	layer.settings.brightness =
		parseFloat(DOM.brightnessInput.value) || 0;
	layer.settings.contrast =
		parseFloat(DOM.contrastInput.value) || 1;
	layer.settings.invertImage = DOM.invertImageCheck.checked;
	layer.settings.distance_fn =
		DOM.distanceSelect.value as keyof typeof DISTANCE_FNS;
}

function onControlChange() {
	saveControlsToLayer();
	run();
}

// --- Core actions ---

async function run() {
	const state = getLayerState();
	const global = getGlobalParams();
	if (!global) return;

	applyFontStyle(global.fontName, global.lineHeight);
	DOM.status.textContent = "Converting...";
	await new Promise((r) => setTimeout(r, 50));
	await document.fonts.ready;

	try {
		const t0 = performance.now();
		const backend = gpuRenderer ? "WebGPU" : "CPU";
		const render = gpuRenderer
			? gpuRenderer.pngToAscii.bind(gpuRenderer)
			: pngToAscii;

		const layerResults: (string | null)[] = [];
		let lastStats: AsciiStats | null = null;

		for (const layer of state.layers) {
			if (!layer.visible || !layer.settings.imageData) {
				layerResults.push(null);
				continue;
			}

			const p = buildConvertParams(layer, global);
			if (p.chars.length === 0) {
				layerResults.push(null);
				continue;
			}

			const result = await render(
				layer.settings.imageData,
				p.width,
				browserCanvasFactory,
				p.distance_fn,
				p.chars,
				p.fontRatio,
				p.invertGlyphs,
				p.invertImage,
				p.brightness,
				p.contrast,
				p.fontName,
			);

			layerResults.push(result.ascii);
			lastStats = result.stats;
		}

		const merged = mergeAsciiLayers(layerResults);
		DOM.output.textContent = merged;

		const selected = getSelectedLayer();
		if (selected?.settings.imageData) {
			renderPreview(
				selected.settings.imageData,
				selected.settings.brightness,
				selected.settings.contrast,
				selected.settings.invertImage,
			);
		}

		if (lastStats) renderStats(lastStats);

		const ms = (performance.now() - t0).toFixed(0);
		const layerCount = layerResults.filter((r) => r !== null).length;
		DOM.status.textContent = `Done (${backend}) — ${global.width} cols, ${layerCount} layer(s) in ${ms}ms`;
	} catch (err) {
		DOM.status.textContent = `Error: ${(err as Error).message}`;
		console.error(err);
	}
}

async function autoFit() {
	const selected = getSelectedLayer();
	if (!selected?.settings.imageData) return;
	const global = getGlobalParams();
	if (!global) return;

	const p = buildConvertParams(selected, global);
	if (p.chars.length === 0) return;

	applyFontStyle(global.fontName, global.lineHeight);
	DOM.status.textContent = "Auto-fitting brightness & contrast...";
	DOM.output.textContent = "";
	await new Promise((r) => setTimeout(r, 50));
	await document.fonts.ready;

	try {
		const t0 = performance.now();
		const backend = gpuRenderer ? "WebGPU" : "CPU";
		let result:
			| {
					ascii: string;
					brightness: number;
					contrast: number;
					stats: AsciiStats;
			  }
			| undefined;

		if (gpuRenderer) {
			for await (const r of gpuRenderer.estimateAscii(
				selected.settings.imageData,
				p.width,
				browserCanvasFactory,
				global.evaluate_fn,
				p.distance_fn,
				p.chars,
				p.fontRatio,
				p.invertGlyphs,
				p.invertImage,
				p.fontName,
			)) {
				result = r;
				DOM.output.textContent = r.ascii;
				renderPreview(
					selected.settings.imageData,
					r.brightness,
					r.contrast,
					p.invertImage,
				);
				DOM.status.textContent = `${backend} — searching...`;
			}
		} else {
			for (const r of estimateAscii(
				selected.settings.imageData,
				p.width,
				browserCanvasFactory,
				global.evaluate_fn,
				p.distance_fn,
				p.chars,
				p.fontRatio,
				p.invertGlyphs,
				p.invertImage,
				p.fontName,
			)) {
				result = r;
				DOM.output.textContent = r.ascii;
				renderPreview(
					selected.settings.imageData,
					r.brightness,
					r.contrast,
					p.invertImage,
				);
				DOM.status.textContent = `${backend} — searching...`;
				await new Promise((x) => requestAnimationFrame(x));
			}
		}

		if (!result) return;

		// Save found values back to layer settings
		selected.settings.brightness = result.brightness;
		selected.settings.contrast = result.contrast;

		renderStats(result.stats);
		DOM.brightnessInput.value = result.brightness.toFixed(2);
		DOM.brightnessRange.value = result.brightness.toFixed(2);
		DOM.contrastInput.value = result.contrast.toFixed(2);
		DOM.contrastRange.value = result.contrast.toFixed(2);

		// Re-render with all layers merged
		await run();

		const ms = (performance.now() - t0).toFixed(0);
		DOM.status.textContent = `Done (${backend}) — auto-fit in ${ms}ms`;
	} catch (err) {
		DOM.status.textContent = `Error: ${(err as Error).message}`;
		console.error(err);
	}
}

// --- Initialization ---

// Create initial layer
const firstLayer = addLayer();
selectLayer(firstLayer.id);

// Block picker wired to selected layer
const blockPicker = new BlockPicker(
	() => getSelectedLayer()?.settings.enabledBlocks ?? new Set(),
	(blocks) => {
		const layer = getSelectedLayer();
		if (layer) layer.settings.enabledBlocks = blocks;
	},
	onControlChange,
);

// Populate select dropdowns
for (const key of Object.keys(DISTANCE_FNS)) {
	const opt = document.createElement("option");
	opt.value = key;
	opt.textContent = key;
	DOM.distanceSelect.appendChild(opt);
}

for (const key of Object.keys(EVALUTATE_FNS)) {
	const opt = document.createElement("option");
	opt.value = key;
	opt.textContent = key;
	DOM.evaluateSelect.appendChild(opt);
}

// Slider bindings — per-layer controls use onControlChange
bindSlider(DOM.widthRange, DOM.widthInput, run);
bindSlider(DOM.brightnessRange, DOM.brightnessInput, onControlChange);
bindSlider(DOM.contrastRange, DOM.contrastInput, onControlChange);

// Layer list
function onLayerSelect() {
	const layer = getSelectedLayer();
	if (layer) populateControlsFromLayer(layer);
}

initLayerList(onLayerSelect, run);

// Layer panel buttons
DOM.addLayerBtn.addEventListener("click", () => {
	const current = getSelectedLayer();
	const layer = addLayer(undefined, current);
	selectLayer(layer.id);
	renderLayerList();
	onLayerSelect();
	run();
});

DOM.removeLayerBtn.addEventListener("click", () => {
	const state = getLayerState();
	if (state.layers.length <= 1) return;
	removeLayer(state.selectedLayerId);
	selectLayer(state.layers[state.layers.length - 1].id);
	renderLayerList();
	onLayerSelect();
	run();
});

// WebGPU
WebGPURenderer.create()
	.then((r) => {
		setGpuRenderer(r);
		console.log("WebGPU renderer initialized");
	})
	.catch((err) => {
		console.warn(
			"WebGPU not available, using CPU fallback:",
			err.message,
		);
	});

// File input — assigns to selected layer
DOM.fileInput.addEventListener("change", async (e) => {
	const file = (e.target as HTMLInputElement).files?.[0];
	if (!file) return;

	const layer = getSelectedLayer();
	if (!layer) return;

	DOM.status.textContent = "Loading image...";
	DOM.output.textContent = "";

	const img = new Image();
	img.onload = () => {
		DOM.hiddenCanvas.width = img.width;
		DOM.hiddenCanvas.height = img.height;
		const ctx = DOM.hiddenCanvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(img, 0, 0);
		layer.settings.imageData = ctx.getImageData(
			0,
			0,
			img.width,
			img.height,
		);
		renderLayerList();
		DOM.autoBtn.disabled = false;
		run();
	};

	img.onerror = () => {
		DOM.status.textContent = "Failed to load image.";
	};

	img.src = URL.createObjectURL(file);
});

// Per-layer control event listeners
DOM.resetBCBtn.addEventListener("click", () => {
	DOM.brightnessInput.value = "0";
	DOM.brightnessRange.value = "0";
	DOM.contrastInput.value = "1";
	DOM.contrastRange.value = "1";
	onControlChange();
});

DOM.invertImageCheck.addEventListener("change", onControlChange);
DOM.distanceSelect.addEventListener("change", onControlChange);

// Global control event listeners
DOM.invertGlyphsCheck.addEventListener("change", () => {
	updateOutputColors();
	run();
});
DOM.fontInput.addEventListener("change", run);
DOM.lineHeightInput.addEventListener("change", run);
DOM.evaluateSelect.addEventListener("change", run);
DOM.autoBtn.addEventListener("click", autoFit);
