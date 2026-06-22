const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'programs.html');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of data-age containing 1013
content = content.replace(/data-age="([^"]+)"/g, (match, ages) => {
    const updated = ages.split(',').map(a => a === '1013' ? '10-13' : a).join(',');
    return `data-age="${updated}"`;
});

// Replace checkbox values of 1013
content = content.replace(/value="1013"/g, 'value="10-13"');

// Clean up some spacing issues like "Ages 10  - 13" or "Ages 5  - 9" to standard single space "Ages 10 - 13"
content = content.replace(/Ages\s+(\d+)\s+-\s+(\d+)/g, 'Ages $1 - $2');
content = content.replace(/span\s+class="text-sm\s+font-semibold">(\d+)\s+-\s+(\d+)/g, 'span class="text-sm font-semibold">$1 - $2');
content = content.replace(/>(\d+)\s+-\s+(\d+)</g, '>$1 - $2<');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Programs page age range 10-13 fully healed!');
