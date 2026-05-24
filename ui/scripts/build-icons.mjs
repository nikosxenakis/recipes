import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = resolve(__dirname, "..", "public");

const masterSvgPath = resolve(publicDir, "favicon.svg");
const masterSvg = readFileSync(masterSvgPath);

/** Render the master SVG at a specific size; optional flat background for opaque assets. */
async function renderPng(size, options = {}) {
  const { background } = options;
  let pipeline = sharp(masterSvg, { density: 384 }).resize(size, size);
  if (background) {
    pipeline = pipeline.flatten({ background });
  }
  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

async function main() {
  mkdirSync(publicDir, { recursive: true });

  // 1. Favicon: multi-resolution ICO from 16/32/48 PNGs.
  const [p16, p32, p48] = await Promise.all([renderPng(16), renderPng(32), renderPng(48)]);
  const ico = await pngToIco([p16, p32, p48]);
  writeFileSync(resolve(publicDir, "favicon.ico"), ico);

  // 2. Apple touch icon: 180x180 with opaque background (Safari hates transparency).
  const apple = await renderPng(180, { background: "#FBF6EE" });
  writeFileSync(resolve(publicDir, "apple-touch-icon.png"), apple);

  // 3. PWA install icons: maskable any (Android safe area is the inner 80%; our mark sits well within that).
  const icon192 = await renderPng(192);
  const icon512 = await renderPng(512);
  writeFileSync(resolve(publicDir, "icon-192.png"), icon192);
  writeFileSync(resolve(publicDir, "icon-512.png"), icon512);

  console.log("✓ favicon.ico (16/32/48)");
  console.log("✓ apple-touch-icon.png (180)");
  console.log("✓ icon-192.png, icon-512.png");
}

main().catch((err) => {
  console.error("Icon build failed:", err);
  process.exitCode = 1;
});
