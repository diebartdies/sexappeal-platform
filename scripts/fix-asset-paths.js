const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

fs.readdirSync(publicDir)
  .filter((f) => f.endsWith('.html'))
  .forEach((file) => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const updated = content
      .replace(/href="css\//g, 'href="/css/')
      .replace(/src="js\//g, 'src="/js/');
    if (updated !== content) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log('Updated', file);
    }
  });
