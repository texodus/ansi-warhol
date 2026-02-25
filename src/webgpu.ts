/// <reference types="@webgpu/types" />

import { ASCII_CHARS, createCharacterPortraits, FONT_RATIO } from "./ascii";
import type { CanvasFactory } from "./canvas-factory";
import type { DISTANCE_FNS, GlyphEntry } from "./distance";
import { EVALUTATE_FNS } from "./evaluate";
import type { RawImage } from "./types";

const WORKGROUP_SIZE = 64;

function createShaderCode(
	glyphN: number,
	distanceFn: "SSIM" | "HISTOGRAM",
): string {
	const distanceId = distanceFn === "SSIM" ? 0 : 1;
	return `
const GLYPH_N: u32 = ${glyphN}u;
const DISTANCE_FN: u32 = ${distanceId}u;
const SSIM_C1: f32 = 6.5025;
const SSIM_C2: f32 = 58.5225;
const HIST_BINS: u32 = 16u;

struct Uniforms {
    img_width: u32,
    img_height: u32,
    grid_width: u32,
    grid_height: u32,
    glyph_w: u32,
    glyph_h: u32,
    num_glyphs: u32,
    num_grid_points: u32,
};

struct GridPoint {
    brightness: f32,
    contrast: f32,
};

@group(0) @binding(0) var<storage, read> image: array<u32>;
@group(0) @binding(1) var<storage, read> glyph_lum: array<f32>;
@group(0) @binding(2) var<storage, read> glyph_stats: array<vec2<f32>>;
@group(0) @binding(3) var<uniform> uniforms: Uniforms;
@group(0) @binding(4) var<storage, read> grid_points: array<GridPoint>;
@group(0) @binding(5) var<storage, read_write> output_indices: array<u32>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let total_cells = uniforms.grid_width * uniforms.grid_height;
    let idx = gid.x;
    if (idx >= total_cells * uniforms.num_grid_points) {
        return;
    }

    let grid_point_idx = idx / total_cells;
    let cell_idx = idx % total_cells;
    let col = cell_idx % uniforms.grid_width;
    let row = cell_idx / uniforms.grid_width;
    let bp = grid_points[grid_point_idx];

    let x0 = (col * uniforms.img_width) / uniforms.grid_width;
    let x1 = ((col + 1u) * uniforms.img_width) / uniforms.grid_width;
    let y0 = (row * uniforms.img_height) / uniforms.grid_height;
    let y1 = ((row + 1u) * uniforms.img_height) / uniforms.grid_height;
    let region_w = x1 - x0;
    let region_h = y1 - y0;

    // Compute source luminance for this cell
    var src_lum: array<f32, ${glyphN}>;
    var sum_s: f32 = 0.0;
    var sum_s2: f32 = 0.0;

    for (var gy: u32 = 0u; gy < uniforms.glyph_h; gy++) {
        let src_y = y0 + (gy * region_h) / uniforms.glyph_h;
        for (var gx: u32 = 0u; gx < uniforms.glyph_w; gx++) {
            let src_x = x0 + (gx * region_w) / uniforms.glyph_w;
            let pixel = image[uniforms.img_width * src_y + src_x];
            let r = f32(pixel & 0xFFu);
            let g = f32((pixel >> 8u) & 0xFFu);
            let b = f32((pixel >> 16u) & 0xFFu);
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;
            lum = ((lum / 255.0 + bp.brightness - 0.5) * bp.contrast + 0.5) * 255.0;
            lum = clamp(lum, 0.0, 255.0);
            let i = gy * uniforms.glyph_w + gx;
            src_lum[i] = lum;
            sum_s += lum;
            sum_s2 += lum * lum;
        }
    }

    let n_f = f32(GLYPH_N);

    // Build source histogram (HISTOGRAM mode only; dead-code-eliminated for SSIM)
    var src_hist: array<f32, 16>;
    if (DISTANCE_FN == 1u) {
        for (var hb: u32 = 0u; hb < HIST_BINS; hb++) {
            src_hist[hb] = 0.0;
        }
        for (var i: u32 = 0u; i < GLYPH_N; i++) {
            let bin = min(HIST_BINS - 1u, u32(src_lum[i] / 255.0 * f32(HIST_BINS)));
            src_hist[bin] += 1.0;
        }
    }

    // SSIM precomputed stats
    let mu_s = sum_s / n_f;
    let mu_s2 = mu_s * mu_s;
    let sig_s2 = sum_s2 / n_f - mu_s2;

    // Find best matching glyph
    var best_idx: u32 = 0u;
    var best_dist: f32 = 1e30;

    for (var gi: u32 = 0u; gi < uniforms.num_glyphs; gi++) {
        var dist: f32;

        if (DISTANCE_FN == 0u) {
            // SSIM distance
            let glyph_offset = gi * GLYPH_N;
            var sum_sg: f32 = 0.0;
            for (var i: u32 = 0u; i < GLYPH_N; i++) {
                sum_sg += src_lum[i] * glyph_lum[glyph_offset + i];
            }
            let stats = glyph_stats[gi];
            let mu_g = stats.x / n_f;
            let sig_g2 = stats.y / n_f - mu_g * mu_g;
            let sig_sg = sum_sg / n_f - mu_s * mu_g;
            let num = (2.0 * mu_s * mu_g + SSIM_C1) * (2.0 * sig_sg + SSIM_C2);
            let den = (mu_s2 + mu_g * mu_g + SSIM_C1) * (sig_s2 + sig_g2 + SSIM_C2);
            dist = -(num / den);
        } else {
            // Histogram intersection distance
            var glyph_hist: array<f32, 16>;
            for (var hb: u32 = 0u; hb < HIST_BINS; hb++) {
                glyph_hist[hb] = 0.0;
            }
            let glyph_offset = gi * GLYPH_N;
            for (var i: u32 = 0u; i < GLYPH_N; i++) {
                let bin = min(HIST_BINS - 1u, u32(glyph_lum[glyph_offset + i] / 255.0 * f32(HIST_BINS)));
                glyph_hist[bin] += 1.0;
            }
            var intersection: f32 = 0.0;
            for (var hb: u32 = 0u; hb < HIST_BINS; hb++) {
                intersection += min(src_hist[hb] / n_f, glyph_hist[hb] / n_f);
            }
            dist = -intersection;
        }

        if (dist < best_dist) {
            best_dist = dist;
            best_idx = gi;
        }
    }

    output_indices[idx] = best_idx;
}
`;
}

export class WebGPURenderer {
	private device: GPUDevice;
	private pipelineCache = new Map<string, GPUComputePipeline>();

	private constructor(device: GPUDevice) {
		this.device = device;
	}

	static async create(): Promise<WebGPURenderer> {
		if (!navigator.gpu) {
			throw new Error("WebGPU is not supported in this browser");
		}
		const adapter = await navigator.gpu.requestAdapter();
		if (!adapter) {
			throw new Error("Failed to get WebGPU adapter");
		}
		const device = await adapter.requestDevice();
		return new WebGPURenderer(device);
	}

	private getPipeline(
		glyphN: number,
		distanceFn: keyof typeof DISTANCE_FNS,
	): GPUComputePipeline {
		const key = `${glyphN}_${distanceFn}`;
		let pipeline = this.pipelineCache.get(key);
		if (!pipeline) {
			const code = createShaderCode(glyphN, distanceFn);
			const module = this.device.createShaderModule({ code });
			pipeline = this.device.createComputePipeline({
				layout: "auto",
				compute: { module, entryPoint: "main" },
			});
			this.pipelineCache.set(key, pipeline);
		}
		return pipeline;
	}

	private async dispatch(
		png: RawImage,
		glyphs: GlyphEntry[],
		gridPoints: { brightness: number; contrast: number }[],
		distanceFn: keyof typeof DISTANCE_FNS,
		gridWidth: number,
		gridHeight: number,
	): Promise<Uint32Array> {
		const device = this.device;
		const glyphW = glyphs[0].width;
		const glyphH = glyphs[0].height;
		const glyphN = glyphW * glyphH;
		const numGlyphs = glyphs.length;
		const numGridPoints = gridPoints.length;
		const totalCells = gridWidth * gridHeight;
		const totalItems = totalCells * numGridPoints;

		const pipeline = this.getPipeline(glyphN, distanceFn);

		// Image buffer: RGBA bytes reinterpreted as u32 per pixel
		const imageBuffer = device.createBuffer({
			size: png.data.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});
		device.queue.writeBuffer(imageBuffer, 0, new Uint8Array(png.data));

		// Glyph luminance: all glyphs packed contiguously
		const glyphLumData = new Float32Array(numGlyphs * glyphN);
		for (let i = 0; i < numGlyphs; i++) {
			glyphLumData.set(glyphs[i].lum, i * glyphN);
		}
		const glyphLumBuffer = device.createBuffer({
			size: glyphLumData.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});
		device.queue.writeBuffer(glyphLumBuffer, 0, glyphLumData);

		// Glyph stats: vec2<f32> per glyph (sumG, sumG2)
		const glyphStatsData = new Float32Array(numGlyphs * 2);
		for (let i = 0; i < numGlyphs; i++) {
			glyphStatsData[i * 2] = glyphs[i].sumG;
			glyphStatsData[i * 2 + 1] = glyphs[i].sumG2;
		}
		const glyphStatsBuffer = device.createBuffer({
			size: glyphStatsData.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});
		device.queue.writeBuffer(glyphStatsBuffer, 0, glyphStatsData);

		// Uniforms (8 × u32 = 32 bytes, aligned to 16)
		const uniformData = new Uint32Array([
			png.width,
			png.height,
			gridWidth,
			gridHeight,
			glyphW,
			glyphH,
			numGlyphs,
			numGridPoints,
		]);
		const uniformBuffer = device.createBuffer({
			size: uniformData.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});
		device.queue.writeBuffer(uniformBuffer, 0, uniformData);

		// Grid points: array of (brightness, contrast) pairs
		const gridPointsData = new Float32Array(numGridPoints * 2);
		for (let i = 0; i < numGridPoints; i++) {
			gridPointsData[i * 2] = gridPoints[i].brightness;
			gridPointsData[i * 2 + 1] = gridPoints[i].contrast;
		}
		const gridPointsBuffer = device.createBuffer({
			size: Math.max(gridPointsData.byteLength, 8),
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});
		device.queue.writeBuffer(gridPointsBuffer, 0, gridPointsData);

		// Output buffer
		const outputSize = totalItems * 4;
		const outputBuffer = device.createBuffer({
			size: outputSize,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
		});

		// Staging buffer for readback
		const stagingBuffer = device.createBuffer({
			size: outputSize,
			usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
		});

		// Bind group
		const bindGroup = device.createBindGroup({
			layout: pipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: { buffer: imageBuffer } },
				{ binding: 1, resource: { buffer: glyphLumBuffer } },
				{ binding: 2, resource: { buffer: glyphStatsBuffer } },
				{ binding: 3, resource: { buffer: uniformBuffer } },
				{ binding: 4, resource: { buffer: gridPointsBuffer } },
				{ binding: 5, resource: { buffer: outputBuffer } },
			],
		});

		// Encode and submit
		const commandEncoder = device.createCommandEncoder();
		const passEncoder = commandEncoder.beginComputePass();
		passEncoder.setPipeline(pipeline);
		passEncoder.setBindGroup(0, bindGroup);
		passEncoder.dispatchWorkgroups(Math.ceil(totalItems / WORKGROUP_SIZE));
		passEncoder.end();
		commandEncoder.copyBufferToBuffer(
			outputBuffer,
			0,
			stagingBuffer,
			0,
			outputSize,
		);
		device.queue.submit([commandEncoder.finish()]);

		// Read back results
		await stagingBuffer.mapAsync(GPUMapMode.READ);
		const result = new Uint32Array(stagingBuffer.getMappedRange().slice(0));
		stagingBuffer.unmap();

		// Cleanup
		imageBuffer.destroy();
		glyphLumBuffer.destroy();
		glyphStatsBuffer.destroy();
		uniformBuffer.destroy();
		gridPointsBuffer.destroy();
		outputBuffer.destroy();
		stagingBuffer.destroy();

		return result;
	}

	private indicesToString(
		indices: Uint32Array,
		glyphs: GlyphEntry[],
		width: number,
		height: number,
		offset = 0,
	): string {
		const lines: string[] = [];
		for (let row = 0; row < height; row++) {
			let line = "";
			for (let col = 0; col < width; col++) {
				line += glyphs[indices[offset + row * width + col]].char;
			}
			lines.push(line);
		}
		return lines.join("\n");
	}

	async renderAscii(
		png: RawImage,
		width: number,
		glyphs: GlyphEntry[],
		distance_fn: keyof typeof DISTANCE_FNS,
		brightness = 0,
		contrast = 1,
	): Promise<string> {
		const cell_width = Math.floor(png.width / width);
		const cell_height = Math.ceil(cell_width / FONT_RATIO);
		const height = Math.round(png.height / cell_height);

		const indices = await this.dispatch(
			png,
			glyphs,
			[{ brightness, contrast }],
			distance_fn,
			width,
			height,
		);

		return this.indicesToString(indices, glyphs, width, height);
	}

	async *estimateAscii(
		png: RawImage,
		width: number,
		canvasFactory: CanvasFactory,
		evaluate_fn: keyof typeof EVALUTATE_FNS,
		distance_fn: keyof typeof DISTANCE_FNS,
	): AsyncGenerator<string, string> {
		const cell_width = Math.floor(png.width / width);
		const cell_height = Math.ceil(cell_width / FONT_RATIO);
		const height = Math.round(png.height / cell_height);
		const glyphs = createCharacterPortraits(cell_height, canvasFactory);
		const totalCells = width * height;

		function evaluate(ascii: string): number {
			return EVALUTATE_FNS[evaluate_fn](
				ascii
					.split("")
					.filter((x) => x !== "\n")
					.map((x) => ASCII_CHARS.indexOf(x)),
			);
		}

		// Phase 1: Coarse grid search — all 121 points in one GPU dispatch
		const cSteps = 10,
			bSteps = 10;
		const cMin = 0.5,
			cMax = 8;
		const bMin = -0.5,
			bMax = 0.5;

		const gridPoints: { brightness: number; contrast: number }[] = [];
		for (let ci = 0; ci <= cSteps; ci++) {
			for (let bi = 0; bi <= bSteps; bi++) {
				const c = cMin + ((cMax - cMin) * ci) / cSteps;
				const b = bMin + ((bMax - bMin) * bi) / bSteps;
				gridPoints.push({ brightness: b, contrast: c });
			}
		}

		const coarseIndices = await this.dispatch(
			png,
			glyphs,
			gridPoints,
			distance_fn,
			width,
			height,
		);

		// Evaluate each grid point on CPU
		let bestF = -Infinity;
		let bestAscii = "";
		let bestC = 4;
		let bestB = 0.1;

		for (let i = 0; i < gridPoints.length; i++) {
			const ascii = this.indicesToString(
				coarseIndices,
				glyphs,
				width,
				height,
				i * totalCells,
			);
			const val = evaluate(ascii);
			if (val > bestF) {
				bestF = val;
				bestAscii = ascii;
				bestC = gridPoints[i].contrast;
				bestB = gridPoints[i].brightness;
			}
		}

		yield bestAscii;

		// Phase 2: Refine around the best point — 25 points in one dispatch
		const cRadius = (cMax - cMin) / cSteps / 2;
		const bRadius = (bMax - bMin) / bSteps / 2;
		const refinePoints: { brightness: number; contrast: number }[] = [];

		for (let ci = -2; ci <= 2; ci++) {
			for (let bi = -2; bi <= 2; bi++) {
				const c = Math.max(cMin, Math.min(cMax, bestC + ci * cRadius));
				const b = Math.max(bMin, Math.min(bMax, bestB + bi * bRadius));
				refinePoints.push({ brightness: b, contrast: c });
			}
		}

		const refineIndices = await this.dispatch(
			png,
			glyphs,
			refinePoints,
			distance_fn,
			width,
			height,
		);

		for (let i = 0; i < refinePoints.length; i++) {
			const ascii = this.indicesToString(
				refineIndices,
				glyphs,
				width,
				height,
				i * totalCells,
			);
			const val = evaluate(ascii);
			if (val > bestF) {
				bestF = val;
				bestAscii = ascii;
				bestC = refinePoints[i].contrast;
				bestB = refinePoints[i].brightness;
			}
		}

		console.log(
			`Final -- Contrast ${bestC}, Brightness ${bestB}, Total ${bestF}`,
		);

		yield bestAscii;
		return bestAscii;
	}

	async pngToAscii(
		png: RawImage,
		width: number,
		canvasFactory: CanvasFactory,
		distance_fn: keyof typeof DISTANCE_FNS,
	): Promise<string> {
		const cell_width = Math.floor(png.width / width);
		const cell_height = Math.ceil(cell_width / FONT_RATIO);
		const glyphs = createCharacterPortraits(cell_height, canvasFactory);
		return this.renderAscii(png, width, glyphs, distance_fn);
	}

	destroy(): void {
		this.device.destroy();
	}
}
