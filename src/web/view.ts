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

import type { AsciiStats } from "../index";
import { DOM } from "./dom";

export function bindSlider(
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

export function applyFontStyle(
	fontName: string,
	lineHeight: number | "normal",
) {
	DOM.output.style.fontFamily = `"${fontName}", monospace`;
	DOM.output.style.lineHeight =
		lineHeight === "normal" ? "normal" : String(lineHeight);
}

export function renderStats(stats: AsciiStats) {
	DOM.stats.style.display = "block";
	DOM.stats.textContent =
		`Cell: ${stats.cell_width.toFixed(1)}×${stats.cell_height.toFixed(1)}px\n` +
		`Grid: ${stats.width}×${stats.height}\n` +
		`Chars: ${stats.chars} (${(stats.chars_ratio * 100).toFixed(1)}%)\n` +
		`Unique: ${stats.unique_chars} (${(stats.unique_chars_ratio * 100).toFixed(1)}%)`;
}

export function renderPreview(
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
			0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2];
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

export function updateOutputColors() {
	if (DOM.invertGlyphsCheck.checked) {
		DOM.output.style.background = "#fff";
		DOM.output.style.color = "#000";
	} else {
		DOM.output.style.background = "#000";
		DOM.output.style.color = "";
	}
}
