const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const excludeFiles = ['index.html', 'login.html'];
const injectCode = '<script src="/js/guard.js"></script>\n</head>';

fs.readdirSync(publicDir).forEach(file => {
    if (file.endsWith('.html') && !excludeFiles.includes(file)) {
        const filePath = path.join(publicDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Only inject if it hasn't been added yet
        if (content.includes('</head>') && !content.includes('/js/guard.js')) {
            content = content.replace('</head>', injectCode);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Secured: ${file}`);
        } else {
            console.log(`ℹ️ Already secured (or missing </head>): ${file}`);
        }
    }
});

console.log('🚀 Route Guard application complete!');