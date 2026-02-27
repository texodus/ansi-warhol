function el<T extends HTMLElement>(id: string): T {
	return document.getElementById(id) as T;
}

export const DOM = {
	fileInput: el<HTMLInputElement>("fileInput"),
	widthInput: el<HTMLInputElement>("widthInput"),
	widthRange: el<HTMLInputElement>("widthRange"),
	fontInput: el<HTMLInputElement>("fontInput"),
	lineHeightInput: el<HTMLInputElement>("lineHeightInput"),
	distanceSelect: el<HTMLSelectElement>("distanceSelect"),
	evaluateSelect: el<HTMLSelectElement>("evaluateSelect"),
	brightnessInput: el<HTMLInputElement>("brightnessInput"),
	brightnessRange: el<HTMLInputElement>("brightnessRange"),
	contrastInput: el<HTMLInputElement>("contrastInput"),
	contrastRange: el<HTMLInputElement>("contrastRange"),
	invertGlyphsCheck: el<HTMLInputElement>("invertGlyphsCheck"),
	invertImageCheck: el<HTMLInputElement>("invertImageCheck"),
	autoBtn: el<HTMLButtonElement>("autoBtn"),
	resetBCBtn: el<HTMLButtonElement>("resetBCBtn"),
	deselectAllBtn: el<HTMLButtonElement>("deselectAllBtn"),
	defaultsBtn: el<HTMLButtonElement>("defaultsBtn"),
	output: el<HTMLPreElement>("output"),
	status: el<HTMLDivElement>("status"),
	stats: el<HTMLDivElement>("stats"),
	preview: el<HTMLCanvasElement>("preview"),
	hiddenCanvas: el<HTMLCanvasElement>("hiddenCanvas"),
	selectedBlocks: el<HTMLDivElement>("selectedBlocks"),
	availableBlocks: el<HTMLDivElement>("availableBlocks"),
	layerList: el<HTMLDivElement>("layerList"),
	addLayerBtn: el<HTMLButtonElement>("addLayerBtn"),
	removeLayerBtn: el<HTMLButtonElement>("removeLayerBtn"),
};
