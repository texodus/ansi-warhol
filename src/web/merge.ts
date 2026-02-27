/**
 * Merge multiple ASCII art strings. Layers are ordered bottom-to-top.
 * Space = transparent. Non-space in higher layers overwrites lower.
 */
export function mergeAsciiLayers(
	layerResults: (string | null)[],
): string {
	const nonNull = layerResults.filter((s): s is string => s !== null);
	if (nonNull.length === 0) return "";
	if (nonNull.length === 1) return nonNull[0];

	const allLines = nonNull.map((s) => s.split("\n"));
	const maxRows = Math.max(...allLines.map((l) => l.length));
	const maxCols = Math.max(
		...allLines.map((l) => Math.max(...l.map((r) => r.length), 0)),
	);

	const result: string[] = [];
	for (let row = 0; row < maxRows; row++) {
		const chars: string[] = new Array(maxCols).fill(" ");
		for (const lines of allLines) {
			if (row >= lines.length) continue;
			const line = lines[row];
			for (let col = 0; col < line.length; col++) {
				if (line[col] !== " ") {
					chars[col] = line[col];
				}
			}
		}
		result.push(chars.join(""));
	}
	return result.join("\n");
}
