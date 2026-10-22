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

import type { CharGrid } from "../index";
import { DOM } from "./dom";
import type { CropOp, CropRect, CropShape, Layer } from "./layers";

type DragMode = CropOp | "replace";

interface Cell {
	col: number;
	row: number;
}

interface CellRange {
	c0: number;
	r0: number;
	c1: number;
	r1: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** Convert a crop rect (in grid-width units) to an exclusive cell range. */
function rectToCells(rect: CropRect, cols: number): CellRange {
	return {
		c0: Math.round(rect.x * cols),
		r0: Math.round(rect.y * cols),
		c1: Math.round((rect.x + rect.w) * cols),
		r1: Math.round((rect.y + rect.h) * cols),
	};
}

function cellsToRect(range: CellRange, cols: number): CropRect {
	return {
		x: range.c0 / cols,
		y: range.r0 / cols,
		w: (range.c1 - range.c0) / cols,
		h: (range.r1 - range.r0) / cols,
	};
}

/**
 * Rasterize crop steps into a row-major cell mask (1 = kept). Steps apply in
 * order, starting from nothing kept — or everything kept, if the first step
 * subtracts.
 */
function cropMask(crop: CropShape[], cols: number, rows: number): Uint8Array {
	const mask = new Uint8Array(cols * rows);
	if (crop[0]?.op === "subtract") mask.fill(1);
	for (const shape of crop) {
		const { c0, r0, c1, r1 } = rectToCells(shape.rect, cols);
		const value = shape.op === "union" ? 1 : 0;
		for (let row = Math.max(0, r0); row < Math.min(r1, rows); row++) {
			for (let col = Math.max(0, c0); col < Math.min(c1, cols); col++) {
				mask[row * cols + col] = value;
			}
		}
	}
	return mask;
}

/** Append a drag of `mode` to existing crop steps. */
function combineCrop(
	crop: CropShape[],
	mode: DragMode,
	rect: CropRect,
): CropShape[] {
	if (mode === "replace") return [{ op: "union", rect }];
	return [...crop, { op: mode, rect }];
}

/**
 * Blank every cell of `grid` outside `crop`. Blank cells are uncoloured
 * spaces, which the layer merge treats as transparent.
 */
export function applyCrop(grid: CharGrid, crop: CropShape[]): CharGrid {
	if (crop.length === 0) return grid;
	const cols = Math.max(0, ...grid.lines.map((l) => l.length));
	const mask = cropMask(crop, cols, grid.lines.length);
	const kept = (row: number, col: number) => mask[row * cols + col] === 1;
	return {
		lines: grid.lines.map((line, row) =>
			line.map((ch, col) => (kept(row, col) ? ch : " ")),
		),
		colors:
			grid.colors?.map((rowColors, row) =>
				rowColors.map((c, col) => (kept(row, col) ? c : -1)),
			) ?? null,
	};
}

/** SVG path data (in cell units) for a mask's fill and its boundary. */
function maskPaths(mask: Uint8Array, cols: number, rows: number) {
	const at = (c: number, r: number) =>
		c >= 0 && c < cols && r >= 0 && r < rows ? mask[r * cols + c] : 0;
	let fill = "";
	let edge = "";
	// Fill: one rect per horizontal run of kept cells
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (!at(c, r)) continue;
			const start = c;
			while (at(c + 1, r)) c++;
			fill += `M${start} ${r}h${c + 1 - start}v1h${start - c - 1}z`;
		}
	}
	// Edges: merged runs where a cell differs from its neighbor
	for (let r = 0; r <= rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (at(c, r - 1) === at(c, r)) continue;
			const start = c;
			while (c + 1 < cols && at(c + 1, r - 1) !== at(c + 1, r)) c++;
			edge += `M${start} ${r}h${c + 1 - start}`;
		}
	}
	for (let c = 0; c <= cols; c++) {
		for (let r = 0; r < rows; r++) {
			if (at(c - 1, r) === at(c, r)) continue;
			const start = r;
			while (r + 1 < rows && at(c - 1, r + 1) !== at(c, r + 1)) r++;
			edge += `M${c} ${start}v${r + 1 - start}`;
		}
	}
	return { fill, edge };
}

/** Measure the rendered character grid of the output element. */
function outputGeometry() {
	const text = DOM.output.textContent ?? "";
	if (text.length === 0) return null;
	const lines = text.split("\n");
	const rows = lines.length;
	const cols = Math.max(...lines.map((l) => [...l].length));
	if (cols === 0) return null;
	const cs = getComputedStyle(DOM.output);
	const padL = parseFloat(cs.paddingLeft);
	const padT = parseFloat(cs.paddingTop);
	const contentW = DOM.output.clientWidth - padL - parseFloat(cs.paddingRight);
	const contentH =
		DOM.output.clientHeight - padT - parseFloat(cs.paddingBottom);
	return {
		rows,
		cols,
		// Content-box offset within the output element (border + padding)
		insetX: DOM.output.clientLeft + padL,
		insetY: DOM.output.clientTop + padT,
		contentW,
		contentH,
		cellW: contentW / cols,
		cellH: contentH / rows,
	};
}

function svgEl<K extends keyof SVGElementTagNameMap>(
	tag: K,
	cls: string,
): SVGElementTagNameMap[K] {
	const el = document.createElementNS(SVG_NS, tag);
	el.setAttribute("class", cls);
	return el;
}

/**
 * CropSelector lets the user drag rectangles over the character map to crop
 * the selected layer — plain drag replaces the region, Shift unions with it,
 * Alt/Meta removes from it — and draws the selected layer's crop region.
 */
export class CropSelector {
	private getLayer: () => Layer | undefined;
	private onChange: () => void;
	private active = false;
	private drag: { start: Cell; mode: DragMode } | null = null;
	private svg = svgEl("svg", "crop-mask");
	private fillPath = svgEl("path", "crop-fill");
	private edgePath = svgEl("path", "crop-edge");

	constructor(getLayer: () => Layer | undefined, onChange: () => void) {
		this.getLayer = getLayer;
		this.onChange = onChange;

		this.svg.setAttribute("preserveAspectRatio", "none");
		this.svg.append(this.fillPath, this.edgePath);
		DOM.cropOverlay.before(this.svg);

		DOM.cropBtn.addEventListener("click", () => this.setActive(!this.active));

		DOM.clearCropBtn.addEventListener("click", () => {
			const layer = this.getLayer();
			if (!layer || layer.settings.crop.length === 0) return;
			layer.settings.crop = [];
			this.onChange();
		});

		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && this.active) this.setActive(false);
		});

		DOM.output.addEventListener("pointerdown", (e) => {
			if (!this.active || e.button !== 0) return;
			const cell = this.cellAt(e);
			if (!cell) return;
			e.preventDefault();
			DOM.output.setPointerCapture(e.pointerId);
			const mode: DragMode = e.shiftKey
				? "union"
				: e.altKey || e.metaKey
					? "subtract"
					: "replace";
			this.drag = { start: cell, mode };
			this.drawDrag(cell);
		});

		DOM.output.addEventListener("pointermove", (e) => {
			if (!this.drag) return;
			const cell = this.cellAt(e);
			if (cell) this.drawDrag(cell);
		});

		DOM.output.addEventListener("pointerup", (e) => {
			if (!this.drag) return;
			const crop = this.pendingCrop(this.cellAt(e) ?? this.drag.start);
			this.drag = null;
			const layer = this.getLayer();
			if (crop && layer) {
				layer.settings.crop = crop;
				this.onChange();
			} else {
				this.render();
			}
		});
	}

	private setActive(active: boolean): void {
		this.active = active;
		this.drag = null;
		DOM.output.classList.toggle("cropping", active);
		DOM.cropBtn.textContent = active ? "Done" : "Select Region";
		this.render();
	}

	private cellAt(e: PointerEvent): Cell | null {
		const geom = outputGeometry();
		if (!geom) return null;
		const rect = DOM.output.getBoundingClientRect();
		const x = e.clientX - rect.left - geom.insetX;
		const y = e.clientY - rect.top - geom.insetY;
		const clamp = (v: number, max: number) =>
			Math.min(max - 1, Math.max(0, Math.floor(v)));
		return {
			col: clamp(x / geom.cellW, geom.cols),
			row: clamp(y / geom.cellH, geom.rows),
		};
	}

	private rangeFrom(a: Cell, b: Cell): CellRange {
		return {
			c0: Math.min(a.col, b.col),
			r0: Math.min(a.row, b.row),
			c1: Math.max(a.col, b.col) + 1,
			r1: Math.max(a.row, b.row) + 1,
		};
	}

	/** The selected layer's crop as it would be if the drag ended at `end`. */
	private pendingCrop(end: Cell): CropShape[] | null {
		const geom = outputGeometry();
		const layer = this.getLayer();
		if (!this.drag || !geom || !layer) return null;
		const range = this.rangeFrom(this.drag.start, end);
		const rect = cellsToRect(range, geom.cols);
		return combineCrop(layer.settings.crop, this.drag.mode, rect);
	}

	/** Preview the resulting region plus the rectangle being dragged. */
	private drawDrag(end: Cell): void {
		if (!this.drag) return;
		this.drawMask(this.pendingCrop(end) ?? []);
		this.drawRect(this.rangeFrom(this.drag.start, end), this.drag.mode);
	}

	private drawRect(range: CellRange | null, mode?: DragMode): void {
		const geom = outputGeometry();
		const overlay = DOM.cropOverlay;
		if (!geom || !range || !mode) {
			overlay.style.display = "none";
			return;
		}
		overlay.style.display = "block";
		overlay.dataset.mode = mode;
		const left = DOM.output.offsetLeft + geom.insetX;
		const top = DOM.output.offsetTop + geom.insetY;
		overlay.style.left = `${left + range.c0 * geom.cellW}px`;
		overlay.style.top = `${top + range.r0 * geom.cellH}px`;
		overlay.style.width = `${(range.c1 - range.c0) * geom.cellW}px`;
		overlay.style.height = `${(range.r1 - range.r0) * geom.cellH}px`;
	}

	private drawMask(crop: CropShape[]): void {
		const geom = outputGeometry();
		if (!geom || crop.length === 0) {
			this.svg.style.display = "none";
			return;
		}
		const { fill, edge } = maskPaths(
			cropMask(crop, geom.cols, geom.rows),
			geom.cols,
			geom.rows,
		);
		const s = this.svg.style;
		s.display = "block";
		s.left = `${DOM.output.offsetLeft + geom.insetX}px`;
		s.top = `${DOM.output.offsetTop + geom.insetY}px`;
		s.width = `${geom.contentW}px`;
		s.height = `${geom.contentH}px`;
		this.svg.setAttribute("viewBox", `0 0 ${geom.cols} ${geom.rows}`);
		this.fillPath.setAttribute("d", fill);
		this.edgePath.setAttribute("d", edge);
	}

	/** Redraw the selected layer's crop overlay and crop controls. */
	render(): void {
		const crop = this.getLayer()?.settings.crop ?? [];
		DOM.clearCropBtn.disabled = crop.length === 0;
		if (this.drag) return;
		this.drawRect(null);
		this.drawMask(crop);
	}
}
