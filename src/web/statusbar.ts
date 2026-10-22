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
	gridToAnsi,
	gridToHtml,
	gridToHtmlDocument,
	gridToText,
} from "../index";
import { DOM } from "./dom";
import { outputColors, outputGrid, outputStyle } from "./output";

const DEFAULT_BASE_NAME = "ansi-warhol";

type SaveFormat = "txt" | "ans" | "html";

const MIME_TYPES: Record<SaveFormat, string> = {
	txt: "text/plain;charset=utf-8",
	ans: "text/plain;charset=utf-8",
	html: "text/html;charset=utf-8",
};

function outputText(): string {
	return DOM.output.textContent ?? "";
}

/** Name the saved file after the most recently loaded image, if any. */
function saveFileName(format: SaveFormat): string {
	const image = DOM.fileInput.files?.[0]?.name;
	const base = image ? image.replace(/\.[^.]+$/, "") : DEFAULT_BASE_NAME;
	return `${base}.${format}`;
}

function exportOutput(format: SaveFormat): string | null {
	const grid = outputGrid();
	if (!grid) return null;
	if (format === "html") return gridToHtmlDocument(grid, outputStyle());
	if (format === "ans") {
		const { background, foreground } = outputColors();
		return gridToAnsi(grid, background, foreground);
	}
	return gridToText(grid);
}

function flashStatus(message: string): void {
	DOM.status.textContent = message;
}

/** Copy plain text, plus coloured HTML where the clipboard supports it. */
async function copyOutput(): Promise<void> {
	const grid = outputGrid();
	if (!grid) return;
	const text = gridToText(grid);
	try {
		if (grid.colors && typeof ClipboardItem !== "undefined") {
			const s = outputStyle();
			const html = `<pre style="background:${s.background};color:${s.foreground};font-family:${s.fontFamily};line-height:${s.lineHeight}">${gridToHtml(grid)}</pre>`;
			await navigator.clipboard.write([
				new ClipboardItem({
					"text/plain": new Blob([text], { type: "text/plain" }),
					"text/html": new Blob([html], { type: "text/html" }),
				}),
			]);
		} else {
			await navigator.clipboard.writeText(text);
		}
		flashStatus(`Copied ${text.split("\n").length} lines to the clipboard.`);
	} catch (err) {
		flashStatus(`Copy failed: ${(err as Error).message}`);
	}
}

function saveOutput(): void {
	const format = DOM.saveFormat.value as SaveFormat;
	const content = exportOutput(format);
	if (content === null) return;
	const blob = new Blob([content], { type: MIME_TYPES[format] });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = saveFileName(format);
	link.click();
	URL.revokeObjectURL(url);
	flashStatus(`Saved ${link.download}.`);
}

/**
 * Wire up the status bar actions. `onNewImage` resets the document; it
 * returns false if the user cancelled.
 */
export function initStatusBar(onNewImage: () => boolean): void {
	const syncEnabled = () => {
		const empty = outputText().length === 0;
		DOM.copyBtn.disabled = empty;
		DOM.saveBtn.disabled = empty;
	};
	new MutationObserver(syncEnabled).observe(DOM.output, {
		childList: true,
		characterData: true,
		subtree: true,
	});
	syncEnabled();

	DOM.copyBtn.addEventListener("click", copyOutput);
	DOM.saveBtn.addEventListener("click", saveOutput);
	DOM.newImageBtn.addEventListener("click", () => {
		// Also forget the loaded file, so Save falls back to the default name
		if (onNewImage()) DOM.fileInput.value = "";
	});
}
