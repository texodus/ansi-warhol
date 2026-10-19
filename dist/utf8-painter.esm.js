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
function measureFontRatio(canvasFactory, fontName = "monospace", lineHeight = "normal") {
  const size = 100;
  const ctx = canvasFactory(size, size);
  ctx.font = `${size}px ${fontName}`;
  ctx.textRendering = "geometricPrecision";
  const metrics = ctx.measureText("M");
  let effectiveHeight;
  if (lineHeight === "normal") {
    effectiveHeight = metrics.fontBoundingBoxAscent !== void 0 ? metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent : size * 1.2;
  } else {
    effectiveHeight = size * lineHeight;
  }
  return metrics.width / effectiveHeight;
}
function samplePixel(png, glyphs, x, y, width, height, distance_fn, brightness = 0, contrast = 1, invertImage = false) {
  const x0 = Math.floor(x / width * png.width);
  const x1 = Math.floor((x + 1) / width * png.width);
  const y0 = Math.floor(y / height * png.height);
  const y1 = Math.floor((y + 1) / height * png.height);
  const regionW = x1 - x0;
  const regionH = y1 - y0;
  const glyphW = glyphs[0].width;
  const glyphH = glyphs[0].height;
  const n = glyphW * glyphH;
  const srcLum = new Float32Array(n);
  let sumS = 0, sumS2 = 0;
  for (let gy = 0; gy < glyphH; gy++) {
    const srcY = y0 + Math.floor(gy / glyphH * regionH);
    for (let gx = 0; gx < glyphW; gx++) {
      const srcX = x0 + Math.floor(gx / glyphW * regionW);
      const srcIdx = (png.width * srcY + srcX) * 4;
      let lum = 0.299 * png.data[srcIdx] + 0.587 * png.data[srcIdx + 1] + 0.114 * png.data[srcIdx + 2];
      lum = ((lum / 255 + brightness - 0.5) * contrast + 0.5) * 255;
      if (lum < 0) lum = 0;
      else if (lum > 255) lum = 255;
      if (invertImage) lum = 255 - lum;
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
      bestChar = glyphs[gi].char;
    }
  }
  return bestChar;
}
function mode(array) {
  if (array.length === 0)
    return null;
  var modeMap = {};
  var maxEl = array[0], maxCount = 1;
  for (let i = 0; i < array.length; i++) {
    let el = array[i];
    if (modeMap[el] == null)
      modeMap[el] = 1;
    else
      modeMap[el]++;
    if (modeMap[el] > maxCount) {
      maxEl = el;
      maxCount = modeMap[el];
    }
  }
  return maxEl;
}
function createCharacterPortraits(scale, canvasFactory, chars = ASCII_CHARS, fontRatio, invertGlyphs = false, fontName = "monospace") {
  const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName);
  const w = Math.floor(scale * ratio);
  const h = scale;
  const ctx = canvasFactory(w, h);
  ctx.font = `${scale}px ${fontName}`;
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
    ctx.textBaseline = "middle";
    ctx.fillText(ch, w / 2, h / 2);
    const imageData = ctx.getImageData(0, 0, w, h);
    const n = w * h;
    const lum = new Float32Array(n);
    let sumG = 0, sumG2 = 0;
    for (let i2 = 0; i2 < n; i2++) {
      const idx = i2 * 4;
      let l = 0.299 * imageData.data[idx] + 0.587 * imageData.data[idx + 1] + 0.114 * imageData.data[idx + 2];
      if (invertGlyphs) l = 255 - l;
      lum[i2] = l;
      sumG += l;
      sumG2 += l * l;
    }
    glyphs.push({ char: ch, lum, width: w, height: h, sumG, sumG2 });
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
function renderAscii(png, width, glyphs, distance_fn, brightness = 0, contrast = 1, fontRatio = 0.5, invertImage = false) {
  const cell_width = Math.floor(png.width / width);
  const cell_height = Math.ceil(cell_width / fontRatio);
  const height = Math.round(png.height / cell_height);
  const lines = [];
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
        invertImage
      );
    }
    lines.push(line);
  }
  const ascii = lines.join("\n");
  const stats = computeStats(ascii, cell_width, cell_height, width, height, glyphs.length);
  return { ascii, stats };
}
function* estimateAscii(png, width, canvasFactory, evaluate_fn, distance_fn, chars = ASCII_CHARS, fontRatio, invertGlyphs = false, invertImage = false, fontName = "monospace") {
  const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName);
  const cell_width = Math.floor(png.width / width);
  const cell_height = Math.ceil(cell_width / ratio);
  const glyphs = createCharacterPortraits(cell_height, canvasFactory, chars, ratio, invertGlyphs, fontName);
  let contrast = 4;
  let brightness = 0.1;
  function f(c, b) {
    const { ascii, stats } = renderAscii(png, width, glyphs, distance_fn, b, c, ratio, invertImage);
    const val = EVALUTATE_FNS[evaluate_fn](
      ascii.split("").map((x) => chars.indexOf(x))
    );
    return { val, ascii, stats };
  }
  let cur = f(contrast, brightness);
  yield { ascii: cur.ascii, brightness, contrast, stats: cur.stats };
  console.log(`Contrast ${contrast}, Brightness ${brightness}, Total ${cur.val}`);
  let bestC = contrast, bestB = brightness, bestF = cur.val;
  const cSteps = 10, bSteps = 10;
  const cMin = 0.5, cMax = 8;
  const bMin = -0.5, bMax = 0.5;
  for (let ci = 0; ci <= cSteps; ci++) {
    for (let bi = 0; bi <= bSteps; bi++) {
      const c = cMin + (cMax - cMin) * ci / cSteps;
      const b = bMin + (bMax - bMin) * bi / bSteps;
      cur = f(c, b);
      yield { ascii: cur.ascii, brightness: b, contrast: c, stats: cur.stats };
      console.log(`  Search -- Contrast ${c}, Brightness ${b}, Total ${cur.val}`);
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
      yield { ascii: cur.ascii, brightness: b, contrast: c, stats: cur.stats };
      console.log(`  Refine -- Contrast ${c}, Brightness ${b}, Total ${cur.val}`);
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
  console.log(
    `Final -- Contrast ${contrast}, Brightness ${brightness}`
  );
  return { ascii: cur.ascii, brightness, contrast, stats: cur.stats };
}
function pngToAscii(png, width, canvasFactory, distance_fn, chars = ASCII_CHARS, fontRatio, invertGlyphs = false, invertImage = false, brightness = 0, contrast = 1, fontName = "monospace") {
  const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName);
  const cell_width = Math.floor(png.width / width);
  const cell_height = Math.ceil(cell_width / ratio);
  const height = Math.round(png.height / (cell_width / ratio));
  console.log(`Palette cell size ${cell_width}w * ${cell_height}h`);
  console.log(`Output size ${width}w (fixed) * ${height}h`);
  const glyphs = createCharacterPortraits(cell_height, canvasFactory, chars, ratio, invertGlyphs, fontName);
  const { ascii, stats } = renderAscii(png, width, glyphs, distance_fn, brightness, contrast, ratio, invertImage);
  return { ascii, brightness, contrast, stats };
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
    img_width: u32,
    img_height: u32,
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
            if (uniforms.invert_image != 0u) {
                lum = 255.0 - lum;
            }
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
  async dispatch(png, glyphs, gridPoints, distanceFn, gridWidth, gridHeight, invertImage = false) {
    const device = this.device;
    const glyphW = glyphs[0].width;
    const glyphH = glyphs[0].height;
    const glyphN = glyphW * glyphH;
    const numGlyphs = glyphs.length;
    const numGridPoints = gridPoints.length;
    const totalCells = gridWidth * gridHeight;
    const totalItems = totalCells * numGridPoints;
    const pipeline = this.getPipeline(glyphN, distanceFn);
    const imageBuffer = device.createBuffer({
      size: png.data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(imageBuffer, 0, new Uint8Array(png.data));
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
      png.width,
      png.height,
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
  async renderAscii(png, width, glyphs, distance_fn, brightness = 0, contrast = 1, fontRatio = 0.5, invertImage = false) {
    const cell_width = Math.floor(png.width / width);
    const cell_height = Math.ceil(cell_width / fontRatio);
    const height = Math.round(png.height / (cell_width / fontRatio));
    const indices = await this.dispatch(
      png,
      glyphs,
      [{ brightness, contrast }],
      distance_fn,
      width,
      height,
      invertImage
    );
    const ascii = this.indicesToString(indices, glyphs, width, height);
    const stats = computeStats(ascii, cell_width, cell_height, width, height, glyphs.length);
    return { ascii, stats };
  }
  async *estimateAscii(png, width, canvasFactory, evaluate_fn, distance_fn, chars = ASCII_CHARS, fontRatio, invertGlyphs = false, invertImage = false, fontName = "monospace") {
    const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName);
    const cell_width = Math.floor(png.width / width);
    const cell_height = Math.ceil(cell_width / ratio);
    const height = Math.round(png.height / (cell_width / ratio));
    const glyphs = createCharacterPortraits(cell_height, canvasFactory, chars, ratio, invertGlyphs, fontName);
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
      png,
      glyphs,
      gridPoints,
      distance_fn,
      width,
      height,
      invertImage
    );
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
        i * totalCells
      );
      const val = evaluate(ascii);
      if (val > bestF) {
        bestF = val;
        bestAscii = ascii;
        bestC = gridPoints[i].contrast;
        bestB = gridPoints[i].brightness;
      }
    }
    let stats = computeStats(bestAscii, cell_width, cell_height, width, height, glyphs.length);
    yield { ascii: bestAscii, brightness: bestB, contrast: bestC, stats };
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
      png,
      glyphs,
      refinePoints,
      distance_fn,
      width,
      height,
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
        bestC = refinePoints[i].contrast;
        bestB = refinePoints[i].brightness;
      }
    }
    console.log(
      `Final -- Contrast ${bestC}, Brightness ${bestB}, Total ${bestF}`
    );
    stats = computeStats(bestAscii, cell_width, cell_height, width, height, glyphs.length);
    yield { ascii: bestAscii, brightness: bestB, contrast: bestC, stats };
    return { ascii: bestAscii, brightness: bestB, contrast: bestC, stats };
  }
  async pngToAscii(png, width, canvasFactory, distance_fn, chars = ASCII_CHARS, fontRatio, invertGlyphs = false, invertImage = false, brightness = 0, contrast = 1, fontName = "monospace") {
    const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName);
    const cell_width = Math.floor(png.width / width);
    const cell_height = Math.ceil(cell_width / ratio);
    const glyphs = createCharacterPortraits(cell_height, canvasFactory, chars, ratio, invertGlyphs, fontName);
    const { ascii, stats } = await this.renderAscii(png, width, glyphs, distance_fn, brightness, contrast, ratio, invertImage);
    return { ascii, brightness, contrast, stats };
  }
  destroy() {
    this.device.destroy();
  }
};
export {
  DEFAULT_BLOCKS,
  DISTANCE_FNS,
  EVALUTATE_FNS,
  UNICODE_BLOCKS,
  WebGPURenderer,
  browserCanvasFactory,
  buildCharList,
  computeStats,
  createCharacterPortraits,
  estimateAscii,
  measureFontRatio,
  pngToAscii
};
