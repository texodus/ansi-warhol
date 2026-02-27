import { DEFAULT_BLOCKS, UNICODE_BLOCKS } from "../index";
import { DOM } from "./dom";

/**
 * BlockPicker manages the Unicode block selection UI.
 * It does NOT own the enabled state — it delegates to get/set callbacks
 * so the caller (layer system) owns the block selection.
 */
export class BlockPicker {
	private blockItems = new Map<string, HTMLDivElement>();
	private getEnabled: () => Set<string>;
	private setEnabled: (blocks: Set<string>) => void;
	private onChange: () => void;

	constructor(
		getEnabled: () => Set<string>,
		setEnabled: (blocks: Set<string>) => void,
		onChange: () => void,
	) {
		this.getEnabled = getEnabled;
		this.setEnabled = setEnabled;
		this.onChange = onChange;

		for (const [name, chars] of Object.entries(UNICODE_BLOCKS)) {
			this.blockItems.set(name, this.createBlockItem(name, chars));
		}

		this.renderBlockLists();

		DOM.deselectAllBtn.addEventListener("click", () => {
			this.setEnabled(new Set());
			this.renderBlockLists();
			this.onChange();
		});

		DOM.defaultsBtn.addEventListener("click", () => {
			this.setEnabled(new Set(DEFAULT_BLOCKS));
			this.renderBlockLists();
			this.onChange();
		});
	}

	private createBlockItem(name: string, chars: string): HTMLDivElement {
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
			const enabled = this.getEnabled();
			if (enabled.has(name)) {
				enabled.delete(name);
			} else {
				enabled.add(name);
			}
			this.setEnabled(enabled);
			this.renderBlockLists();
			this.onChange();
		});
		return item;
	}

	/** Refresh the block list UI to match the current enabled set. */
	renderBlockLists(): void {
		const enabled = this.getEnabled();
		DOM.selectedBlocks.innerHTML = "";
		DOM.availableBlocks.innerHTML = "";
		for (const [name, item] of this.blockItems) {
			if (enabled.has(name)) {
				DOM.selectedBlocks.appendChild(item);
			} else {
				DOM.availableBlocks.appendChild(item);
			}
		}
	}
}
