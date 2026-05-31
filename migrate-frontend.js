const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

function updateFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found, skipping: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    replacements.forEach(({ search, replace, ignoreIfContains }) => {
        if (ignoreIfContains && content.includes(ignoreIfContains)) {
            return; // Skip to prevent duplicate injections if already applied
        }
        
        if (content.match(search) && content !== content.replace(search, replace)) {
            content = content.replace(search, replace);
            modified = true;
        }
    });
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Successfully updated: ${filePath}`);
    } else {
        console.log(`ℹ️ No changes needed for: ${filePath}`);
    }
}

// 1. CSS Updates (Rename .tier-badge to .quality-badge, etc.)
const cssDir = path.join(publicDir, 'css');
if (fs.existsSync(cssDir)) {
    fs.readdirSync(cssDir).forEach(file => {
        if (file.endsWith('.css')) {
            updateFile(path.join(cssDir, file), [
                { search: /\.tier-/g, replace: '.quality-' }
            ]);
        }
    });
}

// 2. Categories HTML (Update discovery filters)
const categoriesPath = path.join(publicDir, 'categories.html');
updateFile(categoriesPath, [
    { search: /id="tierSelect"/g, replace: 'id="qualitySelect"' },
    { search: /name="tier"/g, replace: 'name="quality"' },
    { search: /for="tierSelect"[^>]*>[^<]+/g, replace: 'for="qualitySelect">Quality' },
    { search: /id="serviceSelect"/g, replace: 'id="specialtySelect"' },
    { search: /name="service"/g, replace: 'name="specialty"' },
    { search: /for="serviceSelect"[^>]*>[^<]+/g, replace: 'for="specialtySelect">Specialty' },
    { search: /<div class="filter-group">\s*<label for="qualitySelect">/g, replace: '<div class="filter-group">\n    <label for="provinceSelect">Province</label>\n    <select id="provinceSelect" name="province"><option value="">All</option></select>\n</div>\n<div class="filter-group">\n    <label for="citySelect">City</label>\n    <select id="citySelect" name="city"><option value="">All</option></select>\n</div>\n<div class="filter-group">\n    <label for="neighborhoodSelect">Neighborhood</label>\n    <select id="neighborhoodSelect" name="neighborhood"><option value="">All</option></select>\n</div>\n<div class="filter-group">\n    <label for="qualitySelect">', ignoreIfContains: 'id="provinceSelect"' }
]);

// 3. Register HTML (Swap text input for a select dropdown)
const registerPath = path.join(publicDir, 'register.html');
updateFile(registerPath, [
    { search: /<input[^>]*id="regQuality"[^>]*>/g, replace: '<select id="regQuality" name="quality">\n        <option value="Standard">Standard</option>\n        <option value="Silver">Silver</option>\n        <option value="Gold">Gold</option>\n        <option value="Premium">Premium</option>\n    </select>' },
    { search: /for="regServices"[^>]*>[^<]+/g, replace: 'for="regServices">Specialties (Hold Ctrl/Cmd to select multiple)' },
    { search: /<input[^>]*id="regServices"[^>]*>/g, replace: '<select id="regServices" name="services" multiple size="5">\n        <option value="Massage">Massage</option>\n        <option value="Virtual Connection">Virtual Connection</option>\n        <option value="love alchemy">love alchemy</option>\n        <option value="Fantasies">Fantasies</option>\n        <option value="Content Delivery">Content Delivery</option>\n    </select>' },
    { search: /<input[^>]*id="regProvince"[^>]*>/g, replace: '<select id="regProvince" name="province" required>\n        <option value="">Loading...</option>\n    </select>' },
    { search: /<input[^>]*id="regCity"[^>]*>/g, replace: '<select id="regCity" name="city" required>\n        <option value="">Loading...</option>\n    </select>' },
    { search: /<input[^>]*id="regNeighborhood"[^>]*>/g, replace: '<select id="regNeighborhood" name="neighborhood">\n        <option value="">Loading...</option>\n    </select>' }
]);

// 4. Dashboard HTML (Swap text input for a select dropdown)
const dashboardPath = path.join(publicDir, 'dashboard.html');
updateFile(dashboardPath, [
    { search: /<input[^>]*id="upQuality"[^>]*>/g, replace: '<select id="upQuality" class="form-control" name="quality">\n        <option value="Standard">Standard</option>\n        <option value="Silver">Silver</option>\n        <option value="Gold">Gold</option>\n        <option value="Premium">Premium</option>\n    </select>' },
    { search: /for="upServices"[^>]*>[^<]+/g, replace: 'for="upServices">Specialties (Hold Ctrl/Cmd to select multiple)' },
    { search: /<input[^>]*id="upServices"[^>]*>/g, replace: '<select id="upServices" class="form-control" name="services" multiple size="5">\n        <option value="Massage">Massage</option>\n        <option value="Virtual Connection">Virtual Connection</option>\n        <option value="love alchemy">love alchemy</option>\n        <option value="Fantasies">Fantasies</option>\n        <option value="Content Delivery">Content Delivery</option>\n    </select>' },
    { search: /<div class="form-group">\s*<label for="upMeasurements">/g, replace: '<div class="form-group">\n    <label for="upProvince">Province</label>\n    <select id="upProvince" class="form-control" name="province" required><option value="">Loading...</option></select>\n</div>\n<div class="form-group">\n    <label for="upCity">City</label>\n    <select id="upCity" class="form-control" name="city" required><option value="">Loading...</option></select>\n</div>\n<div class="form-group">\n    <label for="upNeighborhood">Neighborhood</label>\n    <select id="upNeighborhood" class="form-control" name="neighborhood"><option value="">Loading...</option></select>\n</div>\n<div class="form-group">\n    <label for="upMeasurements">', ignoreIfContains: 'id="upProvince"' }
]);

// 5. SEO Meta Tags Injection (All HTML files)
const seoTags = `
    <!-- SEO & Open Graph Tags -->
    <meta name="description" content="SexAppeal - The Architecture of Intimacy. Directorio exclusivo de acompañantes VIP y Living Treasures.">
    <meta property="og:title" content="SexAppeal Platform">
    <meta property="og:description" content="El santuario definitivo para conexiones de alto nivel y discreción absoluta.">
    <meta property="og:image" content="https://sexappeal.drsrv.net.ar/SexAppeal_logo_black.png">
    <meta property="og:url" content="https://sexappeal.drsrv.net.ar">
    <meta property="og:type" content="website">
    <meta name="theme-color" content="#D4AF37">
</head>`;

fs.readdirSync(publicDir).forEach(file => {
    if (file.endsWith('.html')) {
        updateFile(path.join(publicDir, file), [
            { search: /(sexappel_logo_logo|SexAppeal_logo|sexappeal_logo_logo_black)\.(svg|png)/g, replace: 'SexAppeal_logo_black.png' },
            // Replace any hardcoded old logo images in the HTML body with the new logo
            { search: /src="[^"]*\blogo\.(svg|png|jpg)"/gi, replace: 'src="/SexAppeal_logo_black.png"' },
            { search: /(?:\s*<!-- SEO & Open Graph Tags -->[\s\S]*?)?<\/head>/i, replace: seoTags }
        ]);
    }
});

// 6. Ensure Auth pages (Login, Register, etc.) have the logo prominently displayed
['login.html', 'register.html', 'recover.html', 'verify.html'].forEach(page => {
    const pagePath = path.join(publicDir, page);
    updateFile(pagePath, [
        // Inject the logo prominently above the form if one isn't already present in the layout
        { 
            search: /(<form id="(?:loginForm|registerForm|forgotPasswordForm|verifyForm)"[^>]*>)/i, 
            replace: '<div style="text-align: center; margin-bottom: 25px;">\n        <img src="/SexAppeal_logo_black.png" alt="SexAppeal Logo" style="height: 70px; width: auto; background-color: #000; border-radius: 8px; padding: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">\n    </div>\n    $1',
            ignoreIfContains: '<img src="/SexAppeal_logo_black.png"'
        }
    ]);
});

console.log('\n🎉 Frontend migration complete!');