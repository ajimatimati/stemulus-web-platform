const fs = require('fs');
let code = fs.readFileSync('assets/js/admin-engine.js', 'utf8');

const marker1 = 'var csvContent =';
const marker2 = 'var blob = new Blob';
const idx1 = code.indexOf(marker1);
const idx2 = code.indexOf(marker2);

if (idx1 !== -1 && idx2 !== -1) {
    const cleanSnippet = `var csvContent = '\\uFEFF' + rows.map(function(r) {
        return r.map(function(field) {
            var str = String(field == null ? '' : field);
            if (str.includes(',') || str.includes('"') || str.indexOf('\\n') !== -1 || str.indexOf('\\r') !== -1) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }).join(',');
    }).join('\\r\\n');

    `;
    code = code.substring(0, idx1) + cleanSnippet + code.substring(idx2);
    fs.writeFileSync('assets/js/admin-engine.js', code, 'utf8');
    console.log('Fixed csvContent in admin-engine.js!');
} else {
    console.error('Could not find markers');
    process.exit(1);
}
