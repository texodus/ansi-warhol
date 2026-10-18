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

import { DOM } from "./dom";
import type { CharSource, LayerSettings } from "./layers";
import { resolveChars } from "./layers";

const TEXT_DEBOUNCE_MS = 300;

/**
 * CharsetControls manages the character source (Unicode blocks vs. an
 * explicit include list) and the exclude list. Like BlockPicker, it does not
 * own state — it reads and writes the settings returned by `getSettings`.
 */
export class CharsetControls {
	private getSettings: () => LayerSettings | undefined;
	private onChange: () => void;
	private debounceTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(
		getSettings: () => LayerSettings | undefined,
		onChange: () => void,
	) {
		this.getSettings = getSettings;
		this.onChange = onChange;

		for (const radio of [DOM.charSourceBlocks, DOM.charSourceCustom]) {
			radio.addEventListener("change", () => {
				const settings = this.getSettings();
				if (!settings) return;
				settings.charSource = radio.value as CharSource;
				this.render();
				this.onChange();
			});
		}

		DOM.includeInput.addEventListener("input", () => {
			const settings = this.getSettings();
			if (!settings) return;
			settings.includeChars = DOM.includeInput.value;
			this.scheduleChange();
		});

		DOM.excludeInput.addEventListener("input", () => {
			const settings = this.getSettings();
			if (!settings) return;
			settings.excludeChars = DOM.excludeInput.value;
			this.scheduleChange();
		});

		this.render();
	}

	private scheduleChange(): void {
		this.renderCount();
		clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(this.onChange, TEXT_DEBOUNCE_MS);
	}

	/** Refresh the charset UI to match the current layer's settings. */
	render(): void {
		const settings = this.getSettings();
		if (!settings) return;
		const custom = settings.charSource === "custom";
		DOM.charSourceBlocks.checked = !custom;
		DOM.charSourceCustom.checked = custom;
		DOM.includeInput.value = settings.includeChars;
		DOM.excludeInput.value = settings.excludeChars;
		DOM.includeField.style.display = custom ? "" : "none";
		DOM.blockSelector.style.display = custom ? "none" : "";
		this.renderCount();
	}

	/** Update the palette size label (call after block selection changes). */
	renderCount(): void {
		const settings = this.getSettings();
		if (!settings) return;
		DOM.charCount.textContent = `${resolveChars(settings).length} chars`;
	}
}
