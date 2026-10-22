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

/// <reference types="@webgpu/types" />

import {
	ASCII_CHARS,
	measureFontRatio,
	type PreparedRender,
	prepareRender,
	preparedColors,
	preparedStats,
} from "./ascii";
import type { CanvasFactory } from "./canvas-factory";
import type { DISTANCE_FNS, GlyphEntry } from "./distance";
import { EVALUTATE_FNS } from "./evaluate";
import type { AsciiResult, AsciiStats, RawImage } from "./types";

const WORKGROUP_SIZE = 64;

const DISTANCE_FN_IDS: Record<string, number> = {
	SSIM: 0,
	HISTOGRAM: 1,
	SUM_OF_SQUARES: 2,
	SUM_OF_ABS_DIFF: 3,
	MINIMIZE_CROSS_CORRELATION: 4,
};

//  ▆◘◘◘◘▛███████▇██▇▇▇▇▟▙●◉●▟▇▆▇▇▇███▇███████████████████████████████████▛▇████
//  ▟▙◘▦∄⋠◘▇▇██▇██▇▇▇▇▛▛▇▇▇▇▇██▇███▇▇▇▇▆◙▟▇▇▙▇▓▇▇▇▇▇▇▇██████████████████████████
//  ◘◘▙∄≵◛◖◕◘▙▇◙▇▇▇▇▇█▇▇▇▇▇▆●●▆▙●◘▇▇■▩▇●▇◘▇●●◘▙█▇▇▇▇█▇▇▇▇▇▇▇▇▇▇▇████████████████
//  ●▦⊗≨⋧≵∱⋞◉◘▆▇██▇▇▇▇█▇▆◘●◘●≑◆◕◓▶◖◚◓◤◖◕∃∄≄≵◓◔◚◚∁∄⊂◚■◘◘▇█▇█▇▇███▇▇▆▙▓▇██████████
//  ∄⊝≩◓●◘▆▇▇██▙◘▇▙▙▋▆▋◘●≋≎●●●▟▇▇▇▛▆▆▆▇▇▇▇▇▇▇▇▇▆▜◘●◕▝∻►◢▰◢∄●▆█▇▇███▇▇▇▇▇▇▇██████
//  ◘▆▇▇████▇▇▆▇▙◘●∐∄∄◘◘▛▇▇▇▇▙◘∄◚∄▀▀●●▅▆▇█████████▇▇▇▇▇◘▟●◚◓≵≑∶◢●▇▇█████████████
//  ███▇▆▆▙◘●◘■●●◕◛◘▇▇▇▇▆▙◘▩◚⋨◕≹⊗∛◯◯≔≎∶∕∼◞∁▆▇████████████▇▇▇▇▙▅▲▗∖≵▲◕●◘▆▇▇██████
//  █▇██▇●●●◕≵≋◗▆◙▆▇▇▇◘◼●◘▟◘▦≹⊈⊙⋽∅⊚⋩⋚≨∇∛◎≎≁∕≒◚▇███████████████▇▆▇▆●►╲∼≻◆▟▇▇▇▇███
//  ▇▟◘∄◥◛●◆≋∁◘▇▇▇██▇▇▇▆■≨≹∄⋟≨⊚⊈≋≴⋡≹≹⋡≨≹⋨≹⊙░⊝∕≻■█████████████████▇▆●◘∄∼⋅∷∻◛●▙▟▇▇
//  ▇▆∄◘●≵⊂≺◘▙◘▇██▜■▆▇▇▇▇▙▙◘⋨⋖⋅     ∵◓▦◘⋡◘◉≹⊈≎∵◜▇███████████████████▇◘◘●► ⋅┈≐▲≵●
//  █◘▇▟▩≋◕▛▛●▇██▇●⊁≎≹⋠⋡◉≨⋡▋◓         ▎◘▦⋩⊁▙◘⊗⋗ ▮█████████████████████▇◘◘◛∽ ∼∙◜∖
//  ●◛∄⋟⊝≨▙◙≹████◘◓∴∶∛⋩⊚≹≹≊∁∝╾▎        ◘≹≹◉◘◘≩⋻ ●███████████████████████▇▲◉≊   ⋅
//  ≽◛≄∕◡●█◘▇████●∁∴∕⋨⋠∛≹◘⋧ ┄    ⋅   ∽∄⋡⋡◉●◘▩≩◞▎██████████████████████████▖◘◘◖⋅∷
//  ●▆◘∼∶▛▓▋█████●⊙◖┄⋳≹◘≹◘◘∄≲◜   ⋅▘◘▙◘◘◘∄◘◘●≵≷●▇████████████████████████▇▟▩◕∙∼∶∁
//  ●●≊ ◢▓◘▆██████●⋞≎∅◉◘▆▩◘◘◘◘●◘▙◘●▙●≹⋡●◘◕●◘▇▇██████████████████████▇▇▆▅▲≐≐◓◕◘▙▇
//  ⋡◘◓∵◉█≹▟███████▆◘◘▙▙▆▋▟◘◘◛●◘▙▙▇▆▙◘◉≄⋳◶◕▆▇██████████████████▇█▇▆◘◕≊≵▀▅▆▇█▇███
//  ◉◘∁►∄█◘●██████████▇●⊙∶∻∨◛⋠≩≸≹●∄◉◕▼⋡▇██████████████▇▇▇▇▇▙▟◘●⋡▲◖◖■▆▇▇▇████████
//  ◘◘┄≎◘◘∉◘█████████████▆■▀◖▲◖▃◖◓▮●◘▇██▇▇▇▆▆▆▙▙◘◘▆▆◘◘◼◕◕◖●▅⋡▆▇▇▇███████████████
//  ▇▇◄◛▆≽▮▓██████████████▇▇▇▆◘■◘●■▙◘●░█▀█░█▀█░█▀▀░▀█▀░░░█░█░█▀█░█▀▄░█░█░█▀█░█░░
//  ██⋡≹◘█████▇███▇▇▇▇▆◘∄▙●◕■▮●▇▇▆▇▆█▇░█▀█░█░█░▀▀█░░█░░░░█▄█░█▀█░█▀▄░█▀█░█░█░█░░
//  ██▇●▆▇▇▇▆▙◘●∄◕∁◚∄≵●◘▇▇▇███████████░▀░▀░▀░▀░▀▀▀░▀▀▀░░░▀░▀░▀░▀░▀░▀░▀░▀░▀▀▀░▀▀▀

function createShaderCode(
	glyphN: number,
	distanceFn: keyof typeof DISTANCE_FNS,
): string {
	const distanceId = DISTANCE_FN_IDS[distanceFn] ?? 0;
	console.log(distanceId);
	return `
const GLYPH_N: u32 = ${glyphN}u;
const DISTANCE_FN: u32 = ${distanceId}u;
const SSIM_C1: f32 = 6.5025;
const SSIM_C2: f32 = 58.5225;
const HIST_BINS: u32 = 16u;

struct Uniforms {
    lum_width: u32,
    grid_width: u32,
    grid_height: u32,
    glyph_w: u32,
    glyph_h: u32,
    num_glyphs: u32,
    num_grid_points: u32,
    invert_image: u32,
};

struct GridPoint {
    brightness: f32,
    contrast: f32,
};

// Image luminance resampled so each cell is exactly glyph_w x glyph_h
@group(0) @binding(0) var<storage, read> lum: array<f32>;
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

    let base = row * uniforms.glyph_h * uniforms.lum_width + col * uniforms.glyph_w;

    // Compute source luminance for this cell
    var src_lum: array<f32, ${glyphN}>;
    var sum_s: f32 = 0.0;
    var sum_s2: f32 = 0.0;

    for (var gy: u32 = 0u; gy < uniforms.glyph_h; gy++) {
        let row_offset = base + gy * uniforms.lum_width;
        for (var gx: u32 = 0u; gx < uniforms.glyph_w; gx++) {
            var v = lum[row_offset + gx];
            v = ((v / 255.0 + bp.brightness - 0.5) * bp.contrast + 0.5) * 255.0;
            v = clamp(v, 0.0, 255.0);
            if (uniforms.invert_image != 0u) {
                v = 255.0 - v;
            }
            let i = gy * uniforms.glyph_w + gx;
            src_lum[i] = v;
            sum_s += v;
            sum_s2 += v * v;
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
        } else if (DISTANCE_FN == 1u) {
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
        } else if (DISTANCE_FN == 2u) {
            // Sum of squares distance
            let glyph_offset = gi * GLYPH_N;
            var ssd: f32 = 0.0;
            for (var i: u32 = 0u; i < GLYPH_N; i++) {
                let d = src_lum[i] - glyph_lum[glyph_offset + i];
                ssd += d * d;
            }
            dist = ssd;
        } else if (DISTANCE_FN == 3u) {
            // Sum of absolute differences
            let glyph_offset = gi * GLYPH_N;
            var sad: f32 = 0.0;
            for (var i: u32 = 0u; i < GLYPH_N; i++) {
                sad += abs(src_lum[i] - glyph_lum[glyph_offset + i]);
            }
            dist = sad;
        } else {
            // Minimize cross-correlation
            let glyph_offset = gi * GLYPH_N;
            var cc: f32 = 0.0;
            for (var i: u32 = 0u; i < GLYPH_N; i++) {
                cc += src_lum[i] * glyph_lum[glyph_offset + i];
            }
            dist = -cc;
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

		const device = await adapter.requestDevice({
			requiredLimits: {
				maxStorageBufferBindingSize: 4294967292,
			},
		});

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
		prep: PreparedRender,
		gridPoints: { brightness: number; contrast: number }[],
		distanceFn: keyof typeof DISTANCE_FNS,
		invertImage: boolean = false,
	): Promise<Uint32Array> {
		const device = this.device;
		const { glyphs, lum, lumWidth } = prep;
		const gridWidth = prep.geom.cols;
		const gridHeight = prep.geom.rows;
		const glyphW = glyphs[0].width;
		const glyphH = glyphs[0].height;
		const glyphN = glyphW * glyphH;
		const numGlyphs = glyphs.length;
		const numGridPoints = gridPoints.length;
		const totalCells = gridWidth * gridHeight;
		const totalItems = totalCells * numGridPoints;

		const pipeline = this.getPipeline(glyphN, distanceFn);

		// Resampled luminance buffer
		const imageBuffer = device.createBuffer({
			size: lum.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		});
		device.queue.writeBuffer(imageBuffer, 0, lum);

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

		// Uniforms (8 × u32 = 32 bytes)
		const uniformData = new Uint32Array([
			lumWidth,
			gridWidth,
			gridHeight,
			glyphW,
			glyphH,
			numGlyphs,
			numGridPoints,
			invertImage ? 1 : 0,
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
		prep: PreparedRender,
		distance_fn: keyof typeof DISTANCE_FNS,
		brightness = 0,
		contrast = 1,
		invertImage = false,
	): Promise<{
		ascii: string;
		stats: AsciiStats;
		colors?: Uint8ClampedArray;
	}> {
		const { geom, glyphs } = prep;
		const indices = await this.dispatch(
			prep,
			[{ brightness, contrast }],
			distance_fn,
			invertImage,
		);
		const ascii = this.indicesToString(indices, glyphs, geom.cols, geom.rows);
		return {
			ascii,
			stats: preparedStats(prep, ascii),
			colors: preparedColors(prep, indices),
		};
	}

	async *estimateAscii(
		png: RawImage,
		width: number,
		canvasFactory: CanvasFactory,
		evaluate_fn: keyof typeof EVALUTATE_FNS,
		distance_fn: keyof typeof DISTANCE_FNS,
		chars: string[] = ASCII_CHARS,
		fontRatio?: number,
		invertGlyphs: boolean = false,
		invertImage: boolean = false,
		fontName: string = "monospace",
		lineHeight: number | "normal" = "normal",
		color = false,
	): AsyncGenerator<AsciiResult, AsciiResult> {
		const ratio =
			fontRatio ?? measureFontRatio(canvasFactory, fontName, lineHeight);
		const prep = prepareRender(
			png,
			width,
			canvasFactory,
			chars,
			ratio,
			invertGlyphs,
			fontName,
			lineHeight,
			color,
		);
		const { glyphs } = prep;
		const height = prep.geom.rows;
		const totalCells = width * height;

		function evaluate(ascii: string): number {
			return EVALUTATE_FNS[evaluate_fn](
				ascii
					.split("")
					.filter((x) => x !== "\n")
					.map((x) => glyphs.findIndex((y) => y.char === x)),
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
			prep,
			gridPoints,
			distance_fn,
			invertImage,
		);

		// Evaluate each grid point on CPU
		let bestF = -Infinity;
		let bestAscii = "";
		let bestIndices = new Uint32Array(0);
		let bestOffset = 0;
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
				bestIndices = coarseIndices;
				bestOffset = i * totalCells;
				bestC = gridPoints[i].contrast;
				bestB = gridPoints[i].brightness;
			}
		}

		let stats = preparedStats(prep, bestAscii);
		let colors = preparedColors(prep, bestIndices, bestOffset);
		yield { ascii: bestAscii, brightness: bestB, contrast: bestC, stats, colors };

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
			prep,
			refinePoints,
			distance_fn,
			invertImage,
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
				bestIndices = refineIndices;
				bestOffset = i * totalCells;
				bestC = refinePoints[i].contrast;
				bestB = refinePoints[i].brightness;
			}
		}

		console.log(
			`Final -- Contrast ${bestC}, Brightness ${bestB}, Total ${bestF}`,
		);

		stats = preparedStats(prep, bestAscii);
		colors = preparedColors(prep, bestIndices, bestOffset);
		const best = {
			ascii: bestAscii,
			brightness: bestB,
			contrast: bestC,
			stats,
			colors,
		};
		yield best;
		return best;
	}

	async pngToAscii(
		png: RawImage,
		width: number,
		canvasFactory: CanvasFactory,
		distance_fn: keyof typeof DISTANCE_FNS,
		chars: string[] = ASCII_CHARS,
		fontRatio?: number,
		invertGlyphs: boolean = false,
		invertImage: boolean = false,
		brightness: number = 0,
		contrast: number = 1,
		fontName: string = "monospace",
		lineHeight: number | "normal" = "normal",
		color = false,
	): Promise<AsciiResult> {
		const ratio =
			fontRatio ?? measureFontRatio(canvasFactory, fontName, lineHeight);
		const prep = prepareRender(
			png,
			width,
			canvasFactory,
			chars,
			ratio,
			invertGlyphs,
			fontName,
			lineHeight,
			color,
		);
		const { ascii, stats, colors } = await this.renderAscii(
			prep,
			distance_fn,
			brightness,
			contrast,
			invertImage,
		);
		return { ascii, brightness, contrast, stats, colors };
	}

	destroy(): void {
		this.device.destroy();
	}
}
