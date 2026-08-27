'use strict';
// Generates build/icon.png (512x512) with zero external dependencies.
// Draws the Onyx mark: an onion glyph on a deep-indigo rounded tile.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const SIZE = 512;
const buf = Buffer.alloc(SIZE * SIZE * 4);

function setPx(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
}

function lerp(a, b, t) { return a + (b - a) * t; }

// Vertical gradient background tile.
const top = [43, 16, 85];   // #2b1055
const bot = [20, 12, 48];   // #140c30
for (let y = 0; y < SIZE; y++) {
  const t = y / (SIZE - 1);
  const r = Math.round(lerp(top[0], bot[0], t));
  const g = Math.round(lerp(top[1], bot[1], t));
  const b = Math.round(lerp(top[2], bot[2], t));
  for (let x = 0; x < SIZE; x++) setPx(x, y, r, g, b);
}

// Rounded-rect mask: paint only inside the tile radius.
const R = 110;
function inside(x, y) {
  const cx = Math.min(Math.max(x, R), SIZE - 1 - R);
  const cy = Math.min(Math.max(y, R), SIZE - 1 - R);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= R * R;
}
for (let y = 0; y < SIZE; y++)
  for (let x = 0; x < SIZE; x++)
    if (!inside(x, y)) setPx(x, y, 0, 0, 0, 0);

// Draw a filled ring (annulus) centered at (cx,cy).
function ring(cx, cy, radius, thickness, rgb) {
  const r2o = (radius + thickness / 2) ** 2;
  const r2i = (radius - thickness / 2) ** 2;
  for (let y = Math.floor(cy - radius - thickness); y <= cy + radius + thickness; y++)
    for (let x = Math.floor(cx - radius - thickness); x <= cx + radius + thickness; x++) {
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d <= r2o && d >= r2i) setPx(x, y, rgb[0], rgb[1], rgb[2]);
    }
}

// Onion glyph: concentric rings + a stem.
const accent = [124, 92, 255]; // #7c5cff
const white = [235, 238, 247];
const cx = SIZE / 2, cy = SIZE / 2 + 18;
[150, 116, 82, 48].forEach((rad, idx) => ring(cx, cy, rad, 9, white));
// Stem
for (let y = cy - 200; y < cy - 150; y++) {
  for (let x = cx - 5; x <= cx + 5; x++) setPx(x, y, white[0], white[1], white[2]);
}
// Two leaves
for (let i = 0; i < 60; i++) {
  setPx(cx + 6 + i, cy - 200 - Math.round(40 * Math.sin((i / 60) * Math.PI)), white[0], white[1], white[2]);
  setPx(cx - 6 - i, cy - 200 - Math.round(40 * Math.sin((i / 60) * Math.PI)), white[0], white[1], white[2]);
}

// --- PNG encoding (RGBA, no external deps) ---
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // color type RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0; // filter none
  buf.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}
const idat = zlib.deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0))
]);

const out = path.join(__dirname, '..', 'build', 'icon.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log('Wrote', out, png.length, 'bytes');
