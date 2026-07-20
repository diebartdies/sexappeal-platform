const fs = require('fs');

const taxonomy = {
  version: '1.0',
  philosophy: 'Eliminar barreras. Uno resuelve lo que busca, el otro gana haciendo lo que le apasiona.',
  domains: require('./taxonomy-data').domains
};

const intro = '// Complete service taxonomy tree\nconst taxonomy = ';
const out = intro + JSON.stringify(taxonomy, null, 2) + ';\n\nmodule.exports = taxonomy;\n';
fs.writeFileSync('utils/serviceTaxonomy.js', out, 'utf8');
console.log('Written ' + out.length + ' bytes');
