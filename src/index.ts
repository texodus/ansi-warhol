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

export {
	buildCharList,
	computeStats,
	createCharacterPortraits,
	DEFAULT_BLOCKS,
	estimateAscii,
	measureFontRatio,
	pngToAscii,
	UNICODE_BLOCKS,
} from "./ascii";
export type { CanvasFactory } from "./canvas-factory";
export { browserCanvasFactory } from "./canvas-factory";
export type { GlyphEntry } from "./distance";
export { DISTANCE_FNS } from "./distance";
export { EVALUTATE_FNS } from "./evaluate";
export type { AsciiResult, AsciiStats, RawImage } from "./types";
export { WebGPURenderer } from "./webgpu";
