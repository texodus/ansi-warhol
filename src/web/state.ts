import type {
	DISTANCE_FNS,
	EVALUTATE_FNS,
	WebGPURenderer,
} from "../index";

export interface ConvertParams {
	width: number;
	fontName: string;
	lineHeight: number | "normal";
	fontRatio: number;
	distance_fn: keyof typeof DISTANCE_FNS;
	evaluate_fn: keyof typeof EVALUTATE_FNS;
	chars: string[];
	invertGlyphs: boolean;
	invertImage: boolean;
	brightness: number;
	contrast: number;
}

export let gpuRenderer: WebGPURenderer | null = null;

export function setGpuRenderer(r: WebGPURenderer) {
	gpuRenderer = r;
}
