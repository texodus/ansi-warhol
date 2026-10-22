var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/distance.ts
var SSIM_C1 = 6.5025;
var SSIM_C2 = 58.5225;
var HIST_BINS = 16;
function histogramIntersection(glyph, srcLum, n, ...args) {
  const srcHist = new Float64Array(HIST_BINS);
  const glyphHist = new Float64Array(HIST_BINS);
  const glyphLum = glyph.lum;
  for (let i = 0; i < n; i++) {
    srcHist[Math.min(HIST_BINS - 1, srcLum[i] / 255 * HIST_BINS | 0)]++;
    glyphHist[Math.min(HIST_BINS - 1, glyphLum[i] / 255 * HIST_BINS | 0)]++;
  }
  let intersection = 0;
  for (let i = 0; i < HIST_BINS; i++) {
    intersection += Math.min(srcHist[i] / n, glyphHist[i] / n);
  }
  return -intersection;
}
function ssimDistance(glyph, srcLum, n, muS, muS2, sigS2) {
  let sumSG = 0;
  const glyphLum = glyph.lum;
  for (let i = 0; i < n; i++) {
    sumSG += srcLum[i] * glyphLum[i];
  }
  const muG = glyph.sumG / n;
  const sigG2 = glyph.sumG2 / n - muG * muG;
  const sigSG = sumSG / n - muS * muG;
  return -((2 * muS * muG + SSIM_C1) * (2 * sigSG + SSIM_C2)) / ((muS2 + muG * muG + SSIM_C1) * (sigS2 + sigG2 + SSIM_C2));
}
function sumOfSquares(glyph, srcLum, n) {
  const glyphLum = glyph.lum;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = srcLum[i] - glyphLum[i];
    sum += d * d;
  }
  return sum;
}
function sumOfAbsDiff(glyph, srcLum, n) {
  const glyphLum = glyph.lum;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = srcLum[i] - glyphLum[i];
    sum += d < 0 ? -d : d;
  }
  return sum;
}
function minimizeCrossCorrelation(glyph, srcLum, n) {
  const glyphLum = glyph.lum;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += srcLum[i] * glyphLum[i];
  }
  return -sum;
}
var DISTANCE_FNS = {
  SSIM: ssimDistance,
  HISTOGRAM: histogramIntersection,
  SUM_OF_SQUARES: sumOfSquares,
  SUM_OF_ABS_DIFF: sumOfAbsDiff,
  MINIMIZE_CROSS_CORRELATION: minimizeCrossCorrelation
};

// src/evaluate.ts
function kurtosis(xs) {
  const n = xs.length;
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const m2 = xs.reduce((a, x) => a + (x - mean) ** 2, 0) / n;
  const m4 = xs.reduce((a, x) => a + (x - mean) ** 4, 0) / n;
  if (m2 * m2 === 3) return 0;
  return 0 - (m4 / (m2 * m2) - 3);
}
function chiSquaredGoF(xs) {
  const n = xs.length;
  const counts = /* @__PURE__ */ new Map();
  for (let i = 0; i < n; i++) {
    counts.set(xs[i], (counts.get(xs[i]) || 0) + 1);
  }
  const k = counts.size;
  const expected = n / k;
  let chi2 = 0;
  for (const observed of counts.values()) {
    const d = observed - expected;
    chi2 += d * d / expected;
  }
  return chi2;
}
var EVALUTATE_FNS = {
  KURTOSIS: kurtosis,
  CHISQUARED: chiSquaredGoF
};

// src/color.ts
var MIN_COVERAGE = 1e-3;
function solveCellColors(cellRGB, indices, glyphs, background, offset = 0) {
  const cells = cellRGB.length / 3;
  const out = new Uint8ClampedArray(cells * 3);
  for (let i = 0; i < cells; i++) {
    const alpha = glyphs[indices[offset + i]].coverage;
    for (let c = 0; c < 3; c++) {
      const target = cellRGB[i * 3 + c];
      out[i * 3 + c] = alpha < MIN_COVERAGE ? background : background + (target - background) / alpha;
    }
  }
  return out;
}

// src/grid.ts
var MIN_GLYPH_RASTER_HEIGHT = 12;
var MAX_GLYPH_RASTER_HEIGHT = 24;
function gridGeometry(imageWidth, imageHeight, cols, fontRatio) {
  const cellWidth = imageWidth / cols;
  const idealCellHeight = cellWidth / fontRatio;
  const rows = Math.max(1, Math.round(imageHeight / idealCellHeight));
  const glyphRasterHeight = Math.min(
    MAX_GLYPH_RASTER_HEIGHT,
    Math.max(MIN_GLYPH_RASTER_HEIGHT, Math.round(idealCellHeight))
  );
  return {
    cols,
    rows,
    cellWidth,
    cellHeight: imageHeight / rows,
    glyphRasterHeight
  };
}
function boxTaps(srcN, dstN) {
  const scale = srcN / dstN;
  const taps = [];
  for (let d = 0; d < dstN; d++) {
    const a = d * scale;
    const b = (d + 1) * scale;
    const start = Math.floor(a);
    const end = Math.min(srcN, Math.ceil(b));
    const weights = new Float32Array(Math.max(1, end - start));
    for (let s = start; s < end; s++) {
      weights[s - start] = (Math.min(b, s + 1) - Math.max(a, s)) / scale;
    }
    taps.push({ start, weights });
  }
  return taps;
}
var LUMINANCE = [[0.299, 0.587, 0.114]];
var RGB = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
];
function boxResample(png, dstW, dstH, channels) {
  const srcW = png.width;
  const srcH = png.height;
  const data = png.data;
  const nc = channels.length;
  const xTaps = boxTaps(srcW, dstW);
  const yTaps = boxTaps(srcH, dstH);
  const tmp = new Float32Array(srcH * dstW * nc);
  for (let y = 0; y < srcH; y++) {
    const rowOffset = y * srcW;
    for (let x = 0; x < dstW; x++) {
      const { start, weights } = xTaps[x];
      const o = (y * dstW + x) * nc;
      for (let k = 0; k < weights.length; k++) {
        const i = (rowOffset + start + k) * 4;
        const w = weights[k];
        for (let c = 0; c < nc; c++) {
          const [wr, wg, wb] = channels[c];
          tmp[o + c] += w * (wr * data[i] + wg * data[i + 1] + wb * data[i + 2]);
        }
      }
    }
  }
  const rowLen = dstW * nc;
  const out = new Float32Array(dstH * rowLen);
  for (let y = 0; y < dstH; y++) {
    const { start, weights } = yTaps[y];
    const outOffset = y * rowLen;
    for (let k = 0; k < weights.length; k++) {
      const w = weights[k];
      const srcOffset = (start + k) * rowLen;
      for (let x = 0; x < rowLen; x++) {
        out[outOffset + x] += w * tmp[srcOffset + x];
      }
    }
  }
  return out;
}
function resampleLuminance(png, dstW, dstH) {
  return boxResample(png, dstW, dstH, LUMINANCE);
}
function resampleRGB(png, dstW, dstH) {
  return boxResample(png, dstW, dstH, RGB);
}

// src/unicode-blocks.ts
var BLOCK_RANGES = [
  ["Basic Latin", 0, 127],
  ["Latin-1 Supplement", 128, 255],
  ["Latin Extended-A", 256, 383],
  ["Latin Extended-B", 384, 591],
  ["IPA Extensions", 592, 687],
  ["Spacing Modifier Letters", 688, 767],
  // ["Combining Diacritical Marks", 0x0300, 0x036f], // zero-width combining
  ["Greek and Coptic", 880, 1023],
  ["Cyrillic", 1024, 1279],
  ["Cyrillic Supplement", 1280, 1327],
  ["Armenian", 1328, 1423],
  ["Hebrew", 1424, 1535],
  ["Arabic", 1536, 1791],
  ["Syriac", 1792, 1871],
  ["Arabic Supplement", 1872, 1919],
  ["Thaana", 1920, 1983],
  ["NKo", 1984, 2047],
  ["Samaritan", 2048, 2111],
  ["Mandaic", 2112, 2143],
  ["Syriac Supplement", 2144, 2159],
  ["Arabic Extended-B", 2160, 2207],
  ["Arabic Extended-A", 2208, 2303],
  ["Devanagari", 2304, 2431],
  ["Bengali", 2432, 2559],
  ["Gurmukhi", 2560, 2687],
  ["Gujarati", 2688, 2815],
  ["Oriya", 2816, 2943],
  ["Tamil", 2944, 3071],
  ["Telugu", 3072, 3199],
  ["Kannada", 3200, 3327],
  ["Malayalam", 3328, 3455],
  ["Sinhala", 3456, 3583],
  ["Thai", 3584, 3711],
  ["Lao", 3712, 3839],
  ["Tibetan", 3840, 4095],
  ["Myanmar", 4096, 4255],
  ["Georgian", 4256, 4351],
  // ["Hangul Jamo", 0x1100, 0x11ff], // wide
  ["Ethiopic", 4608, 4991],
  ["Ethiopic Supplement", 4992, 5023],
  ["Cherokee", 5024, 5119],
  ["Unified Canadian Aboriginal Syllabics", 5120, 5759],
  ["Ogham", 5760, 5791],
  ["Runic", 5792, 5887],
  ["Tagalog", 5888, 5919],
  ["Hanunoo", 5920, 5951],
  ["Buhid", 5952, 5983],
  ["Tagbanwa", 5984, 6015],
  ["Khmer", 6016, 6143],
  ["Mongolian", 6144, 6319],
  ["Unified Canadian Aboriginal Syllabics Extended", 6320, 6399],
  ["Limbu", 6400, 6479],
  ["Tai Le", 6480, 6527],
  ["New Tai Lue", 6528, 6623],
  ["Khmer Symbols", 6624, 6655],
  ["Buginese", 6656, 6687],
  ["Tai Tham", 6688, 6831],
  // ["Combining Diacritical Marks Extended", 0x1ab0, 0x1aff], // zero-width combining
  ["Balinese", 6912, 7039],
  ["Sundanese", 7040, 7103],
  ["Batak", 7104, 7167],
  ["Lepcha", 7168, 7247],
  ["Ol Chiki", 7248, 7295],
  ["Cyrillic Extended-C", 7296, 7311],
  ["Georgian Extended", 7312, 7359],
  ["Sundanese Supplement", 7360, 7375],
  // ["Vedic Extensions", 0x1cd0, 0x1cff], // zero-width combining
  ["Phonetic Extensions", 7424, 7551],
  ["Phonetic Extensions Supplement", 7552, 7615],
  // ["Combining Diacritical Marks Supplement", 0x1dc0, 0x1dff], // zero-width combining
  ["Latin Extended Additional", 7680, 7935],
  ["Greek Extended", 7936, 8191],
  ["General Punctuation", 8192, 8303],
  ["Superscripts and Subscripts", 8304, 8351],
  ["Currency Symbols", 8352, 8399],
  // ["Combining Diacritical Marks for Symbols", 0x20d0, 0x20ff], // zero-width combining
  ["Letterlike Symbols", 8448, 8527],
  ["Number Forms", 8528, 8591],
  ["Arrows", 8592, 8703],
  ["Mathematical Operators", 8704, 8959],
  ["Miscellaneous Technical", 8960, 9215],
  ["Control Pictures", 9216, 9279],
  ["Optical Character Recognition", 9280, 9311],
  ["Enclosed Alphanumerics", 9312, 9471],
  ["Box Drawing", 9472, 9599],
  ["Block Elements", 9600, 9631],
  ["Geometric Shapes", 9632, 9727],
  ["Miscellaneous Symbols", 9728, 9983],
  ["Dingbats", 9984, 10175],
  ["Miscellaneous Mathematical Symbols-A", 10176, 10223],
  ["Supplemental Arrows-A", 10224, 10239],
  // ["Braille Patterns", 0x2800, 0x28ff],
  ["Supplemental Arrows-B", 10496, 10623],
  ["Miscellaneous Mathematical Symbols-B", 10624, 10751],
  ["Supplemental Mathematical Operators", 10752, 11007],
  ["Miscellaneous Symbols and Arrows", 11008, 11263],
  ["Glagolitic", 11264, 11359],
  ["Latin Extended-C", 11360, 11391],
  ["Coptic", 11392, 11519],
  ["Georgian Supplement", 11520, 11567],
  ["Tifinagh", 11568, 11647],
  ["Ethiopic Extended", 11648, 11743],
  // ["Cyrillic Extended-A", 0x2de0, 0x2dff], // zero-width combining
  ["Supplemental Punctuation", 11776, 11903],
  // ["CJK Radicals Supplement", 0x2e80, 0x2eff], // wide
  // ["Kangxi Radicals", 0x2f00, 0x2fdf], // wide
  // ["Ideographic Description Characters", 0x2ff0, 0x2fff], // wide
  // ["CJK Symbols and Punctuation", 0x3000, 0x303f], // wide
  // ["Hiragana", 0x3040, 0x309f], // wide
  // ["Katakana", 0x30a0, 0x30ff], // wide
  // ["Bopomofo", 0x3100, 0x312f], // wide
  // ["Hangul Compatibility Jamo", 0x3130, 0x318f], // wide
  // ["Kanbun", 0x3190, 0x319f], // wide
  // ["Bopomofo Extended", 0x31a0, 0x31bf], // wide
  // ["CJK Strokes", 0x31c0, 0x31ef],
  // ["Katakana Phonetic Extensions", 0x31f0, 0x31ff], // wide
  // ["Enclosed CJK Letters and Months", 0x3200, 0x32ff], // wide
  // ["CJK Compatibility", 0x3300, 0x33ff], // wide
  // ["CJK Unified Ideographs Extension A", 0x3400, 0x4dbf], // wide
  // ["Yijing Hexagram Symbols", 0x4dc0, 0x4dff], // wide
  // ["CJK Unified Ideographs", 0x4e00, 0x9fff], // wide
  // ["Yi Syllables", 0xa000, 0xa48f], // wide
  // ["Yi Radicals", 0xa490, 0xa4cf], // wide
  ["Lisu", 42192, 42239],
  ["Vai", 42240, 42559],
  ["Cyrillic Extended-B", 42560, 42655],
  ["Bamum", 42656, 42751],
  ["Modifier Tone Letters", 42752, 42783],
  ["Latin Extended-D", 42784, 43007],
  ["Syloti Nagri", 43008, 43055],
  ["Common Indic Number Forms", 43056, 43071],
  ["Phags-pa", 43072, 43135],
  ["Saurashtra", 43136, 43231],
  ["Devanagari Extended", 43232, 43263],
  ["Kayah Li", 43264, 43311],
  ["Rejang", 43312, 43359],
  // ["Hangul Jamo Extended-A", 0xa960, 0xa97f], // wide
  ["Javanese", 43392, 43487],
  ["Myanmar Extended-B", 43488, 43519],
  ["Cham", 43520, 43615],
  ["Myanmar Extended-A", 43616, 43647],
  ["Tai Viet", 43648, 43743],
  ["Meetei Mayek Extensions", 43744, 43775],
  ["Ethiopic Extended-A", 43776, 43823],
  ["Latin Extended-E", 43824, 43887],
  ["Cherokee Supplement", 43888, 43967],
  ["Meetei Mayek", 43968, 44031],
  // ["Hangul Syllables", 0xac00, 0xd7af], // wide
  // ["Hangul Jamo Extended-B", 0xd7b0, 0xd7ff], // wide
  // ["High Surrogates", 0xd800, 0xdb7f], // surrogates
  // ["High Private Use Surrogates", 0xdb80, 0xdbff], // surrogates
  // ["Low Surrogates", 0xdc00, 0xdfff], // surrogates
  // ["Private Use Area", 0xe000, 0xf8ff], // private use
  // ["CJK Compatibility Ideographs", 0xf900, 0xfaff], // wide
  ["Alphabetic Presentation Forms", 64256, 64335],
  ["Arabic Presentation Forms-A", 64336, 65023],
  // ["Variation Selectors", 0xfe00, 0xfe0f], // zero-width
  ["Vertical Forms", 65040, 65055],
  // ["Combining Half Marks", 0xfe20, 0xfe2f], // zero-width combining
  // ["CJK Compatibility Forms", 0xfe30, 0xfe4f], // wide
  ["Small Form Variants", 65104, 65135],
  ["Arabic Presentation Forms-B", 65136, 65279],
  // ["Halfwidth and Fullwidth Forms", 0xff00, 0xffef], // mixed wide/narrow
  ["Specials", 65520, 65535],
  ["Linear B Syllabary", 65536, 65663],
  ["Linear B Ideograms", 65664, 65791],
  ["Aegean Numbers", 65792, 65855],
  ["Ancient Greek Numbers", 65856, 65935],
  ["Ancient Symbols", 65936, 65999],
  ["Phaistos Disc", 66e3, 66047],
  ["Lycian", 66176, 66207],
  ["Carian", 66208, 66271],
  ["Coptic Epact Numbers", 66272, 66303],
  ["Old Italic", 66304, 66351],
  ["Gothic", 66352, 66383],
  ["Old Permic", 66384, 66431],
  ["Ugaritic", 66432, 66463],
  ["Old Persian", 66464, 66527],
  ["Deseret", 66560, 66639],
  ["Shavian", 66640, 66687],
  ["Osmanya", 66688, 66735],
  ["Osage", 66736, 66815],
  ["Elbasan", 66816, 66863],
  ["Caucasian Albanian", 66864, 66927],
  ["Vithkuqi", 66928, 67007],
  ["Todhri", 67008, 67071],
  ["Linear A", 67072, 67455],
  ["Latin Extended-F", 67456, 67519],
  ["Cypriot Syllabary", 67584, 67647],
  ["Imperial Aramaic", 67648, 67679],
  ["Palmyrene", 67680, 67711],
  ["Nabataean", 67712, 67759],
  ["Hatran", 67808, 67839],
  ["Phoenician", 67840, 67871],
  ["Lydian", 67872, 67903],
  ["Meroitic Hieroglyphs", 67968, 67999],
  ["Meroitic Cursive", 68e3, 68095],
  ["Kharoshthi", 68096, 68191],
  ["Old South Arabian", 68192, 68223],
  ["Old North Arabian", 68224, 68255],
  ["Manichaean", 68288, 68351],
  ["Avestan", 68352, 68415],
  ["Inscriptional Parthian", 68416, 68447],
  ["Inscriptional Pahlavi", 68448, 68479],
  ["Psalter Pahlavi", 68480, 68527],
  ["Old Turkic", 68608, 68687],
  ["Old Hungarian", 68736, 68863],
  ["Hanifi Rohingya", 68864, 68927],
  ["Garay", 68928, 69007],
  ["Rumi Numeral Symbols", 69216, 69247],
  ["Yezidi", 69248, 69311],
  ["Arabic Extended-C", 69312, 69375],
  ["Old Sogdian", 69376, 69423],
  ["Sogdian", 69424, 69487],
  ["Old Uyghur", 69488, 69551],
  ["Chorasmian", 69552, 69599],
  ["Elymaic", 69600, 69631],
  ["Brahmi", 69632, 69759],
  ["Kaithi", 69760, 69839],
  ["Sora Sompeng", 69840, 69887],
  ["Chakma", 69888, 69967],
  ["Mahajani", 69968, 70015],
  ["Sharada", 70016, 70111],
  ["Sinhala Archaic Numbers", 70112, 70143],
  ["Khojki", 70144, 70223],
  ["Multani", 70272, 70319],
  ["Khudawadi", 70320, 70399],
  ["Grantha", 70400, 70527],
  ["Tulu-Tigalari", 70528, 70655],
  ["Newa", 70656, 70783],
  ["Tirhuta", 70784, 70879],
  ["Siddham", 71040, 71167],
  ["Modi", 71168, 71263],
  ["Mongolian Supplement", 71264, 71295],
  ["Takri", 71296, 71375],
  ["Myanmar Extended-C", 71376, 71423],
  ["Ahom", 71424, 71503],
  ["Dogra", 71680, 71759],
  ["Warang Citi", 71840, 71935],
  ["Dives Akuru", 71936, 72031],
  ["Nandinagari", 72096, 72191],
  ["Zanabazar Square", 72192, 72271],
  ["Soyombo", 72272, 72367],
  ["Unified Canadian Aboriginal Syllabics Extended-A", 72368, 72383],
  ["Pau Cin Hau", 72384, 72447],
  ["Devanagari Extended-A", 72448, 72543],
  ["Sunuwar", 72640, 72703],
  ["Bhaiksuki", 72704, 72815],
  ["Marchen", 72816, 72895],
  ["Masaram Gondi", 72960, 73055],
  ["Gunjala Gondi", 73056, 73135],
  ["Makasar", 73440, 73471],
  ["Kawi", 73472, 73567],
  ["Lisu Supplement", 73648, 73663],
  ["Tamil Supplement", 73664, 73727],
  ["Cuneiform", 73728, 74751],
  ["Cuneiform Numbers and Punctuation", 74752, 74879],
  ["Early Dynastic Cuneiform", 74880, 75087],
  ["Cypro-Minoan", 77712, 77823],
  // ["Egyptian Hieroglyphs", 0x13000, 0x1342f], // wide
  // ["Egyptian Hieroglyph Format Controls", 0x13430, 0x1345f], // zero-width format
  // ["Egyptian Hieroglyphs Extended-A", 0x13460, 0x143ff], // wide
  // ["Anatolian Hieroglyphs", 0x14400, 0x1467f], // wide
  ["Gurung Khema", 90368, 90431],
  ["Bamum Supplement", 92160, 92735],
  ["Mro", 92736, 92783],
  ["Tangsa", 92784, 92879],
  ["Bassa Vah", 92880, 92927],
  ["Pahawh Hmong", 92928, 93071],
  ["Kirat Rai", 93504, 93567],
  ["Medefaidrin", 93760, 93855],
  ["Miao", 93952, 94111],
  // ["Ideographic Symbols and Punctuation", 0x16fe0, 0x16fff], // wide
  // ["Tangut", 0x17000, 0x187ff], // wide
  // ["Tangut Components", 0x18800, 0x18aff], // wide
  // ["Khitan Small Script", 0x18b00, 0x18cff], // wide
  // ["Tangut Supplement", 0x18d00, 0x18d7f], // wide
  // ["Kana Extended-B", 0x1aff0, 0x1afff], // wide
  // ["Kana Supplement", 0x1b000, 0x1b0ff], // wide
  // ["Kana Extended-A", 0x1b100, 0x1b12f], // wide
  // ["Small Kana Extension", 0x1b130, 0x1b16f], // wide
  // ["Nushu", 0x1b170, 0x1b2ff], // wide
  ["Duployan", 113664, 113823],
  // ["Shorthand Format Controls", 0x1bca0, 0x1bcaf], // zero-width format
  ["Symbols for Legacy Computing Supplement", 117760, 118463],
  ["Znamenny Musical Notation", 118528, 118735],
  ["Byzantine Musical Symbols", 118784, 119039],
  ["Musical Symbols", 119040, 119295],
  ["Ancient Greek Musical Notation", 119296, 119375],
  ["Kaktovik Numerals", 119488, 119519],
  ["Mayan Numerals", 119520, 119551],
  ["Tai Xuan Jing Symbols", 119552, 119647],
  ["Counting Rod Numerals", 119648, 119679],
  ["Mathematical Alphanumeric Symbols", 119808, 120831],
  ["Sutton SignWriting", 120832, 121519],
  ["Latin Extended-G", 122624, 122879],
  // ["Glagolitic Supplement", 0x1e000, 0x1e02f], // zero-width combining
  ["Cyrillic Extended-D", 122928, 123023],
  ["Nyiakeng Puachue Hmong", 123136, 123215],
  ["Toto", 123536, 123583],
  ["Wancho", 123584, 123647],
  ["Nag Mundari", 124112, 124159],
  ["Ol Onal", 124368, 124415],
  ["Ethiopic Extended-B", 124896, 124927],
  ["Mende Kikakui", 124928, 125151],
  ["Adlam", 125184, 125279],
  ["Indic Siyaq Numbers", 126064, 126143],
  ["Ottoman Siyaq Numbers", 126208, 126287],
  ["Arabic Mathematical Alphabetic Symbols", 126464, 126719],
  // ["Mahjong Tiles", 0x1f000, 0x1f02f], // wide
  // ["Domino Tiles", 0x1f030, 0x1f09f], // wide
  // ["Playing Cards", 0x1f0a0, 0x1f0ff], // wide
  // ["Enclosed Alphanumeric Supplement", 0x1f100, 0x1f1ff], // wide
  // ["Enclosed Ideographic Supplement", 0x1f200, 0x1f2ff], // wide
  // ["Miscellaneous Symbols and Pictographs", 0x1f300, 0x1f5ff], // wide emoji
  // ["Emoticons", 0x1f600, 0x1f64f], // wide emoji
  ["Ornamental Dingbats", 128592, 128639],
  // ["Transport and Map Symbols", 0x1f680, 0x1f6ff], // wide emoji
  ["Alchemical Symbols", 128768, 128895],
  ["Geometric Shapes Extended", 128896, 129023],
  ["Supplemental Arrows-C", 129024, 129279],
  // ["Supplemental Symbols and Pictographs", 0x1f900, 0x1f9ff], // wide emoji
  // ["Chess Symbols", 0x1fa00, 0x1fa6f], // wide
  // ["Symbols and Pictographs Extended-A", 0x1fa70, 0x1faff], // wide emoji
  ["Symbols for Legacy Computing", 129792, 130047]
  // ["CJK Unified Ideographs Extension B", 0x20000, 0x2a6df], // wide
  // ["CJK Unified Ideographs Extension C", 0x2a700, 0x2b73f], // wide
  // ["CJK Unified Ideographs Extension D", 0x2b740, 0x2b81f], // wide
  // ["CJK Unified Ideographs Extension E", 0x2b820, 0x2ceaf], // wide
  // ["CJK Unified Ideographs Extension F", 0x2ceb0, 0x2ebef], // wide
  // ["CJK Unified Ideographs Extension I", 0x2ebf0, 0x2ee5f], // wide
  // ["CJK Compatibility Ideographs Supplement", 0x2f800, 0x2fa1f], // wide
  // ["CJK Unified Ideographs Extension G", 0x30000, 0x3134f], // wide
  // ["CJK Unified Ideographs Extension H", 0x31350, 0x323af], // wide
  // ["Tags", 0xe0000, 0xe007f], // zero-width
  // ["Variation Selectors Supplement", 0xe0100, 0xe01ef], // zero-width
  // ["Supplementary Private Use Area-A", 0xf0000, 0xfffff], // private use
  // ["Supplementary Private Use Area-B", 0x100000, 0x10ffff], // private use
];
function generateBlockString(start, end) {
  let result = "";
  for (let cp = start; cp <= end; cp++) {
    result += String.fromCodePoint(cp);
  }
  return result;
}
var UNICODE_BLOCKS = Object.fromEntries(
  BLOCK_RANGES.map(([name, start, end]) => [
    name,
    generateBlockString(start, end)
  ])
);
var DEFAULT_BLOCKS = [
  "Mathematical Operators",
  "Geometric Shapes",
  "Box Drawing",
  "Block Elements"
];

// src/ascii.ts
function parseBlockChars(block) {
  return [...block].filter((x) => x !== "\n" && x !== " " && x !== "	");
}
var ASCII_CHARS = Object.values(UNICODE_BLOCKS).flatMap(parseBlockChars);
function buildCharList(enabledBlocks) {
  return enabledBlocks.flatMap((name) => parseBlockChars(UNICODE_BLOCKS[name]));
}
function measureFont(canvasFactory, fontName, lineHeight) {
  const size = 100;
  const ctx = canvasFactory(size, size);
  ctx.font = `${size}px ${fontName}`;
  ctx.textRendering = "geometricPrecision";
  const metrics = ctx.measureText("M");
  const hasFontBox = metrics.fontBoundingBoxAscent !== void 0;
  const ascent = hasFontBox ? metrics.fontBoundingBoxAscent / size : 0.8;
  const descent = hasFontBox ? metrics.fontBoundingBoxDescent / size : 0.2;
  const normal = hasFontBox ? ascent + descent : 1.2;
  return {
    advance: metrics.width / size,
    ascent,
    descent,
    lineBox: lineHeight === "normal" ? normal : lineHeight
  };
}
function measureFontRatio(canvasFactory, fontName = "monospace", lineHeight = "normal") {
  const m = measureFont(canvasFactory, fontName, lineHeight);
  return m.advance / m.lineBox;
}
function matchCell(lum, lumWidth, glyphs, col, row, distance_fn, brightness = 0, contrast = 1, invertImage = false) {
  const glyphW = glyphs[0].width;
  const glyphH = glyphs[0].height;
  const n = glyphW * glyphH;
  const base = row * glyphH * lumWidth + col * glyphW;
  const srcLum = new Float32Array(n);
  let sumS = 0, sumS2 = 0;
  for (let gy = 0; gy < glyphH; gy++) {
    const rowOffset = base + gy * lumWidth;
    for (let gx = 0; gx < glyphW; gx++) {
      let v = lum[rowOffset + gx];
      v = ((v / 255 + brightness - 0.5) * contrast + 0.5) * 255;
      if (v < 0) v = 0;
      else if (v > 255) v = 255;
      if (invertImage) v = 255 - v;
      const idx = gy * glyphW + gx;
      srcLum[idx] = v;
      sumS += v;
      sumS2 += v * v;
    }
  }
  let bestIndex = 0;
  let bestDist = Infinity;
  const muS = sumS / n;
  const muS2 = muS * muS;
  const sigS2 = sumS2 / n - muS2;
  for (let gi = 0; gi < glyphs.length; gi++) {
    const dist = DISTANCE_FNS[distance_fn](
      glyphs[gi],
      srcLum,
      n,
      muS,
      muS2,
      sigS2
    );
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = gi;
    }
  }
  return bestIndex;
}
function mode(array) {
  if (array.length === 0) return null;
  var modeMap = {};
  var maxEl = array[0], maxCount = 1;
  for (let i = 0; i < array.length; i++) {
    let el2 = array[i];
    if (modeMap[el2] == null) modeMap[el2] = 1;
    else modeMap[el2]++;
    if (modeMap[el2] > maxCount) {
      maxEl = el2;
      maxCount = modeMap[el2];
    }
  }
  return maxEl;
}
function createCharacterPortraits(scale, canvasFactory, chars = ASCII_CHARS, fontRatio, invertGlyphs = false, fontName = "monospace", lineHeight = "normal") {
  const metrics = measureFont(canvasFactory, fontName, lineHeight);
  const ratio = fontRatio ?? metrics.advance / metrics.lineBox;
  const w = Math.max(1, Math.round(scale * ratio));
  const h = scale;
  const fontSize = scale / metrics.lineBox;
  const halfLeading = (metrics.lineBox - metrics.ascent - metrics.descent) / 2;
  const baseline = (halfLeading + metrics.ascent) * fontSize;
  const ctx = canvasFactory(w, h);
  ctx.font = `${fontSize}px ${fontName}`;
  const glyphs = [];
  const charWidths = chars.map((x) => ctx.measureText(x).width);
  const base = mode(charWidths);
  for (const i in chars) {
    const ch = chars[i];
    if (charWidths[i] !== base && ch !== " ") {
      console.warn(`Skipping |${ch}|`);
      continue;
    }
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(ch, w / 2, baseline);
    const imageData = ctx.getImageData(0, 0, w, h);
    const n = w * h;
    const lum = new Float32Array(n);
    let sumG = 0, sumG2 = 0, ink = 0;
    for (let i2 = 0; i2 < n; i2++) {
      const idx = i2 * 4;
      let l = 0.299 * imageData.data[idx] + 0.587 * imageData.data[idx + 1] + 0.114 * imageData.data[idx + 2];
      ink += l;
      if (invertGlyphs) l = 255 - l;
      lum[i2] = l;
      sumG += l;
      sumG2 += l * l;
    }
    const coverage = ink / (n * 255);
    glyphs.push({ char: ch, lum, width: w, height: h, sumG, sumG2, coverage });
  }
  console.log(glyphs.map((x) => x.char));
  return glyphs;
}
function computeStats(ascii, cell_width, cell_height, width, height, numGlyphs) {
  const chars = width * height;
  const uniqueChars = new Set(ascii.replace(/\n/g, "")).size;
  return {
    cell_width,
    cell_height,
    width,
    height,
    chars,
    chars_ratio: chars / numGlyphs,
    unique_chars: uniqueChars,
    unique_chars_ratio: uniqueChars / numGlyphs
  };
}
function prepareRender(png, width, canvasFactory, chars, fontRatio, invertGlyphs, fontName, lineHeight, color = false) {
  const geom = gridGeometry(png.width, png.height, width, fontRatio);
  const glyphs = createCharacterPortraits(
    geom.glyphRasterHeight,
    canvasFactory,
    chars,
    fontRatio,
    invertGlyphs,
    fontName,
    lineHeight
  );
  const lumWidth = geom.cols * glyphs[0].width;
  const lum = resampleLuminance(png, lumWidth, geom.rows * glyphs[0].height);
  const cellRGB = color ? resampleRGB(png, geom.cols, geom.rows) : null;
  const background = invertGlyphs ? 255 : 0;
  return { geom, glyphs, lum, lumWidth, cellRGB, background };
}
function preparedColors(prep, indices, offset = 0) {
  if (!prep.cellRGB) return void 0;
  return solveCellColors(
    prep.cellRGB,
    indices,
    prep.glyphs,
    prep.background,
    offset
  );
}
function preparedStats(prep, ascii) {
  return computeStats(
    ascii,
    prep.geom.cellWidth,
    prep.geom.cellHeight,
    prep.geom.cols,
    prep.geom.rows,
    prep.glyphs.length
  );
}
function renderAscii(prep, distance_fn, brightness = 0, contrast = 1, invertImage = false) {
  const { geom, glyphs, lum, lumWidth } = prep;
  const indices = new Uint32Array(geom.cols * geom.rows);
  const lines = [];
  for (let row = 0; row < geom.rows; row++) {
    let line = "";
    for (let col = 0; col < geom.cols; col++) {
      const gi = matchCell(
        lum,
        lumWidth,
        glyphs,
        col,
        row,
        distance_fn,
        brightness,
        contrast,
        invertImage
      );
      indices[row * geom.cols + col] = gi;
      line += glyphs[gi].char;
    }
    lines.push(line);
  }
  const ascii = lines.join("\n");
  const colors = preparedColors(prep, indices);
  return { ascii, stats: preparedStats(prep, ascii), colors };
}
function* estimateAscii(png, width, canvasFactory, evaluate_fn, distance_fn, chars = ASCII_CHARS, fontRatio, invertGlyphs = false, invertImage = false, fontName = "monospace", lineHeight = "normal", color = false) {
  const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName, lineHeight);
  const prep = prepareRender(
    png,
    width,
    canvasFactory,
    chars,
    ratio,
    invertGlyphs,
    fontName,
    lineHeight,
    color
  );
  let contrast = 4;
  let brightness = 0.1;
  function f(c, b) {
    const { ascii, stats, colors } = renderAscii(
      prep,
      distance_fn,
      b,
      c,
      invertImage
    );
    const val = EVALUTATE_FNS[evaluate_fn](
      ascii.split("").map((x) => chars.indexOf(x))
    );
    return { val, ascii, stats, colors };
  }
  let cur = f(contrast, brightness);
  yield { ascii: cur.ascii, brightness, contrast, stats: cur.stats, colors: cur.colors };
  console.log(
    `Contrast ${contrast}, Brightness ${brightness}, Total ${cur.val}`
  );
  let bestC = contrast, bestB = brightness, bestF = cur.val;
  const cSteps = 10, bSteps = 10;
  const cMin = 0.5, cMax = 8;
  const bMin = -0.5, bMax = 0.5;
  for (let ci = 0; ci <= cSteps; ci++) {
    for (let bi = 0; bi <= bSteps; bi++) {
      const c = cMin + (cMax - cMin) * ci / cSteps;
      const b = bMin + (bMax - bMin) * bi / bSteps;
      cur = f(c, b);
      yield { ascii: cur.ascii, brightness: b, contrast: c, stats: cur.stats, colors: cur.colors };
      console.log(
        `  Search -- Contrast ${c}, Brightness ${b}, Total ${cur.val}`
      );
      if (cur.val > bestF) {
        bestF = cur.val;
        bestC = c;
        bestB = b;
      }
    }
  }
  const cRadius = (cMax - cMin) / cSteps / 2;
  const bRadius = (bMax - bMin) / bSteps / 2;
  for (let ci = -2; ci <= 2; ci++) {
    for (let bi = -2; bi <= 2; bi++) {
      const c = Math.max(cMin, Math.min(cMax, bestC + ci * cRadius));
      const b = Math.max(bMin, Math.min(bMax, bestB + bi * bRadius));
      cur = f(c, b);
      yield { ascii: cur.ascii, brightness: b, contrast: c, stats: cur.stats, colors: cur.colors };
      console.log(
        `  Refine -- Contrast ${c}, Brightness ${b}, Total ${cur.val}`
      );
      if (cur.val > bestF) {
        bestF = cur.val;
        bestC = c;
        bestB = b;
      }
    }
  }
  contrast = bestC;
  brightness = bestB;
  cur = f(contrast, brightness);
  console.log(`Final -- Contrast ${contrast}, Brightness ${brightness}`);
  return { ascii: cur.ascii, brightness, contrast, stats: cur.stats, colors: cur.colors };
}
function pngToAscii(png, width, canvasFactory, distance_fn, chars = ASCII_CHARS, fontRatio, invertGlyphs = false, invertImage = false, brightness = 0, contrast = 1, fontName = "monospace", lineHeight = "normal", color = false) {
  const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName, lineHeight);
  const prep = prepareRender(
    png,
    width,
    canvasFactory,
    chars,
    ratio,
    invertGlyphs,
    fontName,
    lineHeight,
    color
  );
  const { ascii, stats, colors } = renderAscii(
    prep,
    distance_fn,
    brightness,
    contrast,
    invertImage
  );
  return { ascii, brightness, contrast, stats, colors };
}

// src/chargrid.ts
function gridFromText(ascii, colors) {
  const lines = ascii.split("\n").map((l) => [...l]);
  if (!colors) return { lines, colors: null };
  const cols = lines[0]?.length ?? 0;
  return {
    lines,
    colors: lines.map((line, row) => {
      const out = new Int32Array(line.length);
      for (let col = 0; col < line.length; col++) {
        const i = (row * cols + col) * 3;
        out[col] = colors[i] << 16 | colors[i + 1] << 8 | colors[i + 2];
      }
      return out;
    })
  };
}
function gridToText(grid) {
  return grid.lines.map((l) => l.join("")).join("\n");
}
function hex(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}
function rgb(color) {
  return [color >> 16 & 255, color >> 8 & 255, color & 255];
}
function colorRuns(line, colors) {
  const runs = [];
  let text = "";
  let color = null;
  for (let col = 0; col < line.length; col++) {
    const ch = line[col];
    if (ch !== " " && colors[col] !== color) {
      if (text) runs.push({ text, color: color ?? -1 });
      text = "";
      color = colors[col];
    }
    text += ch;
  }
  if (text) runs.push({ text, color: color ?? -1 });
  return runs;
}
var HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escapeHtml(text) {
  return text.replace(/[&<>]/g, (c) => HTML_ESCAPES[c]);
}
function gridToHtml(grid) {
  if (!grid.colors) return escapeHtml(gridToText(grid));
  const colors = grid.colors;
  return grid.lines.map(
    (line, row) => colorRuns(line, colors[row]).map(
      ({ text, color }) => color < 0 ? escapeHtml(text) : `<span style="color:${hex(color)}">${escapeHtml(text)}</span>`
    ).join("")
  ).join("\n");
}
function gridToHtmlDocument(grid, style) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ansi-warhol</title>
</head>
<body style="margin:0;background:${style.background}">
<pre style="margin:0;padding:1rem;background:${style.background};color:${style.foreground};font-family:${style.fontFamily};line-height:${style.lineHeight}">${gridToHtml(grid)}</pre>
</body>
</html>
`;
}
function gridToAnsi(grid, background, foreground) {
  if (!grid.colors) return `${gridToText(grid)}
`;
  const colors = grid.colors;
  const [br, bg, bb] = rgb(background);
  return grid.lines.map((line, row) => {
    let out = `\x1B[48;2;${br};${bg};${bb}m`;
    for (const { text, color } of colorRuns(line, colors[row])) {
      const [r, g, b] = rgb(color < 0 ? foreground : color);
      out += `\x1B[38;2;${r};${g};${b}m${text}`;
    }
    return `${out}\x1B[0m`;
  }).join("\n").concat("\n");
}

// src/canvas-factory.ts
function browserCanvasFactory(width, height) {
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

// src/webgpu.ts
var WORKGROUP_SIZE = 64;
var DISTANCE_FN_IDS = {
  SSIM: 0,
  HISTOGRAM: 1,
  SUM_OF_SQUARES: 2,
  SUM_OF_ABS_DIFF: 3,
  MINIMIZE_CROSS_CORRELATION: 4
};
function createShaderCode(glyphN, distanceFn) {
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
var WebGPURenderer = class _WebGPURenderer {
  constructor(device) {
    __publicField(this, "device");
    __publicField(this, "pipelineCache", /* @__PURE__ */ new Map());
    this.device = device;
  }
  static async create() {
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported in this browser");
    }
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("Failed to get WebGPU adapter");
    }
    const device = await adapter.requestDevice({
      requiredLimits: {
        maxStorageBufferBindingSize: 4294967292
      }
    });
    return new _WebGPURenderer(device);
  }
  getPipeline(glyphN, distanceFn) {
    const key = `${glyphN}_${distanceFn}`;
    let pipeline = this.pipelineCache.get(key);
    if (!pipeline) {
      const code = createShaderCode(glyphN, distanceFn);
      const module = this.device.createShaderModule({ code });
      pipeline = this.device.createComputePipeline({
        layout: "auto",
        compute: { module, entryPoint: "main" }
      });
      this.pipelineCache.set(key, pipeline);
    }
    return pipeline;
  }
  async dispatch(prep, gridPoints, distanceFn, invertImage = false) {
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
    const imageBuffer = device.createBuffer({
      size: lum.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(imageBuffer, 0, lum);
    const glyphLumData = new Float32Array(numGlyphs * glyphN);
    for (let i = 0; i < numGlyphs; i++) {
      glyphLumData.set(glyphs[i].lum, i * glyphN);
    }
    const glyphLumBuffer = device.createBuffer({
      size: glyphLumData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(glyphLumBuffer, 0, glyphLumData);
    const glyphStatsData = new Float32Array(numGlyphs * 2);
    for (let i = 0; i < numGlyphs; i++) {
      glyphStatsData[i * 2] = glyphs[i].sumG;
      glyphStatsData[i * 2 + 1] = glyphs[i].sumG2;
    }
    const glyphStatsBuffer = device.createBuffer({
      size: glyphStatsData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(glyphStatsBuffer, 0, glyphStatsData);
    const uniformData = new Uint32Array([
      lumWidth,
      gridWidth,
      gridHeight,
      glyphW,
      glyphH,
      numGlyphs,
      numGridPoints,
      invertImage ? 1 : 0
    ]);
    const uniformBuffer = device.createBuffer({
      size: uniformData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);
    const gridPointsData = new Float32Array(numGridPoints * 2);
    for (let i = 0; i < numGridPoints; i++) {
      gridPointsData[i * 2] = gridPoints[i].brightness;
      gridPointsData[i * 2 + 1] = gridPoints[i].contrast;
    }
    const gridPointsBuffer = device.createBuffer({
      size: Math.max(gridPointsData.byteLength, 8),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(gridPointsBuffer, 0, gridPointsData);
    const outputSize = totalItems * 4;
    const outputBuffer = device.createBuffer({
      size: outputSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
    const stagingBuffer = device.createBuffer({
      size: outputSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: imageBuffer } },
        { binding: 1, resource: { buffer: glyphLumBuffer } },
        { binding: 2, resource: { buffer: glyphStatsBuffer } },
        { binding: 3, resource: { buffer: uniformBuffer } },
        { binding: 4, resource: { buffer: gridPointsBuffer } },
        { binding: 5, resource: { buffer: outputBuffer } }
      ]
    });
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
      outputSize
    );
    device.queue.submit([commandEncoder.finish()]);
    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const result = new Uint32Array(stagingBuffer.getMappedRange().slice(0));
    stagingBuffer.unmap();
    imageBuffer.destroy();
    glyphLumBuffer.destroy();
    glyphStatsBuffer.destroy();
    uniformBuffer.destroy();
    gridPointsBuffer.destroy();
    outputBuffer.destroy();
    stagingBuffer.destroy();
    return result;
  }
  indicesToString(indices, glyphs, width, height, offset = 0) {
    const lines = [];
    for (let row = 0; row < height; row++) {
      let line = "";
      for (let col = 0; col < width; col++) {
        line += glyphs[indices[offset + row * width + col]].char;
      }
      lines.push(line);
    }
    return lines.join("\n");
  }
  async renderAscii(prep, distance_fn, brightness = 0, contrast = 1, invertImage = false) {
    const { geom, glyphs } = prep;
    const indices = await this.dispatch(
      prep,
      [{ brightness, contrast }],
      distance_fn,
      invertImage
    );
    const ascii = this.indicesToString(indices, glyphs, geom.cols, geom.rows);
    return {
      ascii,
      stats: preparedStats(prep, ascii),
      colors: preparedColors(prep, indices)
    };
  }
  async *estimateAscii(png, width, canvasFactory, evaluate_fn, distance_fn, chars = ASCII_CHARS, fontRatio, invertGlyphs = false, invertImage = false, fontName = "monospace", lineHeight = "normal", color = false) {
    const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName, lineHeight);
    const prep = prepareRender(
      png,
      width,
      canvasFactory,
      chars,
      ratio,
      invertGlyphs,
      fontName,
      lineHeight,
      color
    );
    const { glyphs } = prep;
    const height = prep.geom.rows;
    const totalCells = width * height;
    function evaluate(ascii) {
      return EVALUTATE_FNS[evaluate_fn](
        ascii.split("").filter((x) => x !== "\n").map((x) => glyphs.findIndex((y) => y.char === x))
      );
    }
    const cSteps = 10, bSteps = 10;
    const cMin = 0.5, cMax = 8;
    const bMin = -0.5, bMax = 0.5;
    const gridPoints = [];
    for (let ci = 0; ci <= cSteps; ci++) {
      for (let bi = 0; bi <= bSteps; bi++) {
        const c = cMin + (cMax - cMin) * ci / cSteps;
        const b = bMin + (bMax - bMin) * bi / bSteps;
        gridPoints.push({ brightness: b, contrast: c });
      }
    }
    const coarseIndices = await this.dispatch(
      prep,
      gridPoints,
      distance_fn,
      invertImage
    );
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
        i * totalCells
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
    const cRadius = (cMax - cMin) / cSteps / 2;
    const bRadius = (bMax - bMin) / bSteps / 2;
    const refinePoints = [];
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
      invertImage
    );
    for (let i = 0; i < refinePoints.length; i++) {
      const ascii = this.indicesToString(
        refineIndices,
        glyphs,
        width,
        height,
        i * totalCells
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
      `Final -- Contrast ${bestC}, Brightness ${bestB}, Total ${bestF}`
    );
    stats = preparedStats(prep, bestAscii);
    colors = preparedColors(prep, bestIndices, bestOffset);
    const best = {
      ascii: bestAscii,
      brightness: bestB,
      contrast: bestC,
      stats,
      colors
    };
    yield best;
    return best;
  }
  async pngToAscii(png, width, canvasFactory, distance_fn, chars = ASCII_CHARS, fontRatio, invertGlyphs = false, invertImage = false, brightness = 0, contrast = 1, fontName = "monospace", lineHeight = "normal", color = false) {
    const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName, lineHeight);
    const prep = prepareRender(
      png,
      width,
      canvasFactory,
      chars,
      ratio,
      invertGlyphs,
      fontName,
      lineHeight,
      color
    );
    const { ascii, stats, colors } = await this.renderAscii(
      prep,
      distance_fn,
      brightness,
      contrast,
      invertImage
    );
    return { ascii, brightness, contrast, stats, colors };
  }
  destroy() {
    this.device.destroy();
  }
};

// src/web/dom.ts
function el(id) {
  return document.getElementById(id);
}
var DOM = {
  fileInput: el("fileInput"),
  widthInput: el("widthInput"),
  widthRange: el("widthRange"),
  fontInput: el("fontInput"),
  lineHeightInput: el("lineHeightInput"),
  distanceSelect: el("distanceSelect"),
  evaluateSelect: el("evaluateSelect"),
  brightnessInput: el("brightnessInput"),
  brightnessRange: el("brightnessRange"),
  contrastInput: el("contrastInput"),
  contrastRange: el("contrastRange"),
  invertGlyphsCheck: el("invertGlyphsCheck"),
  invertImageCheck: el("invertImageCheck"),
  autoBtn: el("autoBtn"),
  resetBCBtn: el("resetBCBtn"),
  deselectAllBtn: el("deselectAllBtn"),
  defaultsBtn: el("defaultsBtn"),
  output: el("output"),
  status: el("status"),
  stats: el("stats"),
  preview: el("preview"),
  hiddenCanvas: el("hiddenCanvas"),
  selectedBlocks: el("selectedBlocks"),
  availableBlocks: el("availableBlocks"),
  layerList: el("layerList"),
  addLayerBtn: el("addLayerBtn"),
  removeLayerBtn: el("removeLayerBtn"),
  charSourceBlocks: el("charSourceBlocks"),
  charSourceCustom: el("charSourceCustom"),
  includeField: el("includeField"),
  includeInput: el("includeInput"),
  excludeInput: el("excludeInput"),
  charCount: el("charCount"),
  blockSelector: el("blockSelector"),
  cropBtn: el("cropBtn"),
  clearCropBtn: el("clearCropBtn"),
  cropOverlay: el("cropOverlay"),
  newImageBtn: el("newImageBtn"),
  copyBtn: el("copyBtn"),
  saveBtn: el("saveBtn"),
  saveFormat: el("saveFormat"),
  colorCheck: el("colorCheck")
};

// src/web/view.ts
function bindSlider(range, number, onChange) {
  range.addEventListener("input", () => {
    number.value = range.value;
    onChange();
  });
  number.addEventListener("input", () => {
    range.value = number.value;
  });
  number.addEventListener("change", () => {
    range.value = number.value;
    onChange();
  });
}
function applyFontStyle(fontName, lineHeight) {
  DOM.output.style.fontFamily = `"${fontName}", monospace`;
  DOM.output.style.lineHeight = lineHeight === "normal" ? "normal" : String(lineHeight);
}
function renderStats(stats) {
  DOM.stats.style.display = "block";
  DOM.stats.textContent = `Cell: ${stats.cell_width.toFixed(1)}\xD7${stats.cell_height.toFixed(1)}px
Grid: ${stats.width}\xD7${stats.height}
Chars: ${stats.chars} (${(stats.chars_ratio * 100).toFixed(1)}%)
Unique: ${stats.unique_chars} (${(stats.unique_chars_ratio * 100).toFixed(1)}%)`;
}
function renderPreview(imageData, brightness, contrast, invertImage) {
  const src = imageData;
  DOM.preview.width = src.width;
  DOM.preview.height = src.height;
  DOM.preview.style.display = "block";
  const ctx = DOM.preview.getContext("2d");
  if (!ctx) return;
  const out = ctx.createImageData(src.width, src.height);
  for (let i = 0; i < src.data.length; i += 4) {
    let lum = 0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2];
    lum = ((lum / 255 + brightness - 0.5) * contrast + 0.5) * 255;
    if (lum < 0) lum = 0;
    else if (lum > 255) lum = 255;
    if (invertImage) lum = 255 - lum;
    out.data[i] = lum;
    out.data[i + 1] = lum;
    out.data[i + 2] = lum;
    out.data[i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
}
function updateOutputColors() {
  if (DOM.invertGlyphsCheck.checked) {
    DOM.output.style.background = "#fff";
    DOM.output.style.color = "#000";
  } else {
    DOM.output.style.background = "#000";
    DOM.output.style.color = "";
  }
}

// src/web/state.ts
var gpuRenderer = null;
function setGpuRenderer(r) {
  gpuRenderer = r;
}

// src/web/blocks.ts
var BlockPicker = class {
  constructor(getEnabled, setEnabled, onChange) {
    __publicField(this, "blockItems", /* @__PURE__ */ new Map());
    __publicField(this, "getEnabled");
    __publicField(this, "setEnabled");
    __publicField(this, "onChange");
    this.getEnabled = getEnabled;
    this.setEnabled = setEnabled;
    this.onChange = onChange;
    for (const [name, chars] of Object.entries(UNICODE_BLOCKS)) {
      this.blockItems.set(name, this.createBlockItem(name, chars));
    }
    this.renderBlockLists();
    DOM.deselectAllBtn.addEventListener("click", () => {
      this.setEnabled(/* @__PURE__ */ new Set());
      this.renderBlockLists();
      this.onChange();
    });
    DOM.defaultsBtn.addEventListener("click", () => {
      this.setEnabled(new Set(DEFAULT_BLOCKS));
      this.renderBlockLists();
      this.onChange();
    });
  }
  createBlockItem(name, chars) {
    const item = document.createElement("div");
    item.className = "block-item";
    const blockChars = [...chars].filter(
      (x) => x !== "\n" && x !== " " && x !== "	"
    );
    const nameSpan = document.createElement("span");
    nameSpan.className = "block-name";
    nameSpan.textContent = name;
    const countSpan = document.createElement("span");
    countSpan.className = "block-count";
    countSpan.textContent = ` (${blockChars.length})`;
    item.appendChild(nameSpan);
    item.appendChild(countSpan);
    item.addEventListener("click", () => {
      const enabled = this.getEnabled();
      if (enabled.has(name)) {
        enabled.delete(name);
      } else {
        enabled.add(name);
      }
      this.setEnabled(enabled);
      this.renderBlockLists();
      this.onChange();
    });
    return item;
  }
  /** Refresh the block list UI to match the current enabled set. */
  renderBlockLists() {
    const enabled = this.getEnabled();
    DOM.selectedBlocks.innerHTML = "";
    DOM.availableBlocks.innerHTML = "";
    for (const [name, item] of this.blockItems) {
      if (enabled.has(name)) {
        DOM.selectedBlocks.appendChild(item);
      } else {
        DOM.availableBlocks.appendChild(item);
      }
    }
  }
};

// src/web/layers.ts
var nextLayerId = 1;
var layerState = {
  layers: [],
  selectedLayerId: ""
};
function createDefaultLayerSettings() {
  return {
    imageData: null,
    brightness: 0,
    contrast: 1,
    invertImage: false,
    color: false,
    distance_fn: "SSIM",
    enabledBlocks: new Set(DEFAULT_BLOCKS),
    charSource: "blocks",
    includeChars: "",
    excludeChars: "",
    crop: []
  };
}
function cloneLayerSettings(source) {
  return {
    imageData: source.imageData,
    brightness: source.brightness,
    contrast: source.contrast,
    invertImage: source.invertImage,
    color: source.color,
    distance_fn: source.distance_fn,
    enabledBlocks: new Set(source.enabledBlocks),
    charSource: source.charSource,
    includeChars: source.includeChars,
    excludeChars: source.excludeChars,
    crop: source.crop.map((s) => ({ op: s.op, rect: { ...s.rect } }))
  };
}
function addLayer(name, cloneFrom) {
  const id = String(nextLayerId++);
  const layer = {
    id,
    name: name ?? `Layer ${id}`,
    settings: cloneFrom ? cloneLayerSettings(cloneFrom.settings) : createDefaultLayerSettings(),
    visible: true
  };
  layerState.layers.push(layer);
  return layer;
}
function resetLayers() {
  layerState.layers = [];
  nextLayerId = 1;
  return addLayer();
}
function removeLayer(id) {
  const idx = layerState.layers.findIndex((l) => l.id === id);
  if (idx !== -1) {
    layerState.layers.splice(idx, 1);
  }
}
function renameLayer(id, name) {
  const layer = layerState.layers.find((l) => l.id === id);
  if (layer) layer.name = name;
}
function selectLayer(id) {
  layerState.selectedLayerId = id;
}
function moveLayer(fromIndex, toIndex) {
  const [layer] = layerState.layers.splice(fromIndex, 1);
  layerState.layers.splice(toIndex, 0, layer);
}
function getLayerState() {
  return layerState;
}
function getSelectedLayer() {
  return layerState.layers.find((l) => l.id === layerState.selectedLayerId);
}
function getGlobalParams() {
  const width = parseInt(DOM.widthInput.value, 10) || 76;
  const lhRaw = DOM.lineHeightInput.value.trim();
  const lineHeight = lhRaw === "normal" ? "normal" : parseFloat(lhRaw);
  if (lineHeight !== "normal" && (Number.isNaN(lineHeight) || lineHeight <= 0)) {
    DOM.status.textContent = "Invalid line-height. Use 'normal' or a positive number.";
    return null;
  }
  const fontName = DOM.fontInput.value.trim() || "monospace";
  const fontRatio = measureFontRatio(
    browserCanvasFactory,
    fontName,
    lineHeight
  );
  const evaluate_fn = DOM.evaluateSelect.value;
  const invertGlyphs = DOM.invertGlyphsCheck.checked;
  return { width, fontName, lineHeight, fontRatio, evaluate_fn, invertGlyphs };
}
function parseChars(text) {
  return [...new Set([...text].filter((c) => !/\s/.test(c)))];
}
function resolveChars(settings) {
  const base = settings.charSource === "custom" ? parseChars(settings.includeChars) : buildCharList([...settings.enabledBlocks]);
  const excluded = new Set(parseChars(settings.excludeChars));
  return [...new Set(base)].filter((c) => !excluded.has(c));
}
function buildConvertParams(layer, global) {
  const chars = [" ", ...resolveChars(layer.settings)];
  return {
    ...global,
    chars,
    distance_fn: layer.settings.distance_fn,
    invertGlyphs: global.invertGlyphs,
    invertImage: layer.settings.invertImage,
    color: layer.settings.color,
    brightness: layer.settings.brightness,
    contrast: layer.settings.contrast
  };
}

// src/web/layer-list.ts
var dragSourceIndex = null;
var onSelectCallback = null;
var onReorderCallback = null;
var onVisibilityCallback = null;
function setupDragEvents(item) {
  item.addEventListener("dragstart", (e) => {
    dragSourceIndex = parseInt(item.dataset.index, 10);
    e.dataTransfer.effectAllowed = "move";
    item.style.opacity = "0.5";
  });
  item.addEventListener("dragend", () => {
    item.style.opacity = "";
    dragSourceIndex = null;
    for (const el2 of document.querySelectorAll(".layer-item.drag-over")) {
      el2.classList.remove("drag-over");
    }
  });
  item.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    item.classList.add("drag-over");
  });
  item.addEventListener("dragleave", () => {
    item.classList.remove("drag-over");
  });
  item.addEventListener("drop", (e) => {
    e.preventDefault();
    item.classList.remove("drag-over");
    const targetIndex = parseInt(item.dataset.index, 10);
    if (dragSourceIndex !== null && dragSourceIndex !== targetIndex) {
      moveLayer(dragSourceIndex, targetIndex);
      renderLayerList();
      onReorderCallback?.();
    }
  });
}
function startRename(item, nameSpan, layer) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "layer-name-input";
  input.value = layer.name;
  item.draggable = false;
  let done = false;
  const finish = (commit) => {
    if (done) return;
    done = true;
    const name = input.value.trim();
    if (commit && name) renameLayer(layer.id, name);
    renderLayerList();
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    else if (e.key === "Escape") finish(false);
  });
  input.addEventListener("blur", () => finish(true));
  input.addEventListener("click", (e) => e.stopPropagation());
  nameSpan.replaceWith(input);
  input.focus();
  input.select();
}
function renderLayerList() {
  const state = getLayerState();
  const container = DOM.layerList;
  container.innerHTML = "";
  for (let i = state.layers.length - 1; i >= 0; i--) {
    const layer = state.layers[i];
    const item = document.createElement("div");
    item.className = "layer-item" + (layer.id === state.selectedLayerId ? " selected" : "") + (layer.visible ? "" : " hidden-layer");
    item.draggable = true;
    item.dataset.layerId = layer.id;
    item.dataset.index = String(i);
    const visibleCheck = document.createElement("input");
    visibleCheck.type = "checkbox";
    visibleCheck.className = "layer-visible";
    visibleCheck.checked = layer.visible;
    visibleCheck.title = "Toggle visibility";
    visibleCheck.setAttribute("aria-label", `Show ${layer.name}`);
    visibleCheck.addEventListener("click", (e) => e.stopPropagation());
    visibleCheck.addEventListener("change", () => {
      layer.visible = visibleCheck.checked;
      item.classList.toggle("hidden-layer", !layer.visible);
      onVisibilityCallback?.();
    });
    const nameSpan = document.createElement("span");
    nameSpan.className = "layer-name";
    nameSpan.textContent = layer.name;
    nameSpan.title = "Double-click to rename";
    nameSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      startRename(item, nameSpan, layer);
    });
    const indicator = document.createElement("span");
    indicator.className = "layer-image-indicator";
    indicator.textContent = (layer.settings.imageData ? "[image]" : "[empty]") + (layer.settings.crop.length > 0 ? " [crop]" : "");
    item.appendChild(visibleCheck);
    item.appendChild(nameSpan);
    item.appendChild(indicator);
    item.addEventListener("click", () => {
      if (getLayerState().selectedLayerId === layer.id) return;
      selectLayer(layer.id);
      for (const el2 of container.querySelectorAll(".layer-item")) {
        el2.classList.toggle("selected", el2 === item);
      }
      onSelectCallback?.();
    });
    setupDragEvents(item);
    container.appendChild(item);
  }
}
function initLayerList(onSelect, onReorder, onVisibilityChange) {
  onSelectCallback = onSelect;
  onReorderCallback = onReorder;
  onVisibilityCallback = onVisibilityChange;
  renderLayerList();
}

// src/web/merge.ts
function mergeGrids(layers) {
  const grids = layers.filter((g) => g !== null);
  if (grids.length === 0) return null;
  if (grids.length === 1) return grids[0];
  const rows = Math.max(...grids.map((g) => g.lines.length));
  const cols = Math.max(
    ...grids.map((g) => Math.max(0, ...g.lines.map((l) => l.length)))
  );
  const colored = grids.some((g) => g.colors);
  const lines = [];
  const colors = [];
  for (let row = 0; row < rows; row++) {
    const chars = new Array(cols).fill(" ");
    const rowColors = new Int32Array(cols).fill(-1);
    for (const grid of grids) {
      const line = grid.lines[row];
      if (!line) continue;
      for (let col = 0; col < line.length; col++) {
        if (line[col] === " ") continue;
        chars[col] = line[col];
        rowColors[col] = grid.colors ? grid.colors[row][col] : -1;
      }
    }
    lines.push(chars);
    colors.push(rowColors);
  }
  return { lines, colors: colored ? colors : null };
}

// src/web/output.ts
var current = null;
function showGrid(grid) {
  current = grid;
  if (!grid) {
    DOM.output.textContent = "";
  } else if (grid.colors) {
    DOM.output.innerHTML = gridToHtml(grid);
  } else {
    DOM.output.textContent = gridToText(grid);
  }
}
function outputGrid() {
  return current;
}
function outputColors() {
  return DOM.invertGlyphsCheck.checked ? { background: 16777215, foreground: 0 } : { background: 0, foreground: 15658734 };
}
function hex2(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}
function outputStyle() {
  const { background, foreground } = outputColors();
  return {
    background: hex2(background),
    foreground: hex2(foreground),
    fontFamily: DOM.output.style.fontFamily || "monospace",
    lineHeight: DOM.output.style.lineHeight || "normal"
  };
}

// src/web/charset.ts
var TEXT_DEBOUNCE_MS = 300;
var CharsetControls = class {
  constructor(getSettings, onChange) {
    __publicField(this, "getSettings");
    __publicField(this, "onChange");
    __publicField(this, "debounceTimer");
    this.getSettings = getSettings;
    this.onChange = onChange;
    for (const radio of [DOM.charSourceBlocks, DOM.charSourceCustom]) {
      radio.addEventListener("change", () => {
        const settings = this.getSettings();
        if (!settings) return;
        settings.charSource = radio.value;
        this.render();
        this.onChange();
      });
    }
    DOM.includeInput.addEventListener("input", () => {
      const settings = this.getSettings();
      if (!settings) return;
      settings.includeChars = DOM.includeInput.value;
      this.scheduleChange();
    });
    DOM.excludeInput.addEventListener("input", () => {
      const settings = this.getSettings();
      if (!settings) return;
      settings.excludeChars = DOM.excludeInput.value;
      this.scheduleChange();
    });
    this.render();
  }
  scheduleChange() {
    this.renderCount();
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(this.onChange, TEXT_DEBOUNCE_MS);
  }
  /** Refresh the charset UI to match the current layer's settings. */
  render() {
    const settings = this.getSettings();
    if (!settings) return;
    const custom = settings.charSource === "custom";
    DOM.charSourceBlocks.checked = !custom;
    DOM.charSourceCustom.checked = custom;
    DOM.includeInput.value = settings.includeChars;
    DOM.excludeInput.value = settings.excludeChars;
    DOM.includeField.style.display = custom ? "" : "none";
    DOM.blockSelector.style.display = custom ? "none" : "";
    this.renderCount();
  }
  /** Update the palette size label (call after block selection changes). */
  renderCount() {
    const settings = this.getSettings();
    if (!settings) return;
    DOM.charCount.textContent = `${resolveChars(settings).length} chars`;
  }
};

// src/web/crop.ts
var SVG_NS = "http://www.w3.org/2000/svg";
function rectToCells(rect, cols) {
  return {
    c0: Math.round(rect.x * cols),
    r0: Math.round(rect.y * cols),
    c1: Math.round((rect.x + rect.w) * cols),
    r1: Math.round((rect.y + rect.h) * cols)
  };
}
function cellsToRect(range, cols) {
  return {
    x: range.c0 / cols,
    y: range.r0 / cols,
    w: (range.c1 - range.c0) / cols,
    h: (range.r1 - range.r0) / cols
  };
}
function cropMask(crop, cols, rows) {
  const mask = new Uint8Array(cols * rows);
  if (crop[0]?.op === "subtract") mask.fill(1);
  for (const shape of crop) {
    const { c0, r0, c1, r1 } = rectToCells(shape.rect, cols);
    const value = shape.op === "union" ? 1 : 0;
    for (let row = Math.max(0, r0); row < Math.min(r1, rows); row++) {
      for (let col = Math.max(0, c0); col < Math.min(c1, cols); col++) {
        mask[row * cols + col] = value;
      }
    }
  }
  return mask;
}
function combineCrop(crop, mode2, rect) {
  if (mode2 === "replace") return [{ op: "union", rect }];
  return [...crop, { op: mode2, rect }];
}
function applyCrop(grid, crop) {
  if (crop.length === 0) return grid;
  const cols = Math.max(0, ...grid.lines.map((l) => l.length));
  const mask = cropMask(crop, cols, grid.lines.length);
  const kept = (row, col) => mask[row * cols + col] === 1;
  return {
    lines: grid.lines.map(
      (line, row) => line.map((ch, col) => kept(row, col) ? ch : " ")
    ),
    colors: grid.colors?.map(
      (rowColors, row) => rowColors.map((c, col) => kept(row, col) ? c : -1)
    ) ?? null
  };
}
function maskPaths(mask, cols, rows) {
  const at = (c, r) => c >= 0 && c < cols && r >= 0 && r < rows ? mask[r * cols + c] : 0;
  let fill = "";
  let edge = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!at(c, r)) continue;
      const start = c;
      while (at(c + 1, r)) c++;
      fill += `M${start} ${r}h${c + 1 - start}v1h${start - c - 1}z`;
    }
  }
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (at(c, r - 1) === at(c, r)) continue;
      const start = c;
      while (c + 1 < cols && at(c + 1, r - 1) !== at(c + 1, r)) c++;
      edge += `M${start} ${r}h${c + 1 - start}`;
    }
  }
  for (let c = 0; c <= cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (at(c - 1, r) === at(c, r)) continue;
      const start = r;
      while (r + 1 < rows && at(c - 1, r + 1) !== at(c, r + 1)) r++;
      edge += `M${c} ${start}v${r + 1 - start}`;
    }
  }
  return { fill, edge };
}
function outputGeometry() {
  const text = DOM.output.textContent ?? "";
  if (text.length === 0) return null;
  const lines = text.split("\n");
  const rows = lines.length;
  const cols = Math.max(...lines.map((l) => [...l].length));
  if (cols === 0) return null;
  const cs = getComputedStyle(DOM.output);
  const padL = parseFloat(cs.paddingLeft);
  const padT = parseFloat(cs.paddingTop);
  const contentW = DOM.output.clientWidth - padL - parseFloat(cs.paddingRight);
  const contentH = DOM.output.clientHeight - padT - parseFloat(cs.paddingBottom);
  return {
    rows,
    cols,
    // Content-box offset within the output element (border + padding)
    insetX: DOM.output.clientLeft + padL,
    insetY: DOM.output.clientTop + padT,
    contentW,
    contentH,
    cellW: contentW / cols,
    cellH: contentH / rows
  };
}
function svgEl(tag, cls) {
  const el2 = document.createElementNS(SVG_NS, tag);
  el2.setAttribute("class", cls);
  return el2;
}
var CropSelector = class {
  constructor(getLayer, onChange) {
    __publicField(this, "getLayer");
    __publicField(this, "onChange");
    __publicField(this, "active", false);
    __publicField(this, "drag", null);
    __publicField(this, "svg", svgEl("svg", "crop-mask"));
    __publicField(this, "fillPath", svgEl("path", "crop-fill"));
    __publicField(this, "edgePath", svgEl("path", "crop-edge"));
    this.getLayer = getLayer;
    this.onChange = onChange;
    this.svg.setAttribute("preserveAspectRatio", "none");
    this.svg.append(this.fillPath, this.edgePath);
    DOM.cropOverlay.before(this.svg);
    DOM.cropBtn.addEventListener("click", () => this.setActive(!this.active));
    DOM.clearCropBtn.addEventListener("click", () => {
      const layer = this.getLayer();
      if (!layer || layer.settings.crop.length === 0) return;
      layer.settings.crop = [];
      this.onChange();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.active) this.setActive(false);
    });
    DOM.output.addEventListener("pointerdown", (e) => {
      if (!this.active || e.button !== 0) return;
      const cell = this.cellAt(e);
      if (!cell) return;
      e.preventDefault();
      DOM.output.setPointerCapture(e.pointerId);
      const mode2 = e.shiftKey ? "union" : e.altKey || e.metaKey ? "subtract" : "replace";
      this.drag = { start: cell, mode: mode2 };
      this.drawDrag(cell);
    });
    DOM.output.addEventListener("pointermove", (e) => {
      if (!this.drag) return;
      const cell = this.cellAt(e);
      if (cell) this.drawDrag(cell);
    });
    DOM.output.addEventListener("pointerup", (e) => {
      if (!this.drag) return;
      const crop = this.pendingCrop(this.cellAt(e) ?? this.drag.start);
      this.drag = null;
      const layer = this.getLayer();
      if (crop && layer) {
        layer.settings.crop = crop;
        this.onChange();
      } else {
        this.render();
      }
    });
  }
  setActive(active) {
    this.active = active;
    this.drag = null;
    DOM.output.classList.toggle("cropping", active);
    DOM.cropBtn.textContent = active ? "Done" : "Select Region";
    this.render();
  }
  cellAt(e) {
    const geom = outputGeometry();
    if (!geom) return null;
    const rect = DOM.output.getBoundingClientRect();
    const x = e.clientX - rect.left - geom.insetX;
    const y = e.clientY - rect.top - geom.insetY;
    const clamp = (v, max) => Math.min(max - 1, Math.max(0, Math.floor(v)));
    return {
      col: clamp(x / geom.cellW, geom.cols),
      row: clamp(y / geom.cellH, geom.rows)
    };
  }
  rangeFrom(a, b) {
    return {
      c0: Math.min(a.col, b.col),
      r0: Math.min(a.row, b.row),
      c1: Math.max(a.col, b.col) + 1,
      r1: Math.max(a.row, b.row) + 1
    };
  }
  /** The selected layer's crop as it would be if the drag ended at `end`. */
  pendingCrop(end) {
    const geom = outputGeometry();
    const layer = this.getLayer();
    if (!this.drag || !geom || !layer) return null;
    const range = this.rangeFrom(this.drag.start, end);
    const rect = cellsToRect(range, geom.cols);
    return combineCrop(layer.settings.crop, this.drag.mode, rect);
  }
  /** Preview the resulting region plus the rectangle being dragged. */
  drawDrag(end) {
    if (!this.drag) return;
    this.drawMask(this.pendingCrop(end) ?? []);
    this.drawRect(this.rangeFrom(this.drag.start, end), this.drag.mode);
  }
  drawRect(range, mode2) {
    const geom = outputGeometry();
    const overlay = DOM.cropOverlay;
    if (!geom || !range || !mode2) {
      overlay.style.display = "none";
      return;
    }
    overlay.style.display = "block";
    overlay.dataset.mode = mode2;
    const left = DOM.output.offsetLeft + geom.insetX;
    const top = DOM.output.offsetTop + geom.insetY;
    overlay.style.left = `${left + range.c0 * geom.cellW}px`;
    overlay.style.top = `${top + range.r0 * geom.cellH}px`;
    overlay.style.width = `${(range.c1 - range.c0) * geom.cellW}px`;
    overlay.style.height = `${(range.r1 - range.r0) * geom.cellH}px`;
  }
  drawMask(crop) {
    const geom = outputGeometry();
    if (!geom || crop.length === 0) {
      this.svg.style.display = "none";
      return;
    }
    const { fill, edge } = maskPaths(
      cropMask(crop, geom.cols, geom.rows),
      geom.cols,
      geom.rows
    );
    const s = this.svg.style;
    s.display = "block";
    s.left = `${DOM.output.offsetLeft + geom.insetX}px`;
    s.top = `${DOM.output.offsetTop + geom.insetY}px`;
    s.width = `${geom.contentW}px`;
    s.height = `${geom.contentH}px`;
    this.svg.setAttribute("viewBox", `0 0 ${geom.cols} ${geom.rows}`);
    this.fillPath.setAttribute("d", fill);
    this.edgePath.setAttribute("d", edge);
  }
  /** Redraw the selected layer's crop overlay and crop controls. */
  render() {
    const crop = this.getLayer()?.settings.crop ?? [];
    DOM.clearCropBtn.disabled = crop.length === 0;
    if (this.drag) return;
    this.drawRect(null);
    this.drawMask(crop);
  }
};

// src/web/statusbar.ts
var DEFAULT_BASE_NAME = "ansi-warhol";
var MIME_TYPES = {
  txt: "text/plain;charset=utf-8",
  ans: "text/plain;charset=utf-8",
  html: "text/html;charset=utf-8"
};
function outputText() {
  return DOM.output.textContent ?? "";
}
function saveFileName(format) {
  const image = DOM.fileInput.files?.[0]?.name;
  const base = image ? image.replace(/\.[^.]+$/, "") : DEFAULT_BASE_NAME;
  return `${base}.${format}`;
}
function exportOutput(format) {
  const grid = outputGrid();
  if (!grid) return null;
  if (format === "html") return gridToHtmlDocument(grid, outputStyle());
  if (format === "ans") {
    const { background, foreground } = outputColors();
    return gridToAnsi(grid, background, foreground);
  }
  return gridToText(grid);
}
function flashStatus(message) {
  DOM.status.textContent = message;
}
async function copyOutput() {
  const grid = outputGrid();
  if (!grid) return;
  const text = gridToText(grid);
  try {
    if (grid.colors && typeof ClipboardItem !== "undefined") {
      const s = outputStyle();
      const html = `<pre style="background:${s.background};color:${s.foreground};font-family:${s.fontFamily};line-height:${s.lineHeight}">${gridToHtml(grid)}</pre>`;
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" })
        })
      ]);
    } else {
      await navigator.clipboard.writeText(text);
    }
    flashStatus(`Copied ${text.split("\n").length} lines to the clipboard.`);
  } catch (err) {
    flashStatus(`Copy failed: ${err.message}`);
  }
}
function saveOutput() {
  const format = DOM.saveFormat.value;
  const content = exportOutput(format);
  if (content === null) return;
  const blob = new Blob([content], { type: MIME_TYPES[format] });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = saveFileName(format);
  link.click();
  URL.revokeObjectURL(url);
  flashStatus(`Saved ${link.download}.`);
}
function initStatusBar(onNewImage) {
  const syncEnabled = () => {
    const empty = outputText().length === 0;
    DOM.copyBtn.disabled = empty;
    DOM.saveBtn.disabled = empty;
  };
  new MutationObserver(syncEnabled).observe(DOM.output, {
    childList: true,
    characterData: true,
    subtree: true
  });
  syncEnabled();
  DOM.copyBtn.addEventListener("click", copyOutput);
  DOM.saveBtn.addEventListener("click", saveOutput);
  DOM.newImageBtn.addEventListener("click", () => {
    if (onNewImage()) DOM.fileInput.value = "";
  });
}

// src/web/app.ts
function populateControlsFromLayer(layer) {
  DOM.brightnessInput.value = layer.settings.brightness.toFixed(2);
  DOM.brightnessRange.value = layer.settings.brightness.toFixed(2);
  DOM.contrastInput.value = layer.settings.contrast.toFixed(2);
  DOM.contrastRange.value = layer.settings.contrast.toFixed(2);
  DOM.invertImageCheck.checked = layer.settings.invertImage;
  DOM.colorCheck.checked = layer.settings.color;
  DOM.distanceSelect.value = layer.settings.distance_fn;
  blockPicker.renderBlockLists();
  charsetControls.render();
  cropSelector.render();
  updateOutputColors();
  if (layer.settings.imageData) {
    renderPreview(
      layer.settings.imageData,
      layer.settings.brightness,
      layer.settings.contrast,
      layer.settings.invertImage
    );
  } else {
    DOM.preview.style.display = "none";
  }
}
function saveControlsToLayer() {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.settings.brightness = parseFloat(DOM.brightnessInput.value) || 0;
  layer.settings.contrast = parseFloat(DOM.contrastInput.value) || 1;
  layer.settings.invertImage = DOM.invertImageCheck.checked;
  layer.settings.color = DOM.colorCheck.checked;
  layer.settings.distance_fn = DOM.distanceSelect.value;
}
function onControlChange() {
  saveControlsToLayer();
  charsetControls.renderCount();
  run();
}
function croppedGrid(result, layer) {
  return applyCrop(
    gridFromText(result.ascii, result.colors),
    layer.settings.crop
  );
}
async function run() {
  const state = getLayerState();
  const global = getGlobalParams();
  if (!global) return;
  applyFontStyle(global.fontName, global.lineHeight);
  DOM.status.textContent = "Converting...";
  await new Promise((r) => setTimeout(r, 50));
  await document.fonts.ready;
  try {
    const t0 = performance.now();
    const backend = gpuRenderer ? "WebGPU" : "CPU";
    const render = gpuRenderer ? gpuRenderer.pngToAscii.bind(gpuRenderer) : pngToAscii;
    const layerResults = [];
    let lastStats = null;
    for (const layer of state.layers) {
      if (!layer.visible || !layer.settings.imageData) {
        layerResults.push(null);
        continue;
      }
      const p = buildConvertParams(layer, global);
      if (p.chars.length <= 1) {
        layerResults.push(null);
        continue;
      }
      const result = await render(
        layer.settings.imageData,
        p.width,
        browserCanvasFactory,
        p.distance_fn,
        p.chars,
        p.fontRatio,
        p.invertGlyphs,
        p.invertImage,
        p.brightness,
        p.contrast,
        p.fontName,
        p.lineHeight,
        p.color
      );
      layerResults.push(croppedGrid(result, layer));
      lastStats = result.stats;
    }
    showGrid(mergeGrids(layerResults));
    cropSelector.render();
    const selected = getSelectedLayer();
    if (selected?.settings.imageData) {
      renderPreview(
        selected.settings.imageData,
        selected.settings.brightness,
        selected.settings.contrast,
        selected.settings.invertImage
      );
    }
    if (lastStats) renderStats(lastStats);
    const ms = (performance.now() - t0).toFixed(0);
    const layerCount = layerResults.filter((r) => r !== null).length;
    DOM.status.textContent = `Done (${backend}) \u2014 ${global.width} cols, ${layerCount} layer(s) in ${ms}ms`;
  } catch (err) {
    DOM.status.textContent = `Error: ${err.message}`;
    console.error(err);
  }
}
async function autoFit() {
  const selected = getSelectedLayer();
  if (!selected?.settings.imageData) return;
  const global = getGlobalParams();
  if (!global) return;
  const p = buildConvertParams(selected, global);
  if (p.chars.length <= 1) return;
  applyFontStyle(global.fontName, global.lineHeight);
  DOM.status.textContent = "Auto-fitting brightness & contrast...";
  showGrid(null);
  await new Promise((r) => setTimeout(r, 50));
  await document.fonts.ready;
  try {
    const t0 = performance.now();
    const backend = gpuRenderer ? "WebGPU" : "CPU";
    let result;
    if (gpuRenderer) {
      for await (const r of gpuRenderer.estimateAscii(
        selected.settings.imageData,
        p.width,
        browserCanvasFactory,
        global.evaluate_fn,
        p.distance_fn,
        p.chars,
        p.fontRatio,
        p.invertGlyphs,
        p.invertImage,
        p.fontName,
        p.lineHeight,
        p.color
      )) {
        result = r;
        showGrid(croppedGrid(r, selected));
        renderPreview(
          selected.settings.imageData,
          r.brightness,
          r.contrast,
          p.invertImage
        );
        DOM.status.textContent = `${backend} \u2014 searching...`;
      }
    } else {
      for (const r of estimateAscii(
        selected.settings.imageData,
        p.width,
        browserCanvasFactory,
        global.evaluate_fn,
        p.distance_fn,
        p.chars,
        p.fontRatio,
        p.invertGlyphs,
        p.invertImage,
        p.fontName,
        p.lineHeight,
        p.color
      )) {
        result = r;
        showGrid(croppedGrid(r, selected));
        renderPreview(
          selected.settings.imageData,
          r.brightness,
          r.contrast,
          p.invertImage
        );
        DOM.status.textContent = `${backend} \u2014 searching...`;
        await new Promise((x) => requestAnimationFrame(x));
      }
    }
    if (!result) return;
    selected.settings.brightness = result.brightness;
    selected.settings.contrast = result.contrast;
    renderStats(result.stats);
    DOM.brightnessInput.value = result.brightness.toFixed(2);
    DOM.brightnessRange.value = result.brightness.toFixed(2);
    DOM.contrastInput.value = result.contrast.toFixed(2);
    DOM.contrastRange.value = result.contrast.toFixed(2);
    await run();
    const ms = (performance.now() - t0).toFixed(0);
    DOM.status.textContent = `Done (${backend}) \u2014 auto-fit in ${ms}ms`;
  } catch (err) {
    DOM.status.textContent = `Error: ${err.message}`;
    console.error(err);
  }
}
var firstLayer = addLayer();
selectLayer(firstLayer.id);
var blockPicker = new BlockPicker(
  () => getSelectedLayer()?.settings.enabledBlocks ?? /* @__PURE__ */ new Set(),
  (blocks) => {
    const layer = getSelectedLayer();
    if (layer) layer.settings.enabledBlocks = blocks;
  },
  onControlChange
);
var charsetControls = new CharsetControls(
  () => getSelectedLayer()?.settings,
  run
);
var cropSelector = new CropSelector(getSelectedLayer, () => {
  renderLayerList();
  run();
});
for (const key of Object.keys(DISTANCE_FNS)) {
  const opt = document.createElement("option");
  opt.value = key;
  opt.textContent = key;
  DOM.distanceSelect.appendChild(opt);
}
for (const key of Object.keys(EVALUTATE_FNS)) {
  const opt = document.createElement("option");
  opt.value = key;
  opt.textContent = key;
  DOM.evaluateSelect.appendChild(opt);
}
bindSlider(DOM.widthRange, DOM.widthInput, run);
bindSlider(DOM.brightnessRange, DOM.brightnessInput, onControlChange);
bindSlider(DOM.contrastRange, DOM.contrastInput, onControlChange);
function onLayerSelect() {
  const layer = getSelectedLayer();
  if (layer) populateControlsFromLayer(layer);
}
initLayerList(onLayerSelect, run, run);
initStatusBar(() => {
  const hasImages = getLayerState().layers.some((l) => l.settings.imageData);
  if (hasImages && !confirm("Discard all layers and start a new image?")) {
    return false;
  }
  const layer = resetLayers();
  selectLayer(layer.id);
  renderLayerList();
  onLayerSelect();
  showGrid(null);
  DOM.stats.style.display = "none";
  DOM.autoBtn.disabled = true;
  DOM.status.textContent = "Select an image to begin.";
  return true;
});
DOM.addLayerBtn.addEventListener("click", () => {
  const current2 = getSelectedLayer();
  const layer = addLayer(void 0, current2);
  selectLayer(layer.id);
  renderLayerList();
  onLayerSelect();
  run();
});
DOM.removeLayerBtn.addEventListener("click", () => {
  const state = getLayerState();
  if (state.layers.length <= 1) return;
  removeLayer(state.selectedLayerId);
  selectLayer(state.layers[state.layers.length - 1].id);
  renderLayerList();
  onLayerSelect();
  run();
});
WebGPURenderer.create().then((r) => {
  setGpuRenderer(r);
  console.log("WebGPU renderer initialized");
}).catch((err) => {
  console.warn("WebGPU not available, using CPU fallback:", err.message);
});
DOM.fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const layer = getSelectedLayer();
  if (!layer) return;
  DOM.status.textContent = "Loading image...";
  showGrid(null);
  const img = new Image();
  img.onload = () => {
    DOM.hiddenCanvas.width = img.width;
    DOM.hiddenCanvas.height = img.height;
    const ctx = DOM.hiddenCanvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    layer.settings.imageData = ctx.getImageData(0, 0, img.width, img.height);
    renderLayerList();
    DOM.autoBtn.disabled = false;
    run();
  };
  img.onerror = () => {
    DOM.status.textContent = "Failed to load image.";
  };
  img.src = URL.createObjectURL(file);
});
DOM.resetBCBtn.addEventListener("click", () => {
  DOM.brightnessInput.value = "0";
  DOM.brightnessRange.value = "0";
  DOM.contrastInput.value = "1";
  DOM.contrastRange.value = "1";
  onControlChange();
});
DOM.invertImageCheck.addEventListener("change", onControlChange);
DOM.colorCheck.addEventListener("change", onControlChange);
DOM.distanceSelect.addEventListener("change", onControlChange);
DOM.invertGlyphsCheck.addEventListener("change", () => {
  updateOutputColors();
  run();
});
DOM.fontInput.addEventListener("change", run);
DOM.lineHeightInput.addEventListener("change", run);
DOM.evaluateSelect.addEventListener("change", run);
DOM.autoBtn.addEventListener("click", autoFit);
