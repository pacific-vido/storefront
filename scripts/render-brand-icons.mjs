import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const mark = await readFile(path.join(root, "public/brand/mark.png"));
const appDir = path.join(root, "src/app");
await mkdir(appDir, { recursive: true });

const meta = await sharp(mark).metadata();
const pad = Math.round(Math.max(meta.width, meta.height) * 0.06);
const side = Math.max(meta.width, meta.height) + pad * 2;
const square = await sharp(mark)
  .resize({ width: meta.width, height: meta.height, fit: "contain" })
  .extend({
    top: Math.floor((side - meta.height) / 2),
    bottom: Math.ceil((side - meta.height) / 2),
    left: Math.floor((side - meta.width) / 2),
    right: Math.ceil((side - meta.width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

function sized(size) {
  return sharp(square).resize(size, size).png().toBuffer();
}

const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((size) => sized(size)));
await writeFile(path.join(appDir, "icon.png"), await sized(192));
const apple = await sized(180);
await writeFile(path.join(root, "public/apple-touch-icon.png"), apple);
await writeFile(path.join(appDir, "apple-icon.png"), apple);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
const entries = Buffer.alloc(16 * pngs.length);
let offset = header.length + entries.length;
pngs.forEach((image, index) => {
  const size = sizes[index];
  const cursor = index * 16;
  entries.writeUInt8(size, cursor);
  entries.writeUInt8(size, cursor + 1);
  entries.writeUInt16LE(1, cursor + 4);
  entries.writeUInt16LE(32, cursor + 6);
  entries.writeUInt32LE(image.length, cursor + 8);
  entries.writeUInt32LE(offset, cursor + 12);
  offset += image.length;
});
await writeFile(path.join(appDir, "favicon.ico"), Buffer.concat([header, entries, ...pngs]));
