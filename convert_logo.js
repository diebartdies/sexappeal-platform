const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function convertSvgToJpg() {
    console.log('--- Starting Logo Conversion ---');
    
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // Read the SVG file
        const svgContent = fs.readFileSync(path.join(__dirname, 'logo.svg'), 'utf8');
        
        // Wrap the SVG in a dark background HTML page to match your theme
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; background-color: #121212; display: flex; justify-content: center; align-items: center; width: 400px; height: 400px; }
                    svg { width: 400px; height: 400px; }
                </style>
            </head>
            <body>
                ${svgContent}
            </body>
            </html>
        `;

        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.setViewport({ width: 400, height: 400 });
        
        // Take a high-quality screenshot and save it as a JPG
        await page.screenshot({ 
            path: path.join(__dirname, 'logo.jpg'), 
            type: 'jpeg', 
            quality: 100,
            clip: { x: 0, y: 0, width: 400, height: 400 }
        });

        await browser.close();
        console.log('✅ Successfully rendered and saved logo to logo.jpg!');
    } catch (err) { console.error('❌ Error converting logo:', err.message); }
}

convertSvgToJpg();