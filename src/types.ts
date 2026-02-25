export interface RawImage {
	readonly width: number;
	readonly height: number;
	readonly data: Uint8Array | Uint8ClampedArray;
}
