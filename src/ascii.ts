import type { CanvasFactory } from "./canvas-factory";
import { DISTANCE_FNS, type GlyphEntry, } from "./distance";
import { EVALUTATE_FNS } from "./evaluate";
import type { RawImage } from "./types";

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
    png: RawImage,
    glyphs: GlyphEntry[],
    x: number,
    y: number,
    width: number,
    height: number,
    distance_fn: keyof typeof DISTANCE_FNS,
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
        const dist = DISTANCE_FNS[distance_fn](glyphs[gi], srcLum, n, muS, muS2, sigS2);
        if (dist < bestDist) {
            bestDist = dist;
            bestChar = glyphs[gi].char;
        }
    }

    return bestChar;
}

// Optimization 1: pre-compute luminance arrays and SSIM stats per glyph
export function createCharacterPortraits(
    scale: number,
    canvasFactory: CanvasFactory,
): GlyphEntry[] {
    const w = Math.floor(scale * FONT_RATIO);
    const h = scale;
    const ctx = canvasFactory(w, h);
    ctx.font = `${scale}px JetBrains Mono`;
    const base = Math.floor(ctx.measureText(" ").width);
    const glyphs: GlyphEntry[] = [];

    for (const ch of ASCII_CHARS) {
        if (Math.floor(ctx.measureText(ch).width) !== base) {
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
    png: RawImage,
    width: number,
    glyphs: GlyphEntry[],
    distance_fn: keyof typeof DISTANCE_FNS,
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
                distance_fn,
                brightness,
                contrast,
            );
        }
        lines.push(line);
    }
    return lines.join("\n");
}


export function* estimateAscii(
    png: RawImage,
    width: number,
    canvasFactory: CanvasFactory,
    evaluate_fn: keyof typeof EVALUTATE_FNS,
    distance_fn: keyof typeof DISTANCE_FNS,
): Generator<string> {
    const cell_width = Math.floor(png.width / width);
    const cell_height = Math.ceil(cell_width / FONT_RATIO);
    const glyphs = createCharacterPortraits(cell_height, canvasFactory);

    let contrast = 4;
    let brightness = 0.1;
    let ascii = "";

    // Optimization 3: brightness/contrast passed to renderAscii instead of allocating
    // a new image on every iteration
    function f(c: number, b: number): number {
        ascii = renderAscii(png, width, glyphs, distance_fn, b, c);
        return EVALUTATE_FNS[evaluate_fn](ascii.split("").map((x) => ASCII_CHARS.indexOf(x)));
    }

    const fc = f(contrast, brightness);
    yield ascii;
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
            yield ascii;
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
            yield ascii;
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
    const result = renderAscii(png, width, glyphs, distance_fn, brightness, contrast,);
    return result;
}

export function pngToAscii(
    png: RawImage,
    width: number,
    canvasFactory: CanvasFactory,
    distance_fn: keyof typeof DISTANCE_FNS
): string {
    const cell_width = Math.floor(png.width / width);
    const cell_height = Math.ceil(cell_width / FONT_RATIO);
    const height = Math.round(png.height / cell_height);
    console.log(`Palette cell size ${cell_width}w * ${cell_height}h`);
    console.log(`Output size ${width}w (fixed) * ${height}h`);
    const glyphs = createCharacterPortraits(cell_height, canvasFactory);
    return renderAscii(png, width, glyphs, distance_fn);
}
