#!/usr/bin/env node
/**
 * Build awareness ribbon PNGs: red (AIDS) and pink (breast), black background.
 * Source: public/images/awareness-ribbon-aids.png (3D red ribbon on white).
 */
const path = require('path');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'public', 'images', 'awareness-ribbon-source.png');
const OUT_AIDS = path.join(__dirname, '..', 'public', 'images', 'awareness-ribbon-aids.png');
const OUT_BREAST = path.join(__dirname, '..', 'public', 'images', 'awareness-ribbon-breast.png');

function isBackground(r, g, b) {
  return r > 235 && g > 235 && b > 235;
}

function toPink(r, g, b) {
  const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  const sat = 0.85;
  const pinkR = Math.round(255 * (0.55 + lum * 0.45) * sat + 40 * (1 - sat));
  const pinkG = Math.round(255 * (0.25 + lum * 0.35) * sat);
  const pinkB = Math.round(255 * (0.45 + lum * 0.45) * sat + 30);
  return [
    Math.min(255, Math.round(r * 0.15 + pinkR * 0.85)),
    Math.min(255, Math.round(g * 0.15 + pinkG * 0.85)),
    Math.min(255, Math.round(b * 0.15 + pinkB * 0.85))
  ];
}

async function processRibbon({ pink = false } = {}) {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  const { width, height, channels } = info;

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (isBackground(r, g, b)) {
      pixels[i] = 0;
      pixels[i + 1] = 0;
      pixels[i + 2] = 0;
      pixels[i + 3] = 255;
      continue;
    }

    if (pink) {
      const [nr, ng, nb] = toPink(r, g, b);
      pixels[i] = nr;
      pixels[i + 1] = ng;
      pixels[i + 2] = nb;
    }
  }

  return sharp(pixels, { raw: { width, height, channels } }).png();
}

async function main() {
  await (await processRibbon({ pink: false })).toFile(OUT_AIDS);
  await (await processRibbon({ pink: true })).toFile(OUT_BREAST);
  console.log('Wrote', OUT_AIDS);
  console.log('Wrote', OUT_BREAST);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
