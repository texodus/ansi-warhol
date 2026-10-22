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
/**
 * A character grid with optional per-cell colour: the common form for
 * merging, cropping, displaying and exporting rendered output.
 */
export interface CharGrid {
	/** Code points per row. */
	lines: string[][];
	/** Per-row 0xRRGGBB colour per cell, -1 for the default colour; or null. */
	colors: Int32Array[] | null;
}

/** Build a grid from rendered text and its optional R, G, B triplets. */
export function gridFromText(
	ascii: string,
	colors?: Uint8ClampedArray,
): CharGrid {
	const lines = ascii.split("\n").map((l) => [...l]);
	if (!colors) return { lines, colors: null };
	const cols = lines[0]?.length ?? 0;
	return {
		lines,
		colors: lines.map((line, row) => {
			const out = new Int32Array(line.length);
			for (let col = 0; col < line.length; col++) {
				const i = (row * cols + col) * 3;
				out[col] = (colors[i] << 16) | (colors[i + 1] << 8) | colors[i + 2];
			}
			return out;
		}),
	};
}

export function gridToText(grid: CharGrid): string {
	return grid.lines.map((l) => l.join("")).join("\n");
}

function hex(color: number): string {
	return `#${color.toString(16).padStart(6, "0")}`;
}

function rgb(color: number): [number, number, number] {
	return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
}

/**
 * Split a row into runs sharing a colour. Spaces have no visible ink, so
 * they join whichever run they fall in.
 */
function colorRuns(
	line: string[],
	colors: Int32Array,
): { text: string; color: number }[] {
	const runs: { text: string; color: number }[] = [];
	let text = "";
	let color: number | null = null;
	for (let col = 0; col < line.length; col++) {
		const ch = line[col];
		if (ch !== " " && colors[col] !== color) {
			if (text) runs.push({ text, color: color ?? -1 });
			text = "";
			color = colors[col];
		}
		text += ch;
	}
	if (text) runs.push({ text, color: color ?? -1 });
	return runs;
}

const HTML_ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
};

function escapeHtml(text: string): string {
	return text.replace(/[&<>]/g, (c) => HTML_ESCAPES[c]);
}

/** HTML for the grid's contents, one `<span>` per colour run. */
export function gridToHtml(grid: CharGrid): string {
	if (!grid.colors) return escapeHtml(gridToText(grid));
	const colors = grid.colors;
	return grid.lines
		.map((line, row) =>
			colorRuns(line, colors[row])
				.map(({ text, color }) =>
					color < 0
						? escapeHtml(text)
						: `<span style="color:${hex(color)}">${escapeHtml(text)}</span>`,
				)
				.join(""),
		)
		.join("\n");
}

export interface GridStyle {
	background: string;
	foreground: string;
	fontFamily: string;
	lineHeight: string;
}

/** A standalone HTML document showing the grid. */
export function gridToHtmlDocument(grid: CharGrid, style: GridStyle): string {
	return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ansi-warhol</title>
</head>
<body style="margin:0;background:${style.background}">
<pre style="margin:0;padding:1rem;background:${style.background};color:${style.foreground};font-family:${style.fontFamily};line-height:${style.lineHeight}">${gridToHtml(grid)}</pre>
</body>
</html>
`;
}

/**
 * Text with ANSI 24-bit colour escapes. Coloured grids set the background
 * explicitly, since glyph colours were solved against it.
 */
export function gridToAnsi(
	grid: CharGrid,
	background: number,
	foreground: number,
): string {
	if (!grid.colors) return `${gridToText(grid)}\n`;
	const colors = grid.colors;
	const [br, bg, bb] = rgb(background);
	return grid.lines
		.map((line, row) => {
			let out = `\x1b[48;2;${br};${bg};${bb}m`;
			for (const { text, color } of colorRuns(line, colors[row])) {
				const [r, g, b] = rgb(color < 0 ? foreground : color);
				out += `\x1b[38;2;${r};${g};${b}m${text}`;
			}
			return `${out}\x1b[0m`;
		})
		.join("\n")
		.concat("\n");
}
