import { PNG } from "pngjs";


/**
 * 
 * @param png
 * @param brightness offset added to each channel (e.g. 0.1 to brighten, -0.1 to darken)
 * @param saturation multiplier for color intensity (1 = unchanged, 0 = grayscale, >1 = oversaturated)
 * @param contrast multiplier around the midpoint (1 = unchanged, >1 = more contrast, <1 = flatter)
 * @returns a new PNG with the adjustments applied per-pixel
 */
export function adjustImage(
    png: PNG,
    brightness: number,
    saturation: number,
    contrast: number
): PNG {
    const out = new PNG({ width: png.width, height: png.height });
    png.data.copy(out.data);

    for (let i = 0; i < out.data.length; i += 4) {
        let r = out.data[i] / 255;
        let g = out.data[i + 1] / 255;
        let b = out.data[i + 2] / 255;

        // Brightness: shift values
        r += brightness;
        g += brightness;
        b += brightness;

        // Saturation: lerp toward luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        r = lum + saturation * (r - lum);
        g = lum + saturation * (g - lum);
        b = lum + saturation * (b - lum);

        // Contrast: scale around midpoint
        r = (r - 0.5) * contrast + 0.5;
        g = (g - 0.5) * contrast + 0.5;
        b = (b - 0.5) * contrast + 0.5;

        out.data[i] = Math.round(Math.min(1, Math.max(0, r)) * 255);
        out.data[i + 1] = Math.round(Math.min(1, Math.max(0, g)) * 255);
        out.data[i + 2] = Math.round(Math.min(1, Math.max(0, b)) * 255);
    }

    return out;
}
