import { DOM } from "./dom";
import {
	getLayerState,
	selectLayer,
	moveLayer,
} from "./layers";

let dragSourceIndex: number | null = null;
let onSelectCallback: (() => void) | null = null;
let onReorderCallback: (() => void) | null = null;

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
			(layer.id === state.selectedLayerId ? " selected" : "");
		item.draggable = true;
		item.dataset.layerId = layer.id;
		item.dataset.index = String(i);

		const nameSpan = document.createElement("span");
		nameSpan.className = "layer-name";
		nameSpan.textContent = layer.name;

		const indicator = document.createElement("span");
		indicator.className = "layer-image-indicator";
		indicator.textContent = layer.settings.imageData
			? "[image]"
			: "[empty]";

		item.appendChild(nameSpan);
		item.appendChild(indicator);

		item.addEventListener("click", () => {
			selectLayer(layer.id);
			renderLayerList();
			onSelectCallback?.();
		});

		setupDragEvents(item);
		container.appendChild(item);
	}
}

export function initLayerList(
	onSelect: () => void,
	onReorder: () => void,
): void {
	onSelectCallback = onSelect;
	onReorderCallback = onReorder;
	renderLayerList();
}
