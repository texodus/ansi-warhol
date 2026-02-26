export interface RawImage {
	readonly width: number;
	readonly height: number;
	readonly data: Uint8Array | Uint8ClampedArray;
}

export interface AsciiStats {
	cell_width: number;
	cell_height: number;
	width: number;
	height: number;
	chars: number;
	chars_ratio: number;
	unique_chars: number;
	unique_chars_ratio: number;
}

export interface AsciiResult {
	ascii: string;
	brightness: number;
	contrast: number;
	stats: AsciiStats;
}
