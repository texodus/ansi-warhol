import { buildCharList, DEFAULT_BLOCKS, UNICODE_BLOCKS } from "../index";
import { DOM } from "./dom";

// TODO refactor this module to be a class, instead of keeping state in module
// scope.

const enabledBlocks = new Set(DEFAULT_BLOCKS);
const blockItems = new Map<string, HTMLDivElement>();

export function getSelectedChars(): string[] {
	return [" ", ...buildCharList([...enabledBlocks])];
}

function createBlockItem(
	name: string,
	chars: string,
	onChange: () => void,
): HTMLDivElement {
	const item = document.createElement("div");
	item.className = "block-item";
	const blockChars = [...chars].filter(
		(x) => x !== "\n" && x !== " " && x !== "\t",
	);
	const nameSpan = document.createElement("span");
	nameSpan.className = "block-name";
	nameSpan.textContent = name;
	const countSpan = document.createElement("span");
	countSpan.className = "block-count";
	countSpan.textContent = ` (${blockChars.length})`;
	item.appendChild(nameSpan);
	item.appendChild(countSpan);
	item.addEventListener("click", () => {
		if (enabledBlocks.has(name)) {
			enabledBlocks.delete(name);
		} else {
			enabledBlocks.add(name);
		}
		renderBlockLists();
		onChange();
	});
	return item;
}

function renderBlockLists() {
	DOM.selectedBlocks.innerHTML = "";
	DOM.availableBlocks.innerHTML = "";
	for (const [name, item] of blockItems) {
		if (enabledBlocks.has(name)) {
			DOM.selectedBlocks.appendChild(item);
		} else {
			DOM.availableBlocks.appendChild(item);
		}
	}
}

function setBlocks(names: string[], onChange: () => void) {
	enabledBlocks.clear();
	for (const name of names) enabledBlocks.add(name);
	renderBlockLists();
	onChange();
}

/** Initialize the block picker UI. Call once at startup. */
export function initBlockPicker(onChange: () => void) {
	for (const [name, chars] of Object.entries(UNICODE_BLOCKS)) {
		blockItems.set(name, createBlockItem(name, chars, onChange));
	}
	renderBlockLists();

	DOM.deselectAllBtn.addEventListener("click", () => setBlocks([], onChange));
	DOM.defaultsBtn.addEventListener("click", () =>
		setBlocks(DEFAULT_BLOCKS, onChange),
	);
}
