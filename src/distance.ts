const SSIM_C1 = 6.5025; // (0.01*255)^2
const SSIM_C2 = 58.5225; // (0.03*255)^2

const HIST_BINS = 16;


export interface GlyphEntry {
    char: string;
    lum: Float32Array;
    width: number;
    height: number;
    sumG: number;
    sumG2: number;
}


export function histogramIntersection(
    glyph: GlyphEntry,
    srcLum: Float32Array,
    n: number,
    ...args: any[]
): number {
    const srcHist = new Float64Array(HIST_BINS);
    const glyphHist = new Float64Array(HIST_BINS);
    const glyphLum = glyph.lum;
    for (let i = 0; i < n; i++) {
        srcHist[Math.min(HIST_BINS - 1, ((srcLum[i] / 255) * HIST_BINS) | 0)]++;
        glyphHist[Math.min(HIST_BINS - 1, ((glyphLum[i] / 255) * HIST_BINS) | 0)]++;
    }

    let intersection = 0;
    for (let i = 0; i < HIST_BINS; i++) {
        intersection += Math.min(srcHist[i] / n, glyphHist[i] / n);
    }

    return -intersection;
}

export function ssimDistance(
    glyph: GlyphEntry,
    srcLum: Float32Array,
    n: number,
    muS: number,
    muS2: number,
    sigS2: number,
): number {
    let sumSG = 0;
    const glyphLum = glyph.lum;
    for (let i = 0; i < n; i++) {
        sumSG += srcLum[i] * glyphLum[i];
    }

    const muG = glyph.sumG / n;
    const sigG2 = glyph.sumG2 / n - muG * muG;
    const sigSG = sumSG / n - muS * muG;
    return (
        -((2 * muS * muG + SSIM_C1) * (2 * sigSG + SSIM_C2)) /
        ((muS2 + muG * muG + SSIM_C1) * (sigS2 + sigG2 + SSIM_C2))
    );
}
