const fs = require('fs');
const path = require('path');

const NEW_VERSION = '6.5';
console.log(`--- Bumping Cache Version to ${NEW_VERSION} ---`);

const files = ['categories.html', 'dashboard.html', 'treasure.html', 'index.html', 'login.html', 'register.html', 'verify.html'];
files.forEach(file => {
    const filePath = path.join(__dirname, 'public', file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/app\.js(\?v=[0-9.]+)?/g, `app.js?v=${NEW_VERSION}`);
        content = content.replace(/css\/style\.css(\?v=[0-9.]+)?/g, `css/style.css?v=${NEW_VERSION}`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated ${file}`);
    }
});