const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public', 'docs');

const BROCHURES = [
  {
    html: path.join(root, 'investor_materials', 'platform_brochure.html'),
    pdf: path.join(outDir, 'SexAppeal_brochure.pdf')
  },
  {
    html: path.join(root, 'investor_materials', 'drsrv_brochure.html'),
    pdf: path.join(outDir, 'DRSRV_brochure.pdf')
  }
];

async function generatePdf(browser, htmlPath, outPdf) {
  if (!fs.existsSync(htmlPath)) {
    console.error('Missing brochure HTML:', htmlPath);
    return false;
  }

  const page = await browser.newPage();
  try {
    await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
      waitUntil: 'networkidle0',
      timeout: 120000
    });
    await page.waitForFunction(() => typeof window.mermaid !== 'undefined', { timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    await page.pdf({
      path: outPdf,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' }
    });

    console.log('Brochure PDF written to', outPdf);
    return true;
  } finally {
    await page.close();
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const target = process.argv[2];
  const list = target
    ? BROCHURES.filter((b) => path.basename(b.pdf).includes(target))
    : BROCHURES;

  if (list.length === 0) {
    console.error('Unknown brochure target:', target);
    console.error('Usage: node generate-brochure-pdf.js [SexAppeal|DRSRV]');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const { html, pdf } of list) {
      await generatePdf(browser, html, pdf);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
