const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'investor_materials', 'platform_brochure.html');
const outDir = path.join(root, 'public', 'docs');
const outPdf = path.join(outDir, 'SexAppeal_brochure.pdf');

async function main() {
  if (!fs.existsSync(htmlPath)) {
    console.error('Missing brochure HTML:', htmlPath);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
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
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
