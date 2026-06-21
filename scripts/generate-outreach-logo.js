#!/usr/bin/env node
/**
 * Builds public/images/outreach-logo.png from brand-logo.png — same gold style,
 * "SelfAppeal" instead of "SexAppeal" (covers "Sex" and draws "Self").
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BRAND = path.resolve(__dirname, '..', 'public', 'images', 'brand-logo.png');
const OUT = path.resolve(__dirname, '..', 'public', 'images', 'outreach-logo.png');

async function main() {
  if (!fs.existsSync(BRAND)) {
    throw new Error(`Missing ${BRAND}`);
  }

  const meta = await sharp(BRAND).metadata();
  const w = meta.width || 1200;
  const h = meta.height || 630;

  // Cover the script "Sex" portion (~46% width) and redraw "Self" in matching gold.
  const coverW = Math.round(w * 0.46);
  const overlay = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5e6a8"/>
      <stop offset="35%" stop-color="#d4af37"/>
      <stop offset="70%" stop-color="#b8860b"/>
      <stop offset="100%" stop-color="#f0d875"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${Math.round(h * 0.18)}" width="${coverW}" height="${Math.round(h * 0.52)}" fill="#0a0a0a"/>
  <text x="${Math.round(coverW * 0.42)}" y="${Math.round(h * 0.52)}"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${Math.round(h * 0.19)}" font-style="italic" font-weight="400"
    fill="url(#gold)">Self</text>
</svg>`);

  await sharp(BRAND)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  console.log(`Wrote ${OUT} from brand-logo.png (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
