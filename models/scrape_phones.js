const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const puppeteer = require('puppeteer');
const connectDB = require('../config/database');
const PotentialProfessional = require('./PotentialProfessional');

// Add the URLs of the root domain pages you want to scrape here
const targetWebpages = [
    'https://www.argxp.com',
    'https://www.gemidos.tv',
    'https://www.empireescorts.com'
];

// Regex designed to capture common Argentine mobile numbers (with or without +54 9)
const phoneRegex = /(?:\+?54\s*9?)?[\s\-]*(?:0\s*)?(?:11|[23]\d{1,3})(?:[\s\-]*15)?(?:[\s\-]*\d){6,8}/g;

async function extractPhones() {
    console.log('--- Starting Puppeteer Contact Extraction ---');
    
    // Connect to the database
    await connectDB();

    // Launch a headless browser
    const browser = await puppeteer.launch({ 
        headless: "new",
        userDataDir: './.cache/puppeteer_user_data',
        args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();

    // Set a realistic User-Agent to bypass basic anti-bot protections like Cloudflare
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const url of targetWebpages) {
        console.log(`\n🔍 Exploring: ${url}`);
        try {
            // Go to the main page
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Wait to ensure initial redirects settle
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Attempt to automatically bypass common "18+" or "Enter" popups
            try {
                const clickedPopup = await page.evaluate(() => {
                    const elements = Array.from(document.querySelectorAll('a, button, div[role="button"]'));
                    const keywords = ['18+', 'entrar', 'soy mayor', 'enter', 'accept', 'agree', 'sí,', 'si,', 'ingresar', 'acceder', 'continuar', 'yes', 'confirmar'];
                    for (const el of elements) {
                        const text = (el.innerText || '').toLowerCase().trim();
                        if (text.length > 0 && text.length < 30 && keywords.some(kw => text.includes(kw)) && el.offsetHeight > 0) {
                            el.click();
                            return true;
                        }
                    }
                    return false;
                });

                if (clickedPopup) {
                    console.log('   Clicked entrance popup, waiting for redirect...');
                    await new Promise(resolve => setTimeout(resolve, 6000));
                }
            } catch (err) {
                // Ignore if it fails, not all sites have popups
            }

            // Scroll down to trigger lazy-loaded profiles and links
            try {
                await page.evaluate(async () => {
                    await new Promise(resolve => {
                        let totalHeight = 0;
                        const distance = 500;
                        const maxScrolls = 15; // prevent infinite scroll loops
                        let scrolls = 0;
                        const timer = setInterval(() => {
                            window.scrollBy(0, distance);
                            totalHeight += distance;
                            scrolls++;
                            if (scrolls >= maxScrolls || totalHeight >= document.body.scrollHeight) {
                                clearInterval(timer);
                                resolve();
                            }
                        }, 250);
                    });
                });
            } catch (err) {}

            // Wait a brief moment for any dynamic Javascript profiles to render
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Extract all internal links that might lead to a profile
            const links = await page.evaluate(() => {
                const baseHost = window.location.hostname.replace('www.', '');
                const currentUrl = window.location.href.split('#')[0];
                
                return Array.from(document.querySelectorAll('a'))
                    .map(a => a.href)
                    .filter(href => {
                        try {
                            const urlObj = new URL(href);
                            // Check if the link belongs to the same domain (ignoring www and redirects)
                            return urlObj.hostname.includes(baseHost) && 
                                   href.split('#')[0] !== currentUrl && 
                                   href.split('#')[0] !== currentUrl + '/';
                        } catch (e) {
                            return false;
                        }
                    });
            });
            
            // Remove duplicates
            const uniqueLinks = [...new Set(links)];
            // Increased the limit to harvest a massive batch specifically from ArgXP
            const profileLinksToVisit = uniqueLinks.slice(0, 100);
            console.log(`   Found ${uniqueLinks.length} internal links. Visiting ${profileLinksToVisit.length} profiles...`);

            const sitePhones = new Map();

            // Visit each profile link
            for (const profileLink of profileLinksToVisit) {
                try {
                    // Random delay between 2 to 5 seconds to mimic human behavior
                    const delay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
                    await new Promise(resolve => setTimeout(resolve, delay));

                    await page.goto(profileLink, { waitUntil: 'domcontentloaded', timeout: 15000 });
                    const html = await page.content();
                    
                    // Custom DOM Parser for all directories
                    let extractedAlias = await page.evaluate(() => {
                        // Most directories put the name in the primary H1 tag
                        const h1 = document.querySelector('h1');
                        if (h1 && h1.innerText) return h1.innerText.trim();
                        return '';
                    });
                    
                    // Disregard generic directory titles masquerading as aliases
                    if (extractedAlias) {
                        extractedAlias = extractedAlias.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
                        const lowerAlias = extractedAlias.toLowerCase();
                        if (lowerAlias.includes('escort') || lowerAlias.includes('puta') || lowerAlias.includes('gemidos') || lowerAlias.includes('argxp') || lowerAlias.includes('empire') || lowerAlias.includes('baires') || lowerAlias.includes('damas de') || lowerAlias.includes('connections') || lowerAlias.includes('lima leonis') || lowerAlias.includes('dream girl')) {
                            extractedAlias = '';
                        }
                    }

                    // Extract numbers directly from explicit WhatsApp links (highly accurate)
                    const waLinks = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp.com/send"], a[href*="whatsapp://send"], a[href*="web.whatsapp.com/send"]'))
                            .map(a => a.href);
                    });

                    let rawPhonesData = [];
                    waLinks.forEach(link => {
                        try {
                            const urlObj = new URL(link);
                            let pStr = urlObj.hostname.includes('wa.me') ? urlObj.pathname.replace('/', '') : urlObj.searchParams.get('phone');
                            let linkAlias = '';
                            
                            // Attempt to extract alias from the text parameter (e.g. "Hola *Megan*...")
                            const textParam = urlObj.searchParams.get('text');
                            if (textParam) {
                                console.log(`   [DEBUG] Raw WhatsApp text found: "${textParam}"`);
                                const match = textParam.match(/\*(.*?)\*/);
                                if (match && match[1]) {
                                    linkAlias = match[1].trim();
                                    console.log(`   [DEBUG] -> Successfully extracted name (via asterisks): "${linkAlias}"`);
                                } else {
                                    const matchFallback = textParam.match(/Hola\s+([^,¿\?]+)/i);
                                    if (matchFallback && matchFallback[1]) {
                                        linkAlias = matchFallback[1].trim();
                                        console.log(`   [DEBUG] -> Successfully extracted name (via fallback): "${linkAlias}"`);
                                    } else {
                                        console.log(`   [DEBUG] -> Failed to extract name from text.`);
                                    }
                                }
                            }

                            if (pStr) {
                                rawPhonesData.push({ phone: pStr.replace(/\D/g, ''), alias: linkAlias });
                            }
                        } catch (e) {}
                    });

                    // Fallback: extract from raw HTML text
                    const matches = html.match(phoneRegex);
                    if (matches && matches.length > 0) {
                        matches.forEach(phone => {
                            rawPhonesData.push({ phone: phone.replace(/\D/g, ''), alias: '' });
                        });
                    }

                    if (rawPhonesData.length > 0) {
                        rawPhonesData.forEach(item => {
                            
                            const cleanPhone = item.phone;

                            // Normalize to national 10-digit number for validation
                            let nationalPhone = cleanPhone;
                            if (nationalPhone.startsWith('549') && nationalPhone.length >= 13) nationalPhone = nationalPhone.slice(3);
                            else if (nationalPhone.startsWith('54') && nationalPhone.length >= 12) nationalPhone = nationalPhone.slice(2);
                            
                            if (nationalPhone.startsWith('0') && nationalPhone.length >= 11) nationalPhone = nationalPhone.slice(1);

                            // Strip the '15' mobile prefix if it's included after the area code
                            if (nationalPhone.length === 12) {
                                if (nationalPhone.startsWith('1115')) nationalPhone = '11' + nationalPhone.slice(4);
                                else if (/^[23]\d{2}15/.test(nationalPhone)) nationalPhone = nationalPhone.slice(0, 3) + nationalPhone.slice(5);
                                else if (/^[23]\d{3}15/.test(nationalPhone)) nationalPhone = nationalPhone.slice(0, 4) + nationalPhone.slice(6);
                            }

                            // Only accept exactly 10 digits without 6+ repeating numbers
                            if (nationalPhone.length === 10 && !/(.)\1{5,}/.test(nationalPhone)) {
                                const finalAlias = item.alias || extractedAlias;
                                // Only save if we don't have it, or if we found a better alias for an existing number
                                if (!sitePhones.has(nationalPhone) || (finalAlias && !sitePhones.get(nationalPhone))) {
                                    sitePhones.set(nationalPhone, finalAlias);
                                }
                            }
                        });
                    }
                } catch (err) {
                    console.log(`   ⚠️ Could not load profile ${profileLink} - Error: ${err.message}`);
                }
            }
            
            if (sitePhones.size > 0) {
                console.log(`✅ Found ${sitePhones.size} contacts on ${url}:`);
                for (const [phone, alias] of sitePhones.entries()) {
                    console.log(`   - ${phone} ${alias ? `(Alias: ${alias})` : ''}`);
                    try {
                        const updateOps = { $setOnInsert: { phone: phone, sourceUrl: url } };
                        if (alias) updateOps.$set = { alias: alias };

                        await PotentialProfessional.updateOne(
                            { phone: phone },
                            updateOps,
                            { upsert: true }
                        );
                    } catch (dbErr) {
                        console.error(`     ⚠️ Database error for ${phone}: ${dbErr.message}`);
                    }
                }
            } else {
                console.log(`❌ No phone numbers found across explored profiles on ${url}`);
            }
            
        } catch (error) {
            console.error(`⚠️ Failed to load base site ${url} - Error: ${error.message}`);
        }
    }
    
    await browser.close();
    console.log('\n--- Extraction Complete ---');
    // Exit the process so the database connection doesn't keep the script hanging
    process.exit(0);
}

extractPhones();