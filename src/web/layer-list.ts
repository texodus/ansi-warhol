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
import { getLayerState, selectLayer, moveLayer, renameLayer } from "./layers";
import type { Layer } from "./layers";

let dragSourceIndex: number | null = null;
let onSelectCallback: (() => void) | null = null;
let onReorderCallback: (() => void) | null = null;
let onVisibilityCallback: (() => void) | null = null;

function setupDragEvents(item: HTMLDivElement): void {
	item.addEventListener("dragstart", (e) => {
		dragSourceIndex = parseInt(item.dataset.index!, 10);
		e.dataTransfer!.effectAllowed = "move";
		item.style.opacity = "0.5";
	});

	item.addEventListener("dragend", () => {
		item.style.opacity = "";
		dragSourceIndex = null;
		for (const el of document.querySelectorAll(".layer-item.drag-over")) {
			el.classList.remove("drag-over");
		}
	});

	item.addEventListener("dragover", (e) => {
		e.preventDefault();
		e.dataTransfer!.dropEffect = "move";
		item.classList.add("drag-over");
	});

	item.addEventListener("dragleave", () => {
		item.classList.remove("drag-over");
	});

	item.addEventListener("drop", (e) => {
		e.preventDefault();
		item.classList.remove("drag-over");
		const targetIndex = parseInt(item.dataset.index!, 10);
		if (dragSourceIndex !== null && dragSourceIndex !== targetIndex) {
			moveLayer(dragSourceIndex, targetIndex);
			renderLayerList();
			onReorderCallback?.();
		}
	});
}

/** Swap the name label for a text input; Enter/blur commits, Escape cancels. */
function startRename(
	item: HTMLDivElement,
	nameSpan: HTMLSpanElement,
	layer: Layer,
): void {
	const input = document.createElement("input");
	input.type = "text";
	input.className = "layer-name-input";
	input.value = layer.name;
	item.draggable = false;

	let done = false;
	const finish = (commit: boolean) => {
		if (done) return;
		done = true;
		const name = input.value.trim();
		if (commit && name) renameLayer(layer.id, name);
		renderLayerList();
	};

	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") finish(true);
		else if (e.key === "Escape") finish(false);
	});
	input.addEventListener("blur", () => finish(true));
	input.addEventListener("click", (e) => e.stopPropagation());

	nameSpan.replaceWith(input);
	input.focus();
	input.select();
}

export function renderLayerList(): void {
	const state = getLayerState();
	const container = DOM.layerList;
	container.innerHTML = "";

	// Render in reverse order (top layer first visually)
	for (let i = state.layers.length - 1; i >= 0; i--) {
		const layer = state.layers[i];
		const item = document.createElement("div");
		item.className =
			"layer-item" +
			(layer.id === state.selectedLayerId ? " selected" : "") +
			(layer.visible ? "" : " hidden-layer");
		item.draggable = true;
		item.dataset.layerId = layer.id;
		item.dataset.index = String(i);

		const visibleCheck = document.createElement("input");
		visibleCheck.type = "checkbox";
		visibleCheck.className = "layer-visible";
		visibleCheck.checked = layer.visible;
		visibleCheck.title = "Toggle visibility";
		visibleCheck.setAttribute("aria-label", `Show ${layer.name}`);
		visibleCheck.addEventListener("click", (e) => e.stopPropagation());
		visibleCheck.addEventListener("change", () => {
			layer.visible = visibleCheck.checked;
			item.classList.toggle("hidden-layer", !layer.visible);
			onVisibilityCallback?.();
		});

		const nameSpan = document.createElement("span");
		nameSpan.className = "layer-name";
		nameSpan.textContent = layer.name;
		nameSpan.title = "Double-click to rename";
		nameSpan.addEventListener("dblclick", (e) => {
			e.stopPropagation();
			startRename(item, nameSpan, layer);
		});

		const indicator = document.createElement("span");
		indicator.className = "layer-image-indicator";
		indicator.textContent =
			(layer.settings.imageData ? "[image]" : "[empty]") +
			(layer.settings.crop.length > 0 ? " [crop]" : "");

		item.appendChild(visibleCheck);
		item.appendChild(nameSpan);
		item.appendChild(indicator);

		item.addEventListener("click", () => {
			if (getLayerState().selectedLayerId === layer.id) return;
			selectLayer(layer.id);
			// Update in place rather than re-rendering, so a dblclick still
			// lands on the same element.
			for (const el of container.querySelectorAll(".layer-item")) {
				el.classList.toggle("selected", el === item);
			}
			onSelectCallback?.();
		});

		setupDragEvents(item);
		container.appendChild(item);
	}
}

export function initLayerList(
	onSelect: () => void,
	onReorder: () => void,
	onVisibilityChange: () => void,
): void {
	onSelectCallback = onSelect;
	onReorderCallback = onReorder;
	onVisibilityCallback = onVisibilityChange;
	renderLayerList();
}
