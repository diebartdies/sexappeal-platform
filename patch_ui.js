const fs = require('fs');
const path = require('path');

console.log('--- Applying UI Patches ---');

// 1. Patch categories.html to hide the filter card initially
const catPath = path.join(__dirname, 'public', 'categories.html');
if (fs.existsSync(catPath)) {
    let catHtml = fs.readFileSync(catPath, 'utf8');
    
    if (!catHtml.includes('style="display: none;"')) {
        catHtml = catHtml.replace(/<div class="card">\s*<h2 class="gold-text">Discover Our Treasures<\/h2>/, '<div class="card" style="display: none;">\n                <h2 class="gold-text">Discover Our Treasures</h2>');
        fs.writeFileSync(catPath, catHtml, 'utf8');
        console.log('✅ Patched categories.html');
    } else {
        console.log('ℹ️ categories.html is already patched.');
    }
}

// 2. Patch app.js to unhide the filter card once inside the drawer
const appPath = path.join(__dirname, 'public', 'js', 'app.js');
if (fs.existsSync(appPath)) {
    let appJs = fs.readFileSync(appPath, 'utf8');
    
    if (!appJs.includes("parentCard.style.display = 'block';")) {
        appJs = appJs.replace(/parentCard\.style\.padding = '0';\s*filterDrawer\.appendChild\(parentCard\);/, "parentCard.style.padding = '0';\n        parentCard.style.display = 'block';\n        filterDrawer.appendChild(parentCard);");
        fs.writeFileSync(appPath, appJs, 'utf8');
        console.log('✅ Patched app.js');
    } else {
        console.log('ℹ️ app.js is already patched.');
    }
}

console.log('\nAll done! You can test the changes now.');