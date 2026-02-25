import { createCanvas } from "canvas";
import type { CanvasFactory } from "./canvas-factory";

export const nodeCanvasFactory: CanvasFactory = (
	width: number,
	height: number,
): CanvasRenderingContext2D => {
	const canvas = createCanvas(width, height);
	return canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
};
