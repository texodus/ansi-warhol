import * as fs from "fs";
import { PNG } from "pngjs";
import { createCanvas } from "canvas";
import { adjustImage } from "./utils";

const BLOCK_ELEMENTS = "▀▁▂▃▄▅▆▇█▉▊▋▌▍▎▏▐░▒▓▕▖▗▘▙▚▛▜▝▞▟";
const GEOMETRIC_SHAPES = "■□▢▣▤▥▦▧▨▩▪▫▬▭▮▯▰▱▲△▴▵▶▷▸▹►▻▼▽▾▿◀◁◂◃◄◅◆◇◈◉◊○◌◍◎●◐◑◒◓◔◕◖◗◘◙◚◛◜◝◞◟◠◡◢◣◤◥◦◧◨◩◪◫◬◭◮◯◰◱◲◳◴◵◶◷◸◹◺◻◼◽◾◿";
const MISC_SYMBOLS = "☀☁☂☃☄★☆☇☈☉☊☋☌☍☎☏☐☑☒☓☔☕☖☗☘☙☚☛☜☝☞☟☠☡☢☣☤☥☦☧☨☩☪☫☬☭☮☯☰☱☲☳☴☵☶☷☸☹☺☻☼☽☾☿♀♁♂♃♄♅♆♇♈♉♊♋♌♍♎♏♐♑♒♓♔♕♖♗♘♙♚♛♜♝♞♟♠♡♢♣♤♥♦♧♨♩♪♫♬♭♮♯♰♱♲♳♴♵♶♷♸♹♺♻♼♽♾♿⚀⚁⚂⚃⚄⚅⚆⚇⚈⚉⚊⚋⚌⚍⚎⚏⚐⚑⚒⚓⚔⚕⚖⚗⚘⚙⚚⚛⚜⚝⚞⚟⚠⚡⚢⚣⚤⚥⚦⚧⚨⚩⚪⚫⚬⚭⚮⚯⚰⚱⚲⚳⚴⚵⚶⚷⚸⚹⚺⚻⚼⚽⚾⚿⛀⛁⛂⛃⛄⛅⛆⛇⛈⛉⛊⛋⛌⛍⛎⛏⛐⛑⛒⛓⛔⛕⛖⛗⛘⛙⛚⛛⛜⛝⛞⛟⛠⛡⛢⛣⛤⛥⛦⛧⛨⛩⛪⛫⛬⛭⛮⛯⛰⛱⛲⛳⛴⛵⛶⛷⛸⛹⛺⛻⛼⛽⛾⛿";
const DINGBATS = "✀✁✂✃✄✅✆✇✈✉✊✋✌✍✎✏✐✑✒✓✔✕✖✗✘✙✚✛✜✝✞✟✠✡✢✣✤✥✦✧✨✩✪✫✬✭✮✯✰✱✲✳✴✵✶✷✸✹✺✻✼✽✾✿❀❁❂❃❄❅❆❇❈❉❊❋❌❍❎❏❐❑❒❓❔❕❖❗❘❙❚❛❜❝❞❟❠❡❢❣❤❥❦❧❨❩❪❫❬❭❮❯❰❱❲❳❴❵❶❷❸❹❺❻❼❽❾❿➀➁➂➃➄➅➆➇➈➉➊➋➌➍➎➏➐➑➒➓➔➕➖➗➘➙➚➛➜➝➞➟➠➡➢➣➤➥➦➧➨➩➪➫➬➭➮➯➰➱➲➳➴➵➶➷➸➹➺➻➼➽➾➿";
const MATH_OPERATORS = "∀∁∂∃∄∅∆∇∈∉∊∋∌∍∎∏∐∑−∓∔∕∖∗∘∙√∛∜∝∞∟∠∡∢∣∤∥∦∧∨∩∪∫∬∭∮∯∰∱∲∳∴∵∶∷∸∹∺∻∼∽∾∿≀≁≂≃≄≅≆≇≈≉≊≋≌≍≎≏≐≑≒≓≔≕≖≗≘≙≚≛≜≝≞≟≠≡≢≣≤≥≦≧≨≩≪≫≬≭≮≯≰≱≲≳≴≵≶≷≸≹≺≻≼≽≾≿⊀⊁⊂⊃⊄⊅⊆⊇⊈⊉⊊⊋⊌⊍⊎⊏⊐⊑⊒⊓⊔⊕⊖⊗⊘⊙⊚⊛⊜⊝⊞⊟⊠⊡⊢⊣⊤⊥⊦⊧⊨⊩⊪⊫⊬⊭⊮⊯⊰⊱⊲⊳⊴⊵⊶⊷⊸⊹⊺⊻⊼⊽⊾⊿⋀⋁⋂⋃⋄⋅⋆⋇⋈⋉⋊⋋⋌⋍⋎⋏⋐⋑⋒⋓⋔⋕⋖⋗⋘⋙⋚⋛⋜⋝⋞⋟⋠⋡⋢⋣⋤⋥⋦⋧⋨⋩⋪⋫⋬⋭⋮⋯⋰⋱⋲⋳⋴⋵⋶⋷⋸⋹⋺⋻⋼⋽⋾⋿";
const BOX_DRAWING = "─━│┃┄┅┆┇┈┉┊┋┌┍┎┏┐┑┒┓└┕┖┗┘┙┚┛├┝┞┟┠┡┢┣┤┥┦┧┨┩┪┫┬┭┮┯┰┱┲┳┴┵┶┷┸┹┺┻┼┽┾┿╀╁╂╃╄╅╆╇╈╉╊╋╌╍╎╏═║╒╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡╢╣╤╥╦╧╨╩╪╫╬╭╮╯╰╱╲╳╴╵╶╷╸╹╺╻╼╽╾╿";
const BRAILLE = "⠀⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿⡀⡁⡂⡃⡄⡅⡆⡇⡈⡉⡊⡋⡌⡍⡎⡏⡐⡑⡒⡓⡔⡕⡖⡗⡘⡙⡚⡛⡜⡝⡞⡟⡠⡡⡢⡣⡤⡥⡦⡧⡨⡩⡪⡫⡬⡭⡮⡯⡰⡱⡲⡳⡴⡵⡶⡷⡸⡹⡺⡻⡼⡽⡾⡿⢀⢁⢂⢃⢄⢅⢆⢇⢈⢉⢊⢋⢌⢍⢎⢏⢐⢑⢒⢓⢔⢕⢖⢗⢘⢙⢚⢛⢜⢝⢞⢟⢠⢡⢢⢣⢤⢥⢦⢧⢨⢩⢪⢫⢬⢭⢮⢯⢰⢱⢲⢳⢴⢵⢶⢷⢸⢹⢺⢻⢼⢽⢾⢿⣀⣁⣂⣃⣄⣅⣆⣇⣈⣉⣊⣋⣌⣍⣎⣏⣐⣑⣒⣓⣔⣕⣖⣗⣘⣙⣚⣛⣜⣝⣞⣟⣠⣡⣢⣣⣤⣥⣦⣧⣨⣩⣪⣫⣬⣭⣮⣯⣰⣱⣲⣳⣴⣵⣶⣷⣸⣹⣺⣻⣼⣽⣾⣿";
const SHADE_CHARS = " ░▒▓█";
const CJK_STROKES = "㇀㇁㇂㇃㇄㇅㇆㇇㇈㇉㇊㇋㇌㇍㇎㇏㇐㇑㇒㇓㇔㇕㇖㇗㇘㇙㇚㇛㇜㇝㇞㇟";
const ASCII_CHARS = " " + GEOMETRIC_SHAPES + BRAILLE + CJK_STROKES + BOX_DRAWING + BLOCK_ELEMENTS;

const FONT_RATIO = 0.4;

function sumOfSquares(png: PNG, glyph: PNG, x0: number, y0: number, regionW: number, regionH: number): number {
    let dist = 0;
    for (let gy = 0; gy < glyph.height; gy++) {
        const srcY = y0 + Math.floor((gy / glyph.height) * regionH);
        for (let gx = 0; gx < glyph.width; gx++) {
            const srcX = x0 + Math.floor((gx / glyph.width) * regionW);
            const srcIdx = (png.width * srcY + srcX) * 4;
            const srcLum =
                0.299 * png.data[srcIdx] +
                0.587 * png.data[srcIdx + 1] +
                0.114 * png.data[srcIdx + 2];
            const glyphIdx = (glyph.width * gy + gx) * 4;
            const glyphLum =
                0.299 * glyph.data[glyphIdx] +
                0.587 * glyph.data[glyphIdx + 1] +
                0.114 * glyph.data[glyphIdx + 2];
            const d = srcLum - glyphLum;
            dist += d * d;
        }
    }


    return dist;
}

function sumOfAbsDiffs(png: PNG, glyph: PNG, x0: number, y0: number, regionW: number, regionH: number): number {
    let dist = 0;
    for (let gy = 0; gy < glyph.height; gy++) {
        const srcY = y0 + Math.floor((gy / glyph.height) * regionH);
        for (let gx = 0; gx < glyph.width; gx++) {
            const srcX = x0 + Math.floor((gx / glyph.width) * regionW);
            const srcIdx = (png.width * srcY + srcX) * 4;
            const srcLum =
                0.299 * png.data[srcIdx] +
                0.587 * png.data[srcIdx + 1] +
                0.114 * png.data[srcIdx + 2];
            const glyphIdx = (glyph.width * gy + gx) * 4;
            const glyphLum =
                0.299 * glyph.data[glyphIdx] +
                0.587 * glyph.data[glyphIdx + 1] +
                0.114 * glyph.data[glyphIdx + 2];
            const d = Math.abs(srcLum - glyphLum);
            dist += d;
        }
    }


    return dist;
}

function normalizedCrossCorrelation(png: PNG, glyph: PNG, x0: number, y0: number, regionW: number, regionH: number): number {
    let sumSrc = 0, sumGlyph = 0;
    let sumSrc2 = 0, sumGlyph2 = 0, sumSrcGlyph = 0;
    let n = 0;

    for (let gy = 0; gy < glyph.height; gy++) {
        const srcY = y0 + Math.floor((gy / glyph.height) * regionH);
        for (let gx = 0; gx < glyph.width; gx++) {
            const srcX = x0 + Math.floor((gx / glyph.width) * regionW);
            const srcIdx = (png.width * srcY + srcX) * 4;
            const s = 0.299 * png.data[srcIdx] + 0.587 * png.data[srcIdx + 1] + 0.114 * png.data[srcIdx + 2];
            const glyphIdx = (glyph.width * gy + gx) * 4;
            const g = 0.299 * glyph.data[glyphIdx] + 0.587 * glyph.data[glyphIdx + 1] + 0.114 * glyph.data[glyphIdx + 2];
            sumSrc += s;
            sumGlyph += g;
            sumSrc2 += s * s;
            sumGlyph2 += g * g;
            sumSrcGlyph += s * g;
            n++;
        }
    }

    const numerator = n * sumSrcGlyph - sumSrc * sumGlyph;
    const denom = Math.sqrt((n * sumSrc2 - sumSrc * sumSrc) * (n * sumGlyph2 - sumGlyph * sumGlyph));
    if (denom === 0) return 0;
    return -(numerator / denom); // negate so lower = better match
}

function ssimLite(png: PNG, glyph: PNG, x0: number, y0: number, regionW: number, regionH: number): number {
    let sumS = 0, sumG = 0, sumS2 = 0, sumG2 = 0, sumSG = 0;
    let n = 0;

    for (let gy = 0; gy < glyph.height; gy++) {
        const srcY = y0 + Math.floor((gy / glyph.height) * regionH);
        for (let gx = 0; gx < glyph.width; gx++) {
            const srcX = x0 + Math.floor((gx / glyph.width) * regionW);
            const srcIdx = (png.width * srcY + srcX) * 4;
            const s = 0.299 * png.data[srcIdx] + 0.587 * png.data[srcIdx + 1] + 0.114 * png.data[srcIdx + 2];
            const glyphIdx = (glyph.width * gy + gx) * 4;
            const g = 0.299 * glyph.data[glyphIdx] + 0.587 * glyph.data[glyphIdx + 1] + 0.114 * glyph.data[glyphIdx + 2];
            sumS += s; sumG += g;
            sumS2 += s * s; sumG2 += g * g;
            sumSG += s * g;
            n++;
        }
    }

    const muS = sumS / n, muG = sumG / n;
    const sigS2 = sumS2 / n - muS * muS;
    const sigG2 = sumG2 / n - muG * muG;
    const sigSG = sumSG / n - muS * muG;
    const C1 = 6.5025, C2 = 58.5225; // (0.01*255)^2, (0.03*255)^2

    const ssim = ((2 * muS * muG + C1) * (2 * sigSG + C2)) /
        ((muS * muS + muG * muG + C1) * (sigS2 + sigG2 + C2));

    return -ssim; // negate: higher SSIM = better, but we want lower = better
}

function histogramIntersection(png: PNG, glyph: PNG, x0: number, y0: number, regionW: number, regionH: number): number {
    const BINS = 16;
    const srcHist = new Float64Array(BINS);
    const glyphHist = new Float64Array(BINS);

    for (let gy = 0; gy < glyph.height; gy++) {
        const srcY = y0 + Math.floor((gy / glyph.height) * regionH);
        for (let gx = 0; gx < glyph.width; gx++) {
            const srcX = x0 + Math.floor((gx / glyph.width) * regionW);
            const srcIdx = (png.width * srcY + srcX) * 4;
            const s = 0.299 * png.data[srcIdx] + 0.587 * png.data[srcIdx + 1] + 0.114 * png.data[srcIdx + 2];
            const glyphIdx = (glyph.width * gy + gx) * 4;
            const g = 0.299 * glyph.data[glyphIdx] + 0.587 * glyph.data[glyphIdx + 1] + 0.114 * glyph.data[glyphIdx + 2];
            srcHist[Math.min(BINS - 1, Math.floor(s / 255 * BINS))]++;
            glyphHist[Math.min(BINS - 1, Math.floor(g / 255 * BINS))]++;
        }
    }

    // Normalize
    const n = glyph.width * glyph.height;
    let intersection = 0;
    for (let i = 0; i < BINS; i++) {
        intersection += Math.min(srcHist[i] / n, glyphHist[i] / n);
    }

    return -intersection; // negate: higher intersection = better
}

const mode = "SUM_OF_SQUARES";

function samplePixel(
    png: PNG,
    deck: Record<string, PNG>,
    x: number,
    y: number,
    width: number,
    height: number
): string {

    const x0 = Math.floor((x / width) * png.width);
    const x1 = Math.floor(((x + 1) / width) * png.width);
    const y0 = Math.floor((y / height) * png.height);
    const y1 = Math.floor(((y + 1) / height) * png.height);
    const regionW = x1 - x0;
    const regionH = y1 - y0;

    let bestKey = " ";
    let bestDist = Infinity;

    for (const [key, glyph] of Object.entries(deck)) {
        const dist = histogramIntersection(png, glyph, x0, y0, regionW, regionH);
        if (dist < bestDist) {
            bestDist = dist;
            bestKey = key;
        }

    }

    return bestKey;
}


export function createCharacterPortraits(scale: number): Record<string, PNG> {
    const canvas = createCanvas(scale * FONT_RATIO, scale);
    const ctx = canvas.getContext("2d");
    ctx.font = `${scale}px JetBrains Mono`;
    let base = ctx.measureText(" ").width;
    return [...ASCII_CHARS].reduce((acc: Record<string, PNG>, ch) => {
        if (ctx.measureText(ch).width !== base) {
            return acc;
        }

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, scale * FONT_RATIO, scale);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ch, (scale * FONT_RATIO) / 2, scale / 2);
        const imageData = ctx.getImageData(0, 0, scale * FONT_RATIO, scale);
        const png = new PNG({ width: scale * FONT_RATIO, height: scale });
        Buffer.from(imageData.data.buffer).copy(png.data);
        acc[ch] = png;
        return acc;
    }, {});
}

export function pngToAscii(png: PNG, width: number): string {
    png = adjustImage(png, 0, 0, 1);

    fs.writeFileSync("debug.png", PNG.sync.write(png));
    const cell_width = Math.floor(png.width / width);
    const cell_height = Math.ceil(cell_width / FONT_RATIO);

    const height = Math.round(png.height / cell_height); // ??
    console.log(`Palette cell size ${cell_width}w * ${cell_height}h`);
    console.log(`Output size ${width}w (fixed) * ${height}h`);
    const deck = createCharacterPortraits(cell_height);
    // png = deck["∑"];


    const lines: string[] = [];
    for (let row = 0; row < height; row++) {
        let line = "";
        for (let col = 0; col < width; col++) {
            line += samplePixel(png, deck, col, row, width, height);
        }
        lines.push(line);
    }
    return lines.join("\n");
}
