export type CanvasFactory = (
	width: number,
	height: number,
) => CanvasRenderingContext2D;

export function browserCanvasFactory(
	width: number,
	height: number,
): CanvasRenderingContext2D {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	document.body.appendChild(canvas);
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Failed to get 2D canvas context");
	}

	return ctx;
}
