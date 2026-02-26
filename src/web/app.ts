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
import {
	currentImageData,
	gpuRenderer,
	setImageData,
	setGpuRenderer,
	getParams,
} from "./state";
import { initBlockPicker } from "./blocks";

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
	brightness: number,
	contrast: number,
	invertImage: boolean,
) {
	if (!currentImageData) return;
	const src = currentImageData;
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

// --- Core actions ---

async function run() {
	if (!currentImageData) return;
	const p = getParams();
	if (!p) return;

	applyFontStyle(p.fontName, p.lineHeight);
	DOM.status.textContent = "Converting...";
	await new Promise((r) => setTimeout(r, 50));
	await document.fonts.ready;

	try {
		const t0 = performance.now();
		const backend = gpuRenderer ? "WebGPU" : "CPU";
		const render = gpuRenderer
			? gpuRenderer.pngToAscii.bind(gpuRenderer)
			: pngToAscii;

		const result = await render(
			currentImageData,
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

		DOM.output.textContent = result.ascii;
		renderPreview(p.brightness, p.contrast, p.invertImage);
		renderStats(result.stats);
		const ms = (performance.now() - t0).toFixed(0);
		DOM.status.textContent = `Done (${backend}) — ${p.width} columns in ${ms}ms`;
	} catch (err) {
		DOM.status.textContent = `Error: ${(err as Error).message}`;
		console.error(err);
	}
}

async function autoFit() {
	if (!currentImageData) return;
	const p = getParams();
	if (!p) return;

	applyFontStyle(p.fontName, p.lineHeight);
	DOM.status.textContent = "Auto-fitting brightness & contrast...";
	DOM.output.textContent = "";
	await new Promise((r) => setTimeout(r, 50));
	await document.fonts.ready;

	try {
		const t0 = performance.now();
		const backend = gpuRenderer ? "WebGPU" : "CPU";
		let result: { ascii: string; brightness: number; contrast: number; stats: AsciiStats } | undefined;

		if (gpuRenderer) {
			for await (const r of gpuRenderer.estimateAscii(
				currentImageData,
				p.width,
				browserCanvasFactory,
				p.evaluate_fn,
				p.distance_fn,
				p.chars,
				p.fontRatio,
				p.invertGlyphs,
				p.invertImage,
				p.fontName,
			)) {
				result = r;
				DOM.output.textContent = r.ascii;
				renderPreview(r.brightness, r.contrast, p.invertImage);
				DOM.status.textContent = `${backend} — searching...`;
			}
		} else {
			for (const r of estimateAscii(
				currentImageData,
				p.width,
				browserCanvasFactory,
				p.evaluate_fn,
				p.distance_fn,
				p.chars,
				p.fontRatio,
				p.invertGlyphs,
				p.invertImage,
				p.fontName,
			)) {
				result = r;
				DOM.output.textContent = r.ascii;
				renderPreview(r.brightness, r.contrast, p.invertImage);
				DOM.status.textContent = `${backend} — searching...`;
				await new Promise((x) => requestAnimationFrame(x));
			}
		}

		if (!result) return;
		renderStats(result.stats);
		DOM.brightnessInput.value = result.brightness.toFixed(2);
		DOM.brightnessRange.value = result.brightness.toFixed(2);
		DOM.contrastInput.value = result.contrast.toFixed(2);
		DOM.contrastRange.value = result.contrast.toFixed(2);
		const ms = (performance.now() - t0).toFixed(0);
		DOM.status.textContent = `Done (${backend}) — auto-fit in ${ms}ms`;
	} catch (err) {
		DOM.status.textContent = `Error: ${(err as Error).message}`;
		console.error(err);
	}
}

// --- Initialization ---

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

// Slider bindings
bindSlider(DOM.widthRange, DOM.widthInput, run);
bindSlider(DOM.brightnessRange, DOM.brightnessInput, run);
bindSlider(DOM.contrastRange, DOM.contrastInput, run);

// Block picker
initBlockPicker(run);

// WebGPU
WebGPURenderer.create()
	.then((r) => {
		setGpuRenderer(r);
		console.log("WebGPU renderer initialized");
	})
	.catch((err) => {
		console.warn("WebGPU not available, using CPU fallback:", err.message);
	});

// File input
DOM.fileInput.addEventListener("change", async (e) => {
	const file = (e.target as HTMLInputElement).files?.[0];
	if (!file) return;

	DOM.status.textContent = "Loading image...";
	DOM.output.textContent = "";

	const img = new Image();
	img.onload = () => {
		DOM.hiddenCanvas.width = img.width;
		DOM.hiddenCanvas.height = img.height;
		const ctx = DOM.hiddenCanvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(img, 0, 0);
		setImageData(ctx.getImageData(0, 0, img.width, img.height));
		DOM.autoBtn.disabled = false;
		run();
	};

	img.onerror = () => {
		DOM.status.textContent = "Failed to load image.";
	};

	img.src = URL.createObjectURL(file);
});

// Control event listeners
DOM.resetBCBtn.addEventListener("click", () => {
	DOM.brightnessInput.value = "0";
	DOM.brightnessRange.value = "0";
	DOM.contrastInput.value = "1";
	DOM.contrastRange.value = "1";
	run();
});

DOM.invertGlyphsCheck.addEventListener("change", () => {
	updateOutputColors();
	run();
});
DOM.invertImageCheck.addEventListener("change", run);
DOM.fontInput.addEventListener("change", run);
DOM.lineHeightInput.addEventListener("change", run);
DOM.distanceSelect.addEventListener("change", run);
DOM.evaluateSelect.addEventListener("change", run);
DOM.autoBtn.addEventListener("click", autoFit);
