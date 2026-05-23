const puppeteer = require('puppeteer');
const connectDB = require('../config/database');
const PotentialProfessional = require('../models/PotentialProfessional');

// Add the URLs of the root domain pages you want to scrape here
const targetWebpages = [
    'https://www.gemidos.tv',
    'https://www.bairesgirls.com',
    'https://www.argxp.com',
    'https://www.pekadoras.com',
    'https://www.selfieescorts.com',
    'https://www.sexysabor.com',
    'https://www.putasvip.com',
    'https://www.escortbuenosaires.com',
    'https://www.simpleescorts.com'
];

// Regex designed to capture common Argentine mobile numbers (with or without +54 9)
const phoneRegex = /(?:\+?54\s*9?)?\s*(?:11|[23]\d{2})\s*\d{4}[-\s]?\d{4}/g;

async function extractPhones() {
    console.log('--- Starting Puppeteer Contact Extraction ---');
    
    // Connect to the database
    await connectDB();

    // Launch a headless browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    for (const url of targetWebpages) {
        console.log(`\n🔍 Exploring: ${url}`);
        try {
            // Go to the main page
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Extract all internal links that might lead to a profile
            const links = await page.evaluate((baseUrl) => {
                return Array.from(document.querySelectorAll('a'))
                    .map(a => a.href)
                    .filter(href => href.startsWith(baseUrl) && href !== baseUrl && href !== baseUrl + '/');
            }, url);
            
            // Remove duplicates
            const uniqueLinks = [...new Set(links)];
            
            // To prevent the script from running forever, we'll only check the first 5 links per site
            // Increase this number to scrape deeper into their directories
            const profileLinksToVisit = uniqueLinks.slice(0, 5);
            console.log(`   Found ${uniqueLinks.length} internal links. Visiting ${profileLinksToVisit.length} profiles...`);

            const sitePhones = new Set();

            // Visit each profile link
            for (const profileLink of profileLinksToVisit) {
                try {
                    await page.goto(profileLink, { waitUntil: 'domcontentloaded', timeout: 15000 });
                    const html = await page.content();
                    
                    const matches = html.match(phoneRegex);
                    if (matches && matches.length > 0) {
                        matches.forEach(phone => sitePhones.add(phone.trim()));
                    }
                } catch (err) {
                    console.log(`   ⚠️ Could not load profile ${profileLink} - Error: ${err.message}`);
                }
            }
            
            if (sitePhones.size > 0) {
                console.log(`✅ Found ${sitePhones.size} contacts on ${url}:`);
                for (const phone of sitePhones) {
                    console.log(`   - ${phone}`);
                    try {
                        await PotentialProfessional.updateOne(
                            { phone: phone },
                            { $setOnInsert: { phone: phone, sourceUrl: url } },
                            { upsert: true } // Creates new document if it doesn't exist (ignores duplicates)
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