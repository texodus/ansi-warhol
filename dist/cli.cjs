#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/chunkstream.js
var require_chunkstream = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/chunkstream.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var ChunkStream = module2.exports = function() {
      Stream.call(this);
      this._buffers = [];
      this._buffered = 0;
      this._reads = [];
      this._paused = false;
      this._encoding = "utf8";
      this.writable = true;
    };
    util.inherits(ChunkStream, Stream);
    ChunkStream.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
      process.nextTick(
        function() {
          this._process();
          if (this._paused && this._reads && this._reads.length > 0) {
            this._paused = false;
            this.emit("drain");
          }
        }.bind(this)
      );
    };
    ChunkStream.prototype.write = function(data, encoding) {
      if (!this.writable) {
        this.emit("error", new Error("Stream not writable"));
        return false;
      }
      let dataBuffer;
      if (Buffer.isBuffer(data)) {
        dataBuffer = data;
      } else {
        dataBuffer = Buffer.from(data, encoding || this._encoding);
      }
      this._buffers.push(dataBuffer);
      this._buffered += dataBuffer.length;
      this._process();
      if (this._reads && this._reads.length === 0) {
        this._paused = true;
      }
      return this.writable && !this._paused;
    };
    ChunkStream.prototype.end = function(data, encoding) {
      if (data) {
        this.write(data, encoding);
      }
      this.writable = false;
      if (!this._buffers) {
        return;
      }
      if (this._buffers.length === 0) {
        this._end();
      } else {
        this._buffers.push(null);
        this._process();
      }
    };
    ChunkStream.prototype.destroySoon = ChunkStream.prototype.end;
    ChunkStream.prototype._end = function() {
      if (this._reads.length > 0) {
        this.emit("error", new Error("Unexpected end of input"));
      }
      this.destroy();
    };
    ChunkStream.prototype.destroy = function() {
      if (!this._buffers) {
        return;
      }
      this.writable = false;
      this._reads = null;
      this._buffers = null;
      this.emit("close");
    };
    ChunkStream.prototype._processReadAllowingLess = function(read) {
      this._reads.shift();
      let smallerBuf = this._buffers[0];
      if (smallerBuf.length > read.length) {
        this._buffered -= read.length;
        this._buffers[0] = smallerBuf.slice(read.length);
        read.func.call(this, smallerBuf.slice(0, read.length));
      } else {
        this._buffered -= smallerBuf.length;
        this._buffers.shift();
        read.func.call(this, smallerBuf);
      }
    };
    ChunkStream.prototype._processRead = function(read) {
      this._reads.shift();
      let pos = 0;
      let count = 0;
      let data = Buffer.alloc(read.length);
      while (pos < read.length) {
        let buf = this._buffers[count++];
        let len = Math.min(buf.length, read.length - pos);
        buf.copy(data, pos, 0, len);
        pos += len;
        if (len !== buf.length) {
          this._buffers[--count] = buf.slice(len);
        }
      }
      if (count > 0) {
        this._buffers.splice(0, count);
      }
      this._buffered -= read.length;
      read.func.call(this, data);
    };
    ChunkStream.prototype._process = function() {
      try {
        while (this._buffered > 0 && this._reads && this._reads.length > 0) {
          let read = this._reads[0];
          if (read.allowLess) {
            this._processReadAllowingLess(read);
          } else if (this._buffered >= read.length) {
            this._processRead(read);
          } else {
            break;
          }
        }
        if (this._buffers && !this.writable) {
          this._end();
        }
      } catch (ex) {
        this.emit("error", ex);
      }
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/interlace.js
var require_interlace = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/interlace.js"(exports2) {
    "use strict";
    var imagePasses = [
      {
        // pass 1 - 1px
        x: [0],
        y: [0]
      },
      {
        // pass 2 - 1px
        x: [4],
        y: [0]
      },
      {
        // pass 3 - 2px
        x: [0, 4],
        y: [4]
      },
      {
        // pass 4 - 4px
        x: [2, 6],
        y: [0, 4]
      },
      {
        // pass 5 - 8px
        x: [0, 2, 4, 6],
        y: [2, 6]
      },
      {
        // pass 6 - 16px
        x: [1, 3, 5, 7],
        y: [0, 2, 4, 6]
      },
      {
        // pass 7 - 32px
        x: [0, 1, 2, 3, 4, 5, 6, 7],
        y: [1, 3, 5, 7]
      }
    ];
    exports2.getImagePasses = function(width, height) {
      let images = [];
      let xLeftOver = width % 8;
      let yLeftOver = height % 8;
      let xRepeats = (width - xLeftOver) / 8;
      let yRepeats = (height - yLeftOver) / 8;
      for (let i = 0; i < imagePasses.length; i++) {
        let pass = imagePasses[i];
        let passWidth = xRepeats * pass.x.length;
        let passHeight = yRepeats * pass.y.length;
        for (let j = 0; j < pass.x.length; j++) {
          if (pass.x[j] < xLeftOver) {
            passWidth++;
          } else {
            break;
          }
        }
        for (let j = 0; j < pass.y.length; j++) {
          if (pass.y[j] < yLeftOver) {
            passHeight++;
          } else {
            break;
          }
        }
        if (passWidth > 0 && passHeight > 0) {
          images.push({ width: passWidth, height: passHeight, index: i });
        }
      }
      return images;
    };
    exports2.getInterlaceIterator = function(width) {
      return function(x, y, pass) {
        let outerXLeftOver = x % imagePasses[pass].x.length;
        let outerX = (x - outerXLeftOver) / imagePasses[pass].x.length * 8 + imagePasses[pass].x[outerXLeftOver];
        let outerYLeftOver = y % imagePasses[pass].y.length;
        let outerY = (y - outerYLeftOver) / imagePasses[pass].y.length * 8 + imagePasses[pass].y[outerYLeftOver];
        return outerX * 4 + outerY * width * 4;
      };
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/paeth-predictor.js
var require_paeth_predictor = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/paeth-predictor.js"(exports2, module2) {
    "use strict";
    module2.exports = function paethPredictor(left, above, upLeft) {
      let paeth = left + above - upLeft;
      let pLeft = Math.abs(paeth - left);
      let pAbove = Math.abs(paeth - above);
      let pUpLeft = Math.abs(paeth - upLeft);
      if (pLeft <= pAbove && pLeft <= pUpLeft) {
        return left;
      }
      if (pAbove <= pUpLeft) {
        return above;
      }
      return upLeft;
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-parse.js
var require_filter_parse = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-parse.js"(exports2, module2) {
    "use strict";
    var interlaceUtils = require_interlace();
    var paethPredictor = require_paeth_predictor();
    function getByteWidth(width, bpp, depth) {
      let byteWidth = width * bpp;
      if (depth !== 8) {
        byteWidth = Math.ceil(byteWidth / (8 / depth));
      }
      return byteWidth;
    }
    var Filter = module2.exports = function(bitmapInfo, dependencies) {
      let width = bitmapInfo.width;
      let height = bitmapInfo.height;
      let interlace = bitmapInfo.interlace;
      let bpp = bitmapInfo.bpp;
      let depth = bitmapInfo.depth;
      this.read = dependencies.read;
      this.write = dependencies.write;
      this.complete = dependencies.complete;
      this._imageIndex = 0;
      this._images = [];
      if (interlace) {
        let passes = interlaceUtils.getImagePasses(width, height);
        for (let i = 0; i < passes.length; i++) {
          this._images.push({
            byteWidth: getByteWidth(passes[i].width, bpp, depth),
            height: passes[i].height,
            lineIndex: 0
          });
        }
      } else {
        this._images.push({
          byteWidth: getByteWidth(width, bpp, depth),
          height,
          lineIndex: 0
        });
      }
      if (depth === 8) {
        this._xComparison = bpp;
      } else if (depth === 16) {
        this._xComparison = bpp * 2;
      } else {
        this._xComparison = 1;
      }
    };
    Filter.prototype.start = function() {
      this.read(
        this._images[this._imageIndex].byteWidth + 1,
        this._reverseFilterLine.bind(this)
      );
    };
    Filter.prototype._unFilterType1 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f1Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        unfilteredLine[x] = rawByte + f1Left;
      }
    };
    Filter.prototype._unFilterType2 = function(rawData, unfilteredLine, byteWidth) {
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f2Up = lastLine ? lastLine[x] : 0;
        unfilteredLine[x] = rawByte + f2Up;
      }
    };
    Filter.prototype._unFilterType3 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f3Up = lastLine ? lastLine[x] : 0;
        let f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        let f3Add = Math.floor((f3Left + f3Up) / 2);
        unfilteredLine[x] = rawByte + f3Add;
      }
    };
    Filter.prototype._unFilterType4 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f4Up = lastLine ? lastLine[x] : 0;
        let f4Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        let f4UpLeft = x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0;
        let f4Add = paethPredictor(f4Left, f4Up, f4UpLeft);
        unfilteredLine[x] = rawByte + f4Add;
      }
    };
    Filter.prototype._reverseFilterLine = function(rawData) {
      let filter = rawData[0];
      let unfilteredLine;
      let currentImage = this._images[this._imageIndex];
      let byteWidth = currentImage.byteWidth;
      if (filter === 0) {
        unfilteredLine = rawData.slice(1, byteWidth + 1);
      } else {
        unfilteredLine = Buffer.alloc(byteWidth);
        switch (filter) {
          case 1:
            this._unFilterType1(rawData, unfilteredLine, byteWidth);
            break;
          case 2:
            this._unFilterType2(rawData, unfilteredLine, byteWidth);
            break;
          case 3:
            this._unFilterType3(rawData, unfilteredLine, byteWidth);
            break;
          case 4:
            this._unFilterType4(rawData, unfilteredLine, byteWidth);
            break;
          default:
            throw new Error("Unrecognised filter type - " + filter);
        }
      }
      this.write(unfilteredLine);
      currentImage.lineIndex++;
      if (currentImage.lineIndex >= currentImage.height) {
        this._lastLine = null;
        this._imageIndex++;
        currentImage = this._images[this._imageIndex];
      } else {
        this._lastLine = unfilteredLine;
      }
      if (currentImage) {
        this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
      } else {
        this._lastLine = null;
        this.complete();
      }
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-parse-async.js
var require_filter_parse_async = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-parse-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var ChunkStream = require_chunkstream();
    var Filter = require_filter_parse();
    var FilterAsync = module2.exports = function(bitmapInfo) {
      ChunkStream.call(this);
      let buffers = [];
      let that = this;
      this._filter = new Filter(bitmapInfo, {
        read: this.read.bind(this),
        write: function(buffer2) {
          buffers.push(buffer2);
        },
        complete: function() {
          that.emit("complete", Buffer.concat(buffers));
        }
      });
      this._filter.start();
    };
    util.inherits(FilterAsync, ChunkStream);
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/constants.js
var require_constants = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/constants.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      PNG_SIGNATURE: [137, 80, 78, 71, 13, 10, 26, 10],
      TYPE_IHDR: 1229472850,
      TYPE_IEND: 1229278788,
      TYPE_IDAT: 1229209940,
      TYPE_PLTE: 1347179589,
      TYPE_tRNS: 1951551059,
      // eslint-disable-line camelcase
      TYPE_gAMA: 1732332865,
      // eslint-disable-line camelcase
      // color-type bits
      COLORTYPE_GRAYSCALE: 0,
      COLORTYPE_PALETTE: 1,
      COLORTYPE_COLOR: 2,
      COLORTYPE_ALPHA: 4,
      // e.g. grayscale and alpha
      // color-type combinations
      COLORTYPE_PALETTE_COLOR: 3,
      COLORTYPE_COLOR_ALPHA: 6,
      COLORTYPE_TO_BPP_MAP: {
        0: 1,
        2: 3,
        3: 1,
        4: 2,
        6: 4
      },
      GAMMA_DIVISION: 1e5
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/crc.js
var require_crc = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/crc.js"(exports2, module2) {
    "use strict";
    var crcTable = [];
    (function() {
      for (let i = 0; i < 256; i++) {
        let currentCrc = i;
        for (let j = 0; j < 8; j++) {
          if (currentCrc & 1) {
            currentCrc = 3988292384 ^ currentCrc >>> 1;
          } else {
            currentCrc = currentCrc >>> 1;
          }
        }
        crcTable[i] = currentCrc;
      }
    })();
    var CrcCalculator = module2.exports = function() {
      this._crc = -1;
    };
    CrcCalculator.prototype.write = function(data) {
      for (let i = 0; i < data.length; i++) {
        this._crc = crcTable[(this._crc ^ data[i]) & 255] ^ this._crc >>> 8;
      }
      return true;
    };
    CrcCalculator.prototype.crc32 = function() {
      return this._crc ^ -1;
    };
    CrcCalculator.crc32 = function(buf) {
      let crc = -1;
      for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 255] ^ crc >>> 8;
      }
      return crc ^ -1;
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/parser.js
var require_parser = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/parser.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    var CrcCalculator = require_crc();
    var Parser = module2.exports = function(options, dependencies) {
      this._options = options;
      options.checkCRC = options.checkCRC !== false;
      this._hasIHDR = false;
      this._hasIEND = false;
      this._emittedHeadersFinished = false;
      this._palette = [];
      this._colorType = 0;
      this._chunks = {};
      this._chunks[constants.TYPE_IHDR] = this._handleIHDR.bind(this);
      this._chunks[constants.TYPE_IEND] = this._handleIEND.bind(this);
      this._chunks[constants.TYPE_IDAT] = this._handleIDAT.bind(this);
      this._chunks[constants.TYPE_PLTE] = this._handlePLTE.bind(this);
      this._chunks[constants.TYPE_tRNS] = this._handleTRNS.bind(this);
      this._chunks[constants.TYPE_gAMA] = this._handleGAMA.bind(this);
      this.read = dependencies.read;
      this.error = dependencies.error;
      this.metadata = dependencies.metadata;
      this.gamma = dependencies.gamma;
      this.transColor = dependencies.transColor;
      this.palette = dependencies.palette;
      this.parsed = dependencies.parsed;
      this.inflateData = dependencies.inflateData;
      this.finished = dependencies.finished;
      this.simpleTransparency = dependencies.simpleTransparency;
      this.headersFinished = dependencies.headersFinished || function() {
      };
    };
    Parser.prototype.start = function() {
      this.read(constants.PNG_SIGNATURE.length, this._parseSignature.bind(this));
    };
    Parser.prototype._parseSignature = function(data) {
      let signature = constants.PNG_SIGNATURE;
      for (let i = 0; i < signature.length; i++) {
        if (data[i] !== signature[i]) {
          this.error(new Error("Invalid file signature"));
          return;
        }
      }
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser.prototype._parseChunkBegin = function(data) {
      let length = data.readUInt32BE(0);
      let type = data.readUInt32BE(4);
      let name = "";
      for (let i = 4; i < 8; i++) {
        name += String.fromCharCode(data[i]);
      }
      let ancillary = Boolean(data[4] & 32);
      if (!this._hasIHDR && type !== constants.TYPE_IHDR) {
        this.error(new Error("Expected IHDR on beggining"));
        return;
      }
      this._crc = new CrcCalculator();
      this._crc.write(Buffer.from(name));
      if (this._chunks[type]) {
        return this._chunks[type](length);
      }
      if (!ancillary) {
        this.error(new Error("Unsupported critical chunk type " + name));
        return;
      }
      this.read(length + 4, this._skipChunk.bind(this));
    };
    Parser.prototype._skipChunk = function() {
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser.prototype._handleChunkEnd = function() {
      this.read(4, this._parseChunkEnd.bind(this));
    };
    Parser.prototype._parseChunkEnd = function(data) {
      let fileCrc = data.readInt32BE(0);
      let calcCrc = this._crc.crc32();
      if (this._options.checkCRC && calcCrc !== fileCrc) {
        this.error(new Error("Crc error - " + fileCrc + " - " + calcCrc));
        return;
      }
      if (!this._hasIEND) {
        this.read(8, this._parseChunkBegin.bind(this));
      }
    };
    Parser.prototype._handleIHDR = function(length) {
      this.read(length, this._parseIHDR.bind(this));
    };
    Parser.prototype._parseIHDR = function(data) {
      this._crc.write(data);
      let width = data.readUInt32BE(0);
      let height = data.readUInt32BE(4);
      let depth = data[8];
      let colorType = data[9];
      let compr = data[10];
      let filter = data[11];
      let interlace = data[12];
      if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
        this.error(new Error("Unsupported bit depth " + depth));
        return;
      }
      if (!(colorType in constants.COLORTYPE_TO_BPP_MAP)) {
        this.error(new Error("Unsupported color type"));
        return;
      }
      if (compr !== 0) {
        this.error(new Error("Unsupported compression method"));
        return;
      }
      if (filter !== 0) {
        this.error(new Error("Unsupported filter method"));
        return;
      }
      if (interlace !== 0 && interlace !== 1) {
        this.error(new Error("Unsupported interlace method"));
        return;
      }
      this._colorType = colorType;
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._colorType];
      this._hasIHDR = true;
      this.metadata({
        width,
        height,
        depth,
        interlace: Boolean(interlace),
        palette: Boolean(colorType & constants.COLORTYPE_PALETTE),
        color: Boolean(colorType & constants.COLORTYPE_COLOR),
        alpha: Boolean(colorType & constants.COLORTYPE_ALPHA),
        bpp,
        colorType
      });
      this._handleChunkEnd();
    };
    Parser.prototype._handlePLTE = function(length) {
      this.read(length, this._parsePLTE.bind(this));
    };
    Parser.prototype._parsePLTE = function(data) {
      this._crc.write(data);
      let entries = Math.floor(data.length / 3);
      for (let i = 0; i < entries; i++) {
        this._palette.push([data[i * 3], data[i * 3 + 1], data[i * 3 + 2], 255]);
      }
      this.palette(this._palette);
      this._handleChunkEnd();
    };
    Parser.prototype._handleTRNS = function(length) {
      this.simpleTransparency();
      this.read(length, this._parseTRNS.bind(this));
    };
    Parser.prototype._parseTRNS = function(data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR) {
        if (this._palette.length === 0) {
          this.error(new Error("Transparency chunk must be after palette"));
          return;
        }
        if (data.length > this._palette.length) {
          this.error(new Error("More transparent colors than palette size"));
          return;
        }
        for (let i = 0; i < data.length; i++) {
          this._palette[i][3] = data[i];
        }
        this.palette(this._palette);
      }
      if (this._colorType === constants.COLORTYPE_GRAYSCALE) {
        this.transColor([data.readUInt16BE(0)]);
      }
      if (this._colorType === constants.COLORTYPE_COLOR) {
        this.transColor([
          data.readUInt16BE(0),
          data.readUInt16BE(2),
          data.readUInt16BE(4)
        ]);
      }
      this._handleChunkEnd();
    };
    Parser.prototype._handleGAMA = function(length) {
      this.read(length, this._parseGAMA.bind(this));
    };
    Parser.prototype._parseGAMA = function(data) {
      this._crc.write(data);
      this.gamma(data.readUInt32BE(0) / constants.GAMMA_DIVISION);
      this._handleChunkEnd();
    };
    Parser.prototype._handleIDAT = function(length) {
      if (!this._emittedHeadersFinished) {
        this._emittedHeadersFinished = true;
        this.headersFinished();
      }
      this.read(-length, this._parseIDAT.bind(this, length));
    };
    Parser.prototype._parseIDAT = function(length, data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) {
        throw new Error("Expected palette not found");
      }
      this.inflateData(data);
      let leftOverLength = length - data.length;
      if (leftOverLength > 0) {
        this._handleIDAT(leftOverLength);
      } else {
        this._handleChunkEnd();
      }
    };
    Parser.prototype._handleIEND = function(length) {
      this.read(length, this._parseIEND.bind(this));
    };
    Parser.prototype._parseIEND = function(data) {
      this._crc.write(data);
      this._hasIEND = true;
      this._handleChunkEnd();
      if (this.finished) {
        this.finished();
      }
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/bitmapper.js
var require_bitmapper = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/bitmapper.js"(exports2) {
    "use strict";
    var interlaceUtils = require_interlace();
    var pixelBppMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos === data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = 255;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 1 >= data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = data[rawPos + 1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 2 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = 255;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 3 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = data[rawPos + 3];
      }
    ];
    var pixelBppCustomMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = maxBit;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, pixelData, pxPos) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = pixelData[1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = maxBit;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, pixelData, pxPos) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = pixelData[3];
      }
    ];
    function bitRetriever(data, depth) {
      let leftOver = [];
      let i = 0;
      function split() {
        if (i === data.length) {
          throw new Error("Ran out of data");
        }
        let byte = data[i];
        i++;
        let byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
        switch (depth) {
          default:
            throw new Error("unrecognised depth");
          case 16:
            byte2 = data[i];
            i++;
            leftOver.push((byte << 8) + byte2);
            break;
          case 4:
            byte2 = byte & 15;
            byte1 = byte >> 4;
            leftOver.push(byte1, byte2);
            break;
          case 2:
            byte4 = byte & 3;
            byte3 = byte >> 2 & 3;
            byte2 = byte >> 4 & 3;
            byte1 = byte >> 6 & 3;
            leftOver.push(byte1, byte2, byte3, byte4);
            break;
          case 1:
            byte8 = byte & 1;
            byte7 = byte >> 1 & 1;
            byte6 = byte >> 2 & 1;
            byte5 = byte >> 3 & 1;
            byte4 = byte >> 4 & 1;
            byte3 = byte >> 5 & 1;
            byte2 = byte >> 6 & 1;
            byte1 = byte >> 7 & 1;
            leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
            break;
        }
      }
      return {
        get: function(count) {
          while (leftOver.length < count) {
            split();
          }
          let returner = leftOver.slice(0, count);
          leftOver = leftOver.slice(count);
          return returner;
        },
        resetAfterLine: function() {
          leftOver.length = 0;
        },
        end: function() {
          if (i !== data.length) {
            throw new Error("extra data found");
          }
        }
      };
    }
    function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          let pxPos = getPxPos(x, y, imagePass);
          pixelBppMapper[bpp](pxData, data, pxPos, rawPos);
          rawPos += bpp;
        }
      }
      return rawPos;
    }
    function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          let pixelData = bits.get(bpp);
          let pxPos = getPxPos(x, y, imagePass);
          pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit);
        }
        bits.resetAfterLine();
      }
    }
    exports2.dataToBitMap = function(data, bitmapInfo) {
      let width = bitmapInfo.width;
      let height = bitmapInfo.height;
      let depth = bitmapInfo.depth;
      let bpp = bitmapInfo.bpp;
      let interlace = bitmapInfo.interlace;
      let bits;
      if (depth !== 8) {
        bits = bitRetriever(data, depth);
      }
      let pxData;
      if (depth <= 8) {
        pxData = Buffer.alloc(width * height * 4);
      } else {
        pxData = new Uint16Array(width * height * 4);
      }
      let maxBit = Math.pow(2, depth) - 1;
      let rawPos = 0;
      let images;
      let getPxPos;
      if (interlace) {
        images = interlaceUtils.getImagePasses(width, height);
        getPxPos = interlaceUtils.getInterlaceIterator(width, height);
      } else {
        let nonInterlacedPxPos = 0;
        getPxPos = function() {
          let returner = nonInterlacedPxPos;
          nonInterlacedPxPos += 4;
          return returner;
        };
        images = [{ width, height }];
      }
      for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        if (depth === 8) {
          rawPos = mapImage8Bit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            data,
            rawPos
          );
        } else {
          mapImageCustomBit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            bits,
            maxBit
          );
        }
      }
      if (depth === 8) {
        if (rawPos !== data.length) {
          throw new Error("extra data found");
        }
      } else {
        bits.end();
      }
      return pxData;
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/format-normaliser.js
var require_format_normaliser = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/format-normaliser.js"(exports2, module2) {
    "use strict";
    function dePalette(indata, outdata, width, height, palette) {
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let color = palette[indata[pxPos]];
          if (!color) {
            throw new Error("index " + indata[pxPos] + " not in palette");
          }
          for (let i = 0; i < 4; i++) {
            outdata[pxPos + i] = color[i];
          }
          pxPos += 4;
        }
      }
    }
    function replaceTransparentColor(indata, outdata, width, height, transColor) {
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let makeTrans = false;
          if (transColor.length === 1) {
            if (transColor[0] === indata[pxPos]) {
              makeTrans = true;
            }
          } else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) {
            makeTrans = true;
          }
          if (makeTrans) {
            for (let i = 0; i < 4; i++) {
              outdata[pxPos + i] = 0;
            }
          }
          pxPos += 4;
        }
      }
    }
    function scaleDepth(indata, outdata, width, height, depth) {
      let maxOutSample = 255;
      let maxInSample = Math.pow(2, depth) - 1;
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          for (let i = 0; i < 4; i++) {
            outdata[pxPos + i] = Math.floor(
              indata[pxPos + i] * maxOutSample / maxInSample + 0.5
            );
          }
          pxPos += 4;
        }
      }
    }
    module2.exports = function(indata, imageData, skipRescale = false) {
      let depth = imageData.depth;
      let width = imageData.width;
      let height = imageData.height;
      let colorType = imageData.colorType;
      let transColor = imageData.transColor;
      let palette = imageData.palette;
      let outdata = indata;
      if (colorType === 3) {
        dePalette(indata, outdata, width, height, palette);
      } else {
        if (transColor) {
          replaceTransparentColor(indata, outdata, width, height, transColor);
        }
        if (depth !== 8 && !skipRescale) {
          if (depth === 16) {
            outdata = Buffer.alloc(width * height * 4);
          }
          scaleDepth(indata, outdata, width, height, depth);
        }
      }
      return outdata;
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/parser-async.js
var require_parser_async = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/parser-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var zlib = require("zlib");
    var ChunkStream = require_chunkstream();
    var FilterAsync = require_filter_parse_async();
    var Parser = require_parser();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    var ParserAsync = module2.exports = function(options) {
      ChunkStream.call(this);
      this._parser = new Parser(options, {
        read: this.read.bind(this),
        error: this._handleError.bind(this),
        metadata: this._handleMetaData.bind(this),
        gamma: this.emit.bind(this, "gamma"),
        palette: this._handlePalette.bind(this),
        transColor: this._handleTransColor.bind(this),
        finished: this._finished.bind(this),
        inflateData: this._inflateData.bind(this),
        simpleTransparency: this._simpleTransparency.bind(this),
        headersFinished: this._headersFinished.bind(this)
      });
      this._options = options;
      this.writable = true;
      this._parser.start();
    };
    util.inherits(ParserAsync, ChunkStream);
    ParserAsync.prototype._handleError = function(err) {
      this.emit("error", err);
      this.writable = false;
      this.destroy();
      if (this._inflate && this._inflate.destroy) {
        this._inflate.destroy();
      }
      if (this._filter) {
        this._filter.destroy();
        this._filter.on("error", function() {
        });
      }
      this.errord = true;
    };
    ParserAsync.prototype._inflateData = function(data) {
      if (!this._inflate) {
        if (this._bitmapInfo.interlace) {
          this._inflate = zlib.createInflate();
          this._inflate.on("error", this.emit.bind(this, "error"));
          this._filter.on("complete", this._complete.bind(this));
          this._inflate.pipe(this._filter);
        } else {
          let rowSize = (this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1;
          let imageSize = rowSize * this._bitmapInfo.height;
          let chunkSize = Math.max(imageSize, zlib.Z_MIN_CHUNK);
          this._inflate = zlib.createInflate({ chunkSize });
          let leftToInflate = imageSize;
          let emitError = this.emit.bind(this, "error");
          this._inflate.on("error", function(err) {
            if (!leftToInflate) {
              return;
            }
            emitError(err);
          });
          this._filter.on("complete", this._complete.bind(this));
          let filterWrite = this._filter.write.bind(this._filter);
          this._inflate.on("data", function(chunk) {
            if (!leftToInflate) {
              return;
            }
            if (chunk.length > leftToInflate) {
              chunk = chunk.slice(0, leftToInflate);
            }
            leftToInflate -= chunk.length;
            filterWrite(chunk);
          });
          this._inflate.on("end", this._filter.end.bind(this._filter));
        }
      }
      this._inflate.write(data);
    };
    ParserAsync.prototype._handleMetaData = function(metaData) {
      this._metaData = metaData;
      this._bitmapInfo = Object.create(metaData);
      this._filter = new FilterAsync(this._bitmapInfo);
    };
    ParserAsync.prototype._handleTransColor = function(transColor) {
      this._bitmapInfo.transColor = transColor;
    };
    ParserAsync.prototype._handlePalette = function(palette) {
      this._bitmapInfo.palette = palette;
    };
    ParserAsync.prototype._simpleTransparency = function() {
      this._metaData.alpha = true;
    };
    ParserAsync.prototype._headersFinished = function() {
      this.emit("metadata", this._metaData);
    };
    ParserAsync.prototype._finished = function() {
      if (this.errord) {
        return;
      }
      if (!this._inflate) {
        this.emit("error", "No Inflate block");
      } else {
        this._inflate.end();
      }
    };
    ParserAsync.prototype._complete = function(filteredData) {
      if (this.errord) {
        return;
      }
      let normalisedBitmapData;
      try {
        let bitmapData = bitmapper.dataToBitMap(filteredData, this._bitmapInfo);
        normalisedBitmapData = formatNormaliser(
          bitmapData,
          this._bitmapInfo,
          this._options.skipRescale
        );
        bitmapData = null;
      } catch (ex) {
        this._handleError(ex);
        return;
      }
      this.emit("parsed", normalisedBitmapData);
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/bitpacker.js
var require_bitpacker = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/bitpacker.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    module2.exports = function(dataIn, width, height, options) {
      let outHasAlpha = [constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(
        options.colorType
      ) !== -1;
      if (options.colorType === options.inputColorType) {
        let bigEndian = function() {
          let buffer2 = new ArrayBuffer(2);
          new DataView(buffer2).setInt16(
            0,
            256,
            true
            /* littleEndian */
          );
          return new Int16Array(buffer2)[0] !== 256;
        }();
        if (options.bitDepth === 8 || options.bitDepth === 16 && bigEndian) {
          return dataIn;
        }
      }
      let data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);
      let maxValue = 255;
      let inBpp = constants.COLORTYPE_TO_BPP_MAP[options.inputColorType];
      if (inBpp === 4 && !options.inputHasAlpha) {
        inBpp = 3;
      }
      let outBpp = constants.COLORTYPE_TO_BPP_MAP[options.colorType];
      if (options.bitDepth === 16) {
        maxValue = 65535;
        outBpp *= 2;
      }
      let outData = Buffer.alloc(width * height * outBpp);
      let inIndex = 0;
      let outIndex = 0;
      let bgColor = options.bgColor || {};
      if (bgColor.red === void 0) {
        bgColor.red = maxValue;
      }
      if (bgColor.green === void 0) {
        bgColor.green = maxValue;
      }
      if (bgColor.blue === void 0) {
        bgColor.blue = maxValue;
      }
      function getRGBA() {
        let red;
        let green;
        let blue;
        let alpha = maxValue;
        switch (options.inputColorType) {
          case constants.COLORTYPE_COLOR_ALPHA:
            alpha = data[inIndex + 3];
            red = data[inIndex];
            green = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_COLOR:
            red = data[inIndex];
            green = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_ALPHA:
            alpha = data[inIndex + 1];
            red = data[inIndex];
            green = red;
            blue = red;
            break;
          case constants.COLORTYPE_GRAYSCALE:
            red = data[inIndex];
            green = red;
            blue = red;
            break;
          default:
            throw new Error(
              "input color type:" + options.inputColorType + " is not supported at present"
            );
        }
        if (options.inputHasAlpha) {
          if (!outHasAlpha) {
            alpha /= maxValue;
            red = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red), 0),
              maxValue
            );
            green = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green), 0),
              maxValue
            );
            blue = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0),
              maxValue
            );
          }
        }
        return { red, green, blue, alpha };
      }
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let rgba = getRGBA(data, inIndex);
          switch (options.colorType) {
            case constants.COLORTYPE_COLOR_ALPHA:
            case constants.COLORTYPE_COLOR:
              if (options.bitDepth === 8) {
                outData[outIndex] = rgba.red;
                outData[outIndex + 1] = rgba.green;
                outData[outIndex + 2] = rgba.blue;
                if (outHasAlpha) {
                  outData[outIndex + 3] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(rgba.red, outIndex);
                outData.writeUInt16BE(rgba.green, outIndex + 2);
                outData.writeUInt16BE(rgba.blue, outIndex + 4);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 6);
                }
              }
              break;
            case constants.COLORTYPE_ALPHA:
            case constants.COLORTYPE_GRAYSCALE: {
              let grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
              if (options.bitDepth === 8) {
                outData[outIndex] = grayscale;
                if (outHasAlpha) {
                  outData[outIndex + 1] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(grayscale, outIndex);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 2);
                }
              }
              break;
            }
            default:
              throw new Error("unrecognised color Type " + options.colorType);
          }
          inIndex += inBpp;
          outIndex += outBpp;
        }
      }
      return outData;
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-pack.js
var require_filter_pack = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-pack.js"(exports2, module2) {
    "use strict";
    var paethPredictor = require_paeth_predictor();
    function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x = 0; x < byteWidth; x++) {
        rawData[rawPos + x] = pxData[pxPos + x];
      }
    }
    function filterSumNone(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let i = pxPos; i < length; i++) {
        sum += Math.abs(pxData[i]);
      }
      return sum;
    }
    function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let val = pxData[pxPos + x] - left;
        rawData[rawPos + x] = val;
      }
    }
    function filterSumSub(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let val = pxData[pxPos + x] - left;
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x = 0; x < byteWidth; x++) {
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - up;
        rawData[rawPos + x] = val;
      }
    }
    function filterSumUp(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let x = pxPos; x < length; x++) {
        let up = pxPos > 0 ? pxData[x - byteWidth] : 0;
        let val = pxData[x] - up;
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - (left + up >> 1);
        rawData[rawPos + x] = val;
      }
    }
    function filterSumAvg(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - (left + up >> 1);
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
        rawData[rawPos + x] = val;
      }
    }
    function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
        sum += Math.abs(val);
      }
      return sum;
    }
    var filters = {
      0: filterNone,
      1: filterSub,
      2: filterUp,
      3: filterAvg,
      4: filterPaeth
    };
    var filterSums = {
      0: filterSumNone,
      1: filterSumSub,
      2: filterSumUp,
      3: filterSumAvg,
      4: filterSumPaeth
    };
    module2.exports = function(pxData, width, height, options, bpp) {
      let filterTypes;
      if (!("filterType" in options) || options.filterType === -1) {
        filterTypes = [0, 1, 2, 3, 4];
      } else if (typeof options.filterType === "number") {
        filterTypes = [options.filterType];
      } else {
        throw new Error("unrecognised filter types");
      }
      if (options.bitDepth === 16) {
        bpp *= 2;
      }
      let byteWidth = width * bpp;
      let rawPos = 0;
      let pxPos = 0;
      let rawData = Buffer.alloc((byteWidth + 1) * height);
      let sel = filterTypes[0];
      for (let y = 0; y < height; y++) {
        if (filterTypes.length > 1) {
          let min = Infinity;
          for (let i = 0; i < filterTypes.length; i++) {
            let sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
            if (sum < min) {
              sel = filterTypes[i];
              min = sum;
            }
          }
        }
        rawData[rawPos] = sel;
        rawPos++;
        filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
        rawPos += byteWidth;
        pxPos += byteWidth;
      }
      return rawData;
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/packer.js
var require_packer = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/packer.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    var CrcStream = require_crc();
    var bitPacker = require_bitpacker();
    var filter = require_filter_pack();
    var zlib = require("zlib");
    var Packer = module2.exports = function(options) {
      this._options = options;
      options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
      options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
      options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
      options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
      options.deflateFactory = options.deflateFactory || zlib.createDeflate;
      options.bitDepth = options.bitDepth || 8;
      options.colorType = typeof options.colorType === "number" ? options.colorType : constants.COLORTYPE_COLOR_ALPHA;
      options.inputColorType = typeof options.inputColorType === "number" ? options.inputColorType : constants.COLORTYPE_COLOR_ALPHA;
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.colorType) === -1) {
        throw new Error(
          "option color type:" + options.colorType + " is not supported at present"
        );
      }
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.inputColorType) === -1) {
        throw new Error(
          "option input color type:" + options.inputColorType + " is not supported at present"
        );
      }
      if (options.bitDepth !== 8 && options.bitDepth !== 16) {
        throw new Error(
          "option bit depth:" + options.bitDepth + " is not supported at present"
        );
      }
    };
    Packer.prototype.getDeflateOptions = function() {
      return {
        chunkSize: this._options.deflateChunkSize,
        level: this._options.deflateLevel,
        strategy: this._options.deflateStrategy
      };
    };
    Packer.prototype.createDeflate = function() {
      return this._options.deflateFactory(this.getDeflateOptions());
    };
    Packer.prototype.filterData = function(data, width, height) {
      let packedData = bitPacker(data, width, height, this._options);
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._options.colorType];
      let filteredData = filter(packedData, width, height, this._options, bpp);
      return filteredData;
    };
    Packer.prototype._packChunk = function(type, data) {
      let len = data ? data.length : 0;
      let buf = Buffer.alloc(len + 12);
      buf.writeUInt32BE(len, 0);
      buf.writeUInt32BE(type, 4);
      if (data) {
        data.copy(buf, 8);
      }
      buf.writeInt32BE(
        CrcStream.crc32(buf.slice(4, buf.length - 4)),
        buf.length - 4
      );
      return buf;
    };
    Packer.prototype.packGAMA = function(gamma) {
      let buf = Buffer.alloc(4);
      buf.writeUInt32BE(Math.floor(gamma * constants.GAMMA_DIVISION), 0);
      return this._packChunk(constants.TYPE_gAMA, buf);
    };
    Packer.prototype.packIHDR = function(width, height) {
      let buf = Buffer.alloc(13);
      buf.writeUInt32BE(width, 0);
      buf.writeUInt32BE(height, 4);
      buf[8] = this._options.bitDepth;
      buf[9] = this._options.colorType;
      buf[10] = 0;
      buf[11] = 0;
      buf[12] = 0;
      return this._packChunk(constants.TYPE_IHDR, buf);
    };
    Packer.prototype.packIDAT = function(data) {
      return this._packChunk(constants.TYPE_IDAT, data);
    };
    Packer.prototype.packIEND = function() {
      return this._packChunk(constants.TYPE_IEND, null);
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/packer-async.js
var require_packer_async = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/packer-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var constants = require_constants();
    var Packer = require_packer();
    var PackerAsync = module2.exports = function(opt) {
      Stream.call(this);
      let options = opt || {};
      this._packer = new Packer(options);
      this._deflate = this._packer.createDeflate();
      this.readable = true;
    };
    util.inherits(PackerAsync, Stream);
    PackerAsync.prototype.pack = function(data, width, height, gamma) {
      this.emit("data", Buffer.from(constants.PNG_SIGNATURE));
      this.emit("data", this._packer.packIHDR(width, height));
      if (gamma) {
        this.emit("data", this._packer.packGAMA(gamma));
      }
      let filteredData = this._packer.filterData(data, width, height);
      this._deflate.on("error", this.emit.bind(this, "error"));
      this._deflate.on(
        "data",
        function(compressedData) {
          this.emit("data", this._packer.packIDAT(compressedData));
        }.bind(this)
      );
      this._deflate.on(
        "end",
        function() {
          this.emit("data", this._packer.packIEND());
          this.emit("end");
        }.bind(this)
      );
      this._deflate.end(filteredData);
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/sync-inflate.js
var require_sync_inflate = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/sync-inflate.js"(exports2, module2) {
    "use strict";
    var assert = require("assert").ok;
    var zlib = require("zlib");
    var util = require("util");
    var kMaxLength = require("buffer").kMaxLength;
    function Inflate(opts) {
      if (!(this instanceof Inflate)) {
        return new Inflate(opts);
      }
      if (opts && opts.chunkSize < zlib.Z_MIN_CHUNK) {
        opts.chunkSize = zlib.Z_MIN_CHUNK;
      }
      zlib.Inflate.call(this, opts);
      this._offset = this._offset === void 0 ? this._outOffset : this._offset;
      this._buffer = this._buffer || this._outBuffer;
      if (opts && opts.maxLength != null) {
        this._maxLength = opts.maxLength;
      }
    }
    function createInflate(opts) {
      return new Inflate(opts);
    }
    function _close(engine, callback) {
      if (callback) {
        process.nextTick(callback);
      }
      if (!engine._handle) {
        return;
      }
      engine._handle.close();
      engine._handle = null;
    }
    Inflate.prototype._processChunk = function(chunk, flushFlag, asyncCb) {
      if (typeof asyncCb === "function") {
        return zlib.Inflate._processChunk.call(this, chunk, flushFlag, asyncCb);
      }
      let self = this;
      let availInBefore = chunk && chunk.length;
      let availOutBefore = this._chunkSize - this._offset;
      let leftToInflate = this._maxLength;
      let inOff = 0;
      let buffers = [];
      let nread = 0;
      let error;
      this.on("error", function(err) {
        error = err;
      });
      function handleChunk(availInAfter, availOutAfter) {
        if (self._hadError) {
          return;
        }
        let have = availOutBefore - availOutAfter;
        assert(have >= 0, "have should not go down");
        if (have > 0) {
          let out = self._buffer.slice(self._offset, self._offset + have);
          self._offset += have;
          if (out.length > leftToInflate) {
            out = out.slice(0, leftToInflate);
          }
          buffers.push(out);
          nread += out.length;
          leftToInflate -= out.length;
          if (leftToInflate === 0) {
            return false;
          }
        }
        if (availOutAfter === 0 || self._offset >= self._chunkSize) {
          availOutBefore = self._chunkSize;
          self._offset = 0;
          self._buffer = Buffer.allocUnsafe(self._chunkSize);
        }
        if (availOutAfter === 0) {
          inOff += availInBefore - availInAfter;
          availInBefore = availInAfter;
          return true;
        }
        return false;
      }
      assert(this._handle, "zlib binding closed");
      let res;
      do {
        res = this._handle.writeSync(
          flushFlag,
          chunk,
          // in
          inOff,
          // in_off
          availInBefore,
          // in_len
          this._buffer,
          // out
          this._offset,
          //out_off
          availOutBefore
        );
        res = res || this._writeState;
      } while (!this._hadError && handleChunk(res[0], res[1]));
      if (this._hadError) {
        throw error;
      }
      if (nread >= kMaxLength) {
        _close(this);
        throw new RangeError(
          "Cannot create final Buffer. It would be larger than 0x" + kMaxLength.toString(16) + " bytes"
        );
      }
      let buf = Buffer.concat(buffers, nread);
      _close(this);
      return buf;
    };
    util.inherits(Inflate, zlib.Inflate);
    function zlibBufferSync(engine, buffer2) {
      if (typeof buffer2 === "string") {
        buffer2 = Buffer.from(buffer2);
      }
      if (!(buffer2 instanceof Buffer)) {
        throw new TypeError("Not a string or buffer");
      }
      let flushFlag = engine._finishFlushFlag;
      if (flushFlag == null) {
        flushFlag = zlib.Z_FINISH;
      }
      return engine._processChunk(buffer2, flushFlag);
    }
    function inflateSync(buffer2, opts) {
      return zlibBufferSync(new Inflate(opts), buffer2);
    }
    module2.exports = exports2 = inflateSync;
    exports2.Inflate = Inflate;
    exports2.createInflate = createInflate;
    exports2.inflateSync = inflateSync;
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/sync-reader.js
var require_sync_reader = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/sync-reader.js"(exports2, module2) {
    "use strict";
    var SyncReader = module2.exports = function(buffer2) {
      this._buffer = buffer2;
      this._reads = [];
    };
    SyncReader.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
    };
    SyncReader.prototype.process = function() {
      while (this._reads.length > 0 && this._buffer.length) {
        let read = this._reads[0];
        if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {
          this._reads.shift();
          let buf = this._buffer;
          this._buffer = buf.slice(read.length);
          read.func.call(this, buf.slice(0, read.length));
        } else {
          break;
        }
      }
      if (this._reads.length > 0) {
        throw new Error("There are some read requests waitng on finished stream");
      }
      if (this._buffer.length > 0) {
        throw new Error("unrecognised content at end of stream");
      }
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-parse-sync.js
var require_filter_parse_sync = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/filter-parse-sync.js"(exports2) {
    "use strict";
    var SyncReader = require_sync_reader();
    var Filter = require_filter_parse();
    exports2.process = function(inBuffer, bitmapInfo) {
      let outBuffers = [];
      let reader = new SyncReader(inBuffer);
      let filter = new Filter(bitmapInfo, {
        read: reader.read.bind(reader),
        write: function(bufferPart) {
          outBuffers.push(bufferPart);
        },
        complete: function() {
        }
      });
      filter.start();
      reader.process();
      return Buffer.concat(outBuffers);
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/parser-sync.js
var require_parser_sync = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/parser-sync.js"(exports2, module2) {
    "use strict";
    var hasSyncZlib = true;
    var zlib = require("zlib");
    var inflateSync = require_sync_inflate();
    if (!zlib.deflateSync) {
      hasSyncZlib = false;
    }
    var SyncReader = require_sync_reader();
    var FilterSync = require_filter_parse_sync();
    var Parser = require_parser();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    module2.exports = function(buffer2, options) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let err;
      function handleError(_err_) {
        err = _err_;
      }
      let metaData;
      function handleMetaData(_metaData_) {
        metaData = _metaData_;
      }
      function handleTransColor(transColor) {
        metaData.transColor = transColor;
      }
      function handlePalette(palette) {
        metaData.palette = palette;
      }
      function handleSimpleTransparency() {
        metaData.alpha = true;
      }
      let gamma;
      function handleGamma(_gamma_) {
        gamma = _gamma_;
      }
      let inflateDataList = [];
      function handleInflateData(inflatedData2) {
        inflateDataList.push(inflatedData2);
      }
      let reader = new SyncReader(buffer2);
      let parser = new Parser(options, {
        read: reader.read.bind(reader),
        error: handleError,
        metadata: handleMetaData,
        gamma: handleGamma,
        palette: handlePalette,
        transColor: handleTransColor,
        inflateData: handleInflateData,
        simpleTransparency: handleSimpleTransparency
      });
      parser.start();
      reader.process();
      if (err) {
        throw err;
      }
      let inflateData = Buffer.concat(inflateDataList);
      inflateDataList.length = 0;
      let inflatedData;
      if (metaData.interlace) {
        inflatedData = zlib.inflateSync(inflateData);
      } else {
        let rowSize = (metaData.width * metaData.bpp * metaData.depth + 7 >> 3) + 1;
        let imageSize = rowSize * metaData.height;
        inflatedData = inflateSync(inflateData, {
          chunkSize: imageSize,
          maxLength: imageSize
        });
      }
      inflateData = null;
      if (!inflatedData || !inflatedData.length) {
        throw new Error("bad png - invalid inflate data response");
      }
      let unfilteredData = FilterSync.process(inflatedData, metaData);
      inflateData = null;
      let bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
      unfilteredData = null;
      let normalisedBitmapData = formatNormaliser(
        bitmapData,
        metaData,
        options.skipRescale
      );
      metaData.data = normalisedBitmapData;
      metaData.gamma = gamma || 0;
      return metaData;
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/packer-sync.js
var require_packer_sync = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/packer-sync.js"(exports2, module2) {
    "use strict";
    var hasSyncZlib = true;
    var zlib = require("zlib");
    if (!zlib.deflateSync) {
      hasSyncZlib = false;
    }
    var constants = require_constants();
    var Packer = require_packer();
    module2.exports = function(metaData, opt) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let options = opt || {};
      let packer = new Packer(options);
      let chunks = [];
      chunks.push(Buffer.from(constants.PNG_SIGNATURE));
      chunks.push(packer.packIHDR(metaData.width, metaData.height));
      if (metaData.gamma) {
        chunks.push(packer.packGAMA(metaData.gamma));
      }
      let filteredData = packer.filterData(
        metaData.data,
        metaData.width,
        metaData.height
      );
      let compressedData = zlib.deflateSync(
        filteredData,
        packer.getDeflateOptions()
      );
      filteredData = null;
      if (!compressedData || !compressedData.length) {
        throw new Error("bad png - invalid compressed data response");
      }
      chunks.push(packer.packIDAT(compressedData));
      chunks.push(packer.packIEND());
      return Buffer.concat(chunks);
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/png-sync.js
var require_png_sync = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/png-sync.js"(exports2) {
    "use strict";
    var parse = require_parser_sync();
    var pack = require_packer_sync();
    exports2.read = function(buffer2, options) {
      return parse(buffer2, options || {});
    };
    exports2.write = function(png2, options) {
      return pack(png2, options);
    };
  }
});

// node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/png.js
var require_png = __commonJS({
  "node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/png.js"(exports2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var Parser = require_parser_async();
    var Packer = require_packer_async();
    var PNGSync = require_png_sync();
    var PNG2 = exports2.PNG = function(options) {
      Stream.call(this);
      options = options || {};
      this.width = options.width | 0;
      this.height = options.height | 0;
      this.data = this.width > 0 && this.height > 0 ? Buffer.alloc(4 * this.width * this.height) : null;
      if (options.fill && this.data) {
        this.data.fill(0);
      }
      this.gamma = 0;
      this.readable = this.writable = true;
      this._parser = new Parser(options);
      this._parser.on("error", this.emit.bind(this, "error"));
      this._parser.on("close", this._handleClose.bind(this));
      this._parser.on("metadata", this._metadata.bind(this));
      this._parser.on("gamma", this._gamma.bind(this));
      this._parser.on(
        "parsed",
        function(data) {
          this.data = data;
          this.emit("parsed", data);
        }.bind(this)
      );
      this._packer = new Packer(options);
      this._packer.on("data", this.emit.bind(this, "data"));
      this._packer.on("end", this.emit.bind(this, "end"));
      this._parser.on("close", this._handleClose.bind(this));
      this._packer.on("error", this.emit.bind(this, "error"));
    };
    util.inherits(PNG2, Stream);
    PNG2.sync = PNGSync;
    PNG2.prototype.pack = function() {
      if (!this.data || !this.data.length) {
        this.emit("error", "No data provided");
        return this;
      }
      process.nextTick(
        function() {
          this._packer.pack(this.data, this.width, this.height, this.gamma);
        }.bind(this)
      );
      return this;
    };
    PNG2.prototype.parse = function(data, callback) {
      if (callback) {
        let onParsed, onError;
        onParsed = function(parsedData) {
          this.removeListener("error", onError);
          this.data = parsedData;
          callback(null, this);
        }.bind(this);
        onError = function(err) {
          this.removeListener("parsed", onParsed);
          callback(err, null);
        }.bind(this);
        this.once("parsed", onParsed);
        this.once("error", onError);
      }
      this.end(data);
      return this;
    };
    PNG2.prototype.write = function(data) {
      this._parser.write(data);
      return true;
    };
    PNG2.prototype.end = function(data) {
      this._parser.end(data);
    };
    PNG2.prototype._metadata = function(metadata) {
      this.width = metadata.width;
      this.height = metadata.height;
      this.emit("metadata", metadata);
    };
    PNG2.prototype._gamma = function(gamma) {
      this.gamma = gamma;
    };
    PNG2.prototype._handleClose = function() {
      if (!this._parser.writable && !this._packer.readable) {
        this.emit("close");
      }
    };
    PNG2.bitblt = function(src, dst, srcX, srcY, width, height, deltaX, deltaY) {
      srcX |= 0;
      srcY |= 0;
      width |= 0;
      height |= 0;
      deltaX |= 0;
      deltaY |= 0;
      if (srcX > src.width || srcY > src.height || srcX + width > src.width || srcY + height > src.height) {
        throw new Error("bitblt reading outside image");
      }
      if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) {
        throw new Error("bitblt writing outside image");
      }
      for (let y = 0; y < height; y++) {
        src.data.copy(
          dst.data,
          (deltaY + y) * dst.width + deltaX << 2,
          (srcY + y) * src.width + srcX << 2,
          (srcY + y) * src.width + srcX + width << 2
        );
      }
    };
    PNG2.prototype.bitblt = function(dst, srcX, srcY, width, height, deltaX, deltaY) {
      PNG2.bitblt(this, dst, srcX, srcY, width, height, deltaX, deltaY);
      return this;
    };
    PNG2.adjustGamma = function(src) {
      if (src.gamma) {
        for (let y = 0; y < src.height; y++) {
          for (let x = 0; x < src.width; x++) {
            let idx = src.width * y + x << 2;
            for (let i = 0; i < 3; i++) {
              let sample = src.data[idx + i] / 255;
              sample = Math.pow(sample, 1 / 2.2 / src.gamma);
              src.data[idx + i] = Math.round(sample * 255);
            }
          }
        }
        src.gamma = 0;
      }
    };
    PNG2.prototype.adjustGamma = function() {
      PNG2.adjustGamma(this);
    };
  }
});

// src/cli.ts
var fs = __toESM(require("fs"), 1);
var import_pngjs = __toESM(require_png(), 1);

// src/distance.ts
var SSIM_C1 = 6.5025;
var SSIM_C2 = 58.5225;
var HIST_BINS = 16;
function histogramIntersection(glyph, srcLum, n, ...args2) {
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

// src/ascii.ts
function parseBlockChars(block) {
  return [...block].filter((x) => x !== "\n" && x !== " " && x !== "	");
}
var ASCII_CHARS = Object.values(UNICODE_BLOCKS).flatMap(parseBlockChars);
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
function samplePixel(png2, glyphs, x, y, width, height, distance_fn2, brightness = 0, contrast = 1, invertImage = false) {
  const x0 = Math.floor(x / width * png2.width);
  const x1 = Math.floor((x + 1) / width * png2.width);
  const y0 = Math.floor(y / height * png2.height);
  const y1 = Math.floor((y + 1) / height * png2.height);
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
      const srcIdx = (png2.width * srcY + srcX) * 4;
      let lum = 0.299 * png2.data[srcIdx] + 0.587 * png2.data[srcIdx + 1] + 0.114 * png2.data[srcIdx + 2];
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
    const dist = DISTANCE_FNS[distance_fn2](
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
  if (array.length === 0) return null;
  var modeMap = {};
  var maxEl = array[0], maxCount = 1;
  for (let i = 0; i < array.length; i++) {
    let el = array[i];
    if (modeMap[el] == null) modeMap[el] = 1;
    else modeMap[el]++;
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
function computeStats(ascii2, cell_width, cell_height, width, height, numGlyphs) {
  const chars = width * height;
  const uniqueChars = new Set(ascii2.replace(/\n/g, "")).size;
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
function renderAscii(png2, width, glyphs, distance_fn2, brightness = 0, contrast = 1, fontRatio = 0.5, invertImage = false) {
  const cell_width = Math.floor(png2.width / width);
  const cell_height = Math.ceil(cell_width / fontRatio);
  const height = Math.round(png2.height / cell_height);
  const lines = [];
  for (let row = 0; row < height; row++) {
    let line = "";
    for (let col = 0; col < width; col++) {
      line += samplePixel(
        png2,
        glyphs,
        col,
        row,
        width,
        height,
        distance_fn2,
        brightness,
        contrast,
        invertImage
      );
    }
    lines.push(line);
  }
  const ascii2 = lines.join("\n");
  const stats = computeStats(
    ascii2,
    cell_width,
    cell_height,
    width,
    height,
    glyphs.length
  );
  return { ascii: ascii2, stats };
}
function* estimateAscii(png2, width, canvasFactory, evaluate_fn2, distance_fn2, chars = ASCII_CHARS, fontRatio, invertGlyphs = false, invertImage = false, fontName = "monospace") {
  const ratio = fontRatio ?? measureFontRatio(canvasFactory, fontName);
  const cell_width = Math.floor(png2.width / width);
  const cell_height = Math.ceil(cell_width / ratio);
  const glyphs = createCharacterPortraits(
    cell_height,
    canvasFactory,
    chars,
    ratio,
    invertGlyphs,
    fontName
  );
  let contrast = 4;
  let brightness = 0.1;
  function f(c, b) {
    const { ascii: ascii2, stats } = renderAscii(
      png2,
      width,
      glyphs,
      distance_fn2,
      b,
      c,
      ratio,
      invertImage
    );
    const val = EVALUTATE_FNS[evaluate_fn2](
      ascii2.split("").map((x) => chars.indexOf(x))
    );
    return { val, ascii: ascii2, stats };
  }
  let cur = f(contrast, brightness);
  yield { ascii: cur.ascii, brightness, contrast, stats: cur.stats };
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
      yield { ascii: cur.ascii, brightness: b, contrast: c, stats: cur.stats };
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
      yield { ascii: cur.ascii, brightness: b, contrast: c, stats: cur.stats };
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
  return { ascii: cur.ascii, brightness, contrast, stats: cur.stats };
}

// src/node-canvas-factory.ts
var import_canvas = require("canvas");
var nodeCanvasFactory = (width, height) => {
  const canvas = (0, import_canvas.createCanvas)(width, height);
  return canvas.getContext("2d");
};

// src/cli.ts
var args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: ansi-warhol [options] <image.png>");
  console.log();
  console.log("Renders a PNG image as Unicode text art to out.txt");
  console.log();
  console.log("Options:");
  console.log(
    "  --width <n>       Output width in characters (default: image width)"
  );
  console.log(
    `  --distance <fn>   Distance function: ${Object.keys(DISTANCE_FNS).join(", ")} (default: SSIM)`
  );
  console.log(
    `  --evaluate <fn>   Evaluate function: ${Object.keys(EVALUTATE_FNS).join(", ")} (default: KURTOSIS)`
  );
  console.log(
    "  --out <file>      Output file (default: out.txt, or out_N.txt if taken)"
  );
  console.log("  -h, --help        Show this help message");
  console.log("  -v, --version     Show version number");
  process.exit(0);
}
if (args.includes("--version") || args.includes("-v")) {
  console.log("0.0.1");
  process.exit(0);
}
function parseArg(args2, name) {
  const idx = args2.indexOf(name);
  if (idx === -1) return void 0;
  const val = parseInt(args2[idx + 1], 10);
  if (Number.isNaN(val) || val <= 0) {
    console.error(`Error: ${name} requires a positive integer.`);
    process.exit(1);
  }
  return val;
}
function parseStringArg(args2, name) {
  const idx = args2.indexOf(name);
  if (idx === -1) return void 0;
  return args2[idx + 1];
}
function nextOutputPath() {
  if (!fs.existsSync("out.txt")) return "out.txt";
  let i = 1;
  while (fs.existsSync(`out_${i}.txt`)) i++;
  return `out_${i}.txt`;
}
var optWidth = parseArg(args, "--width");
var outPath = parseStringArg(args, "--out") || nextOutputPath();
var distanceArg = parseStringArg(args, "--distance") || "SSIM";
var evaluateArg = parseStringArg(args, "--evaluate") || "KURTOSIS";
if (!(distanceArg in DISTANCE_FNS)) {
  console.error(
    `Error: Unknown distance function "${distanceArg}". Valid options: ${Object.keys(DISTANCE_FNS).join(", ")}`
  );
  process.exit(1);
}
if (!(evaluateArg in EVALUTATE_FNS)) {
  console.error(
    `Error: Unknown evaluate function "${evaluateArg}". Valid options: ${Object.keys(EVALUTATE_FNS).join(", ")}`
  );
  process.exit(1);
}
var distance_fn = distanceArg;
var evaluate_fn = evaluateArg;
var inputPath = args.pop();
if (!inputPath) {
  console.error("Error: Please provide a path to a PNG file.");
  console.error("Usage: ansi-warhol [options] <image.png>");
  process.exit(1);
}
console.log(`${inputPath} -> ${outPath}`);
if (!fs.existsSync(inputPath)) {
  console.error(`Error: File not found: ${inputPath}`);
  process.exit(1);
}
var buffer = fs.readFileSync(inputPath);
var png = import_pngjs.PNG.sync.read(buffer);
var outWidth = optWidth ?? png.width;
var ascii = "";
for (const result of estimateAscii(
  png,
  outWidth,
  nodeCanvasFactory,
  evaluate_fn,
  distance_fn
)) {
  ascii = result.ascii;
  fs.writeFileSync(outPath, ascii);
}
console.log(
  `Rendered ${outWidth}x${Math.ceil(ascii.length / outWidth)} image to ${outPath}`
);
