import { createCanvas } from "canvas";
import * as fs from "fs";
import { PNG } from "pngjs";
import { type GlyphEntry, ssimDistance } from "./distance";

const BLOCK_ELEMENTS = "▀▁▂▃▄▅▆▇█▉▊▋▌▍▎▏▐░▒▓▕▖▗▘▙▚▛▜▝▞▟";
const GEOMETRIC_SHAPES = `■□▢▣▤▥▦▧▨▩▪▫▬▭▮▯▰▱▲△▴▵▶▷▸▹►▻▼▽▾▿◀◁◂◃◄◅◆◇◈◉◊○◌◍◎●◐◑◒◓◔◕◖◗◘◙◚◛◜◝◞◟◠◡◢◣◤◥◦◧◨◩
    ◪◫◬◭◮◯◰◱◲◳◴◵◶◷◸◹◺◻◼◽◾◿`;
const MATH_OPERATORS = `∀∁∂∃∄∅∆∇∈∉∊∋∌∍∎∏∐∑−∓∔∕∖∗∘∙√∛∜∝∞∟∠∡∢∣∤∥∦∧∨∩∪∫∬∭∮∯∰∱∲∳∴∵∶∷∸∹∺∻∼∽∾∿≀≁≂≃≄≅≆≇≈
    ≉≊≋≌≍≎≏≐≑≒≓≔≕≖≗≘≙≚≛≜≝≞≟≠≡≢≣≤≥≦≧≨≩≪≫≬≭≮≯≰≱≲≳≴≵≶≷≸≹≺≻≼≽≾≿⊀⊁⊂⊃⊄⊅⊆⊇⊈⊉⊊⊋⊌⊍⊎⊏⊐⊑⊒
    ⊓⊔⊕⊖⊗⊘⊙⊚⊛⊜⊝⊞⊟⊠⊡⊢⊣⊤⊥⊦⊧⊨⊩⊪⊫⊬⊭⊮⊯⊰⊱⊲⊳⊴⊵⊶⊷⊸⊹⊺⊻⊼⊽⊾⊿⋀⋁⋂⋃⋄⋅⋆⋇⋈⋉⋊⋋⋌⋍⋎⋏⋐⋑⋒⋓⋔⋕⋖⋗⋘⋙⋚⋛⋜
    ⋝⋞⋟⋠⋡⋢⋣⋤⋥⋦⋧⋨⋩⋪⋫⋬⋭⋮⋯⋰⋱⋲⋳⋴⋵⋶⋷⋸⋹⋺⋻⋼⋽⋾⋿`;
const BOX_DRAWING = `─━│┃┄┅┆┇┈┉┊┋┌┍┎┏┐┑┒┓└┕┖┗┘┙┚┛├┝┞┟┠┡┢┣┤┥┦┧┨┩┪┫┬┭┮┯┰┱┲┳┴┵┶┷┸┹┺┻┼┽┾┿╀╁╂╃╄╅╆╇╈
    ╉╊╋╌╍╎╏═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬╭╮╯╰╱╲╳╴╵╶╷╸╹╺╻╼╽╾╿`;
const BRAILLE = `⠀⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿⡀⡁⡂⡃⡄⡅⡆⡇⡈
    ⡉⡊⡋⡌⡍⡎⡏⡐⡑⡒⡓⡔⡕⡖⡗⡘⡙⡚⡛⡜⡝⡞⡟⡠⡡⡢⡣⡤⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿⢀⢁⢂⢃⢄⢅⢆⢇⢈⢉⢊⢋⢌⢍⢎⢏⢐⢑⢒
    ⢓⢔⢕⢖⢗⢘⢙⢚⢛⢜⢝⢞⢟⢠⢡⢢⢣⢤⢥⢦⢧⢨⢩⢪⢫⢬⢭⢮⢯⢰⢱⢲⢳⢴⢵⢶⢷⢸⢹⢺⢻⢼⢽⢾⢿⣀⣁⣂⣃⣄⣅⣆⣇⣈⣉⣊⣋⣌⣍⣎⣏⣐⣑⣒⣓⣔⣕⣖⣗⣘⣙⣚⣛⣜
    ⣝⣞⣟⣠⣡⣢⣣⣤⣥⣦⣧⣨⣩⣪⣫⣬⣭⣮⣯⣰⣱⣲⣳⣴⣵⣶⣷⣸⣹⣺⣻⣼⣽⣾⣿`;
const CJK_STROKES =
    "㇀㇁㇂㇃㇄㇅㇆㇇㇈㇉㇊㇋㇌㇍㇎㇏㇐㇑㇒㇓㇔㇕㇖㇗㇘㇙㇚㇛㇜㇝㇞㇟";

const ASCII_CHARS = [
    MATH_OPERATORS,
    GEOMETRIC_SHAPES,
    BRAILLE,
    CJK_STROKES,
    BOX_DRAWING,
    BLOCK_ELEMENTS,
]
    .flat()
    .join("")
    .split("")
    .filter((x) => x !== "\n");

const FONT_RATIO = 0.4;

function samplePixel(
    png: PNG,
    glyphs: GlyphEntry[],
    x: number,
    y: number,
    width: number,
    height: number,
    brightness: number = 0,
    contrast: number = 1,
): string {
    const x0 = Math.floor((x / width) * png.width);
    const x1 = Math.floor(((x + 1) / width) * png.width);
    const y0 = Math.floor((y / height) * png.height);
    const y1 = Math.floor(((y + 1) / height) * png.height);
    const regionW = x1 - x0;
    const regionH = y1 - y0;

    const glyphW = glyphs[0].width;
    const glyphH = glyphs[0].height;
    const n = glyphW * glyphH;

    // Optimization 2: compute source luminance patch once for all glyph comparisons
    const srcLum = new Float32Array(n);
    let sumS = 0,
        sumS2 = 0;
    for (let gy = 0; gy < glyphH; gy++) {
        const srcY = y0 + Math.floor((gy / glyphH) * regionH);
        for (let gx = 0; gx < glyphW; gx++) {
            const srcX = x0 + Math.floor((gx / glyphW) * regionW);
            const srcIdx = (png.width * srcY + srcX) * 4;
            // Optimization 3: apply brightness/contrast inline instead of adjustImage
            let lum =
                0.299 * png.data[srcIdx] +
                0.587 * png.data[srcIdx + 1] +
                0.114 * png.data[srcIdx + 2];
            lum = ((lum / 255 + brightness - 0.5) * contrast + 0.5) * 255;
            if (lum < 0) lum = 0;
            else if (lum > 255) lum = 255;
            const idx = gy * glyphW + gx;
            srcLum[idx] = lum;
            sumS += lum;
            sumS2 += lum * lum;
        }
    }

    let bestChar = " ";
    let bestDist = Infinity;
    const muS = sumS / n;
    const muS2 = muS * muS;
    const sigS2 = sumS2 / n - muS2;

    for (let gi = 0; gi < glyphs.length; gi++) {
        const dist = ssimDistance(glyphs[gi], srcLum, n, muS, muS2, sigS2);
        if (dist < bestDist) {
            bestDist = dist;
            bestChar = glyphs[gi].char;
        }
    }

    return bestChar;
}

// Optimization 1: pre-compute luminance arrays and SSIM stats per glyph
export function createCharacterPortraits(scale: number): GlyphEntry[] {
    const w = Math.floor(scale * FONT_RATIO);
    const h = scale;
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    ctx.font = `${scale}px JetBrains Mono`;
    const base = ctx.measureText(" ").width;
    const glyphs: GlyphEntry[] = [];

    for (const ch of ASCII_CHARS) {
        if (ctx.measureText(ch).width !== base) {
            continue;
        }

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ch, w / 2, h / 2);
        const imageData = ctx.getImageData(0, 0, w, h);

        const n = w * h;
        const lum = new Float32Array(n);
        let sumG = 0,
            sumG2 = 0;
        for (let i = 0; i < n; i++) {
            const idx = i * 4;
            const l =
                0.299 * imageData.data[idx] +
                0.587 * imageData.data[idx + 1] +
                0.114 * imageData.data[idx + 2];
            lum[i] = l;
            sumG += l;
            sumG2 += l * l;
        }

        glyphs.push({ char: ch, lum, width: w, height: h, sumG, sumG2 });
    }

    return glyphs;
}

function renderAscii(
    png: PNG,
    width: number,
    glyphs: GlyphEntry[],
    brightness: number = 0,
    contrast: number = 1,
): string {
    const cell_width = Math.floor(png.width / width);
    const cell_height = Math.ceil(cell_width / FONT_RATIO);
    const height = Math.round(png.height / cell_height);
    const lines: string[] = [];
    for (let row = 0; row < height; row++) {
        let line = "";
        for (let col = 0; col < width; col++) {
            line += samplePixel(
                png,
                glyphs,
                col,
                row,
                width,
                height,
                brightness,
                contrast,
            );
        }
        lines.push(line);
    }
    return lines.join("\n");
}

// function countUnique(s: number[]): number {
//     return ASCII_CHARS.length - new Set(s).size;
// }

// function chiSquaredGoF(xs: number[]): number {
//     const n = xs.length;
//     const counts = new Map<number, number>();
//     for (let i = 0; i < n; i++) {
//         counts.set(xs[i], (counts.get(xs[i]) || 0) + 1);
//     }
//     const k = counts.size;
//     const expected = n / k;
//     let chi2 = 0;
//     for (const observed of counts.values()) {
//         const d = observed - expected;
//         chi2 += (d * d) / expected;
//     }

//     return chi2;
// }

function kurtosis(xs: number[]): number {
    const n = xs.length;
    const mean = xs.reduce((a, b) => a + b, 0) / n;
    const m2 = xs.reduce((a, x) => a + (x - mean) ** 2, 0) / n;
    const m4 = xs.reduce((a, x) => a + (x - mean) ** 4, 0) / n;
    if (m2 === 0) return 0;
    return 0 - (m4 / (m2 * m2) - 3);
}

export function estimateAscii(png: PNG, width: number): string {
    const cell_width = Math.floor(png.width / width);
    const cell_height = Math.ceil(cell_width / FONT_RATIO);
    const glyphs = createCharacterPortraits(cell_height);

    let contrast = 4;
    let brightness = 0.1;

    // Optimization 3: brightness/contrast passed to renderAscii instead of allocating
    // a new PNG via adjustImage on every iteration
    function f(c: number, b: number): number {
        const ascii = renderAscii(png, width, glyphs, b, c);
        fs.writeFileSync("out_temp.txt", ascii);
        return kurtosis(ascii.split("").map((x) => ASCII_CHARS.indexOf(x)));
    }

    const fc = f(contrast, brightness);
    console.log(`Contrast ${contrast}, Brightness ${brightness}, Total ${fc}`);

    // Phase 1: Coarse grid search
    let bestC = contrast,
        bestB = brightness,
        bestF = fc;
    const cSteps = 10,
        bSteps = 10;
    const cMin = 0.5,
        cMax = 8;
    const bMin = -0.5,
        bMax = 0.5;

    for (let ci = 0; ci <= cSteps; ci++) {
        for (let bi = 0; bi <= bSteps; bi++) {
            const c = cMin + ((cMax - cMin) * ci) / cSteps;
            const b = bMin + ((bMax - bMin) * bi) / bSteps;
            const val = f(c, b);
            console.log(`  Search -- Contrast ${c}, Brightness ${b}, Total ${val}`);
            if (val > bestF) {
                bestF = val;
                bestC = c;
                bestB = b;
            }
        }
    }

    // Phase 2: Refine around the best point
    const cRadius = (cMax - cMin) / cSteps / 2;
    const bRadius = (bMax - bMin) / bSteps / 2;
    for (let ci = -2; ci <= 2; ci++) {
        for (let bi = -2; bi <= 2; bi++) {
            const c = Math.max(cMin, Math.min(cMax, bestC + ci * cRadius));
            const b = Math.max(bMin, Math.min(bMax, bestB + bi * bRadius));
            const val = f(c, b);
            console.log(`  Refine -- Contrast ${c}, Brightness ${b}, Total ${val}`);
            if (val > bestF) {
                bestF = val;
                bestC = c;
                bestB = b;
            }
        }
    }

    contrast = bestC;
    brightness = bestB;
    const val = f(contrast, brightness);
    console.log(
        `Final -- Contrast ${contrast}, Brightness ${brightness}, Total ${val}`,
    );
    const result = renderAscii(png, width, glyphs, brightness, contrast);
    return result;
}

export function pngToAscii(png: PNG, width: number): string {
    fs.writeFileSync("debug.png", PNG.sync.write(png));
    const cell_width = Math.floor(png.width / width);
    const cell_height = Math.ceil(cell_width / FONT_RATIO);
    const height = Math.round(png.height / cell_height);
    console.log(`Palette cell size ${cell_width}w * ${cell_height}h`);
    console.log(`Output size ${width}w (fixed) * ${height}h`);
    const glyphs = createCharacterPortraits(cell_height);
    return renderAscii(png, width, glyphs);
}
