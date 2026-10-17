const fs = require('fs');
const path = require('path');

const fName = 'STEMulus Kids Tech \u2014 Tutor Application & Assessment.csv';
const innerPath = path.join('C:\\Users\\USER\\Downloads', fName, fName);

function parseCSV(text) {
  const rows = [];
  let row = [];
  let token = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i+1] === '"') {
        token += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(token);
      token = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && text[i+1] === '\n') i++;
      row.push(token);
      token = '';
      if (row.length > 1 || row[0]) rows.push(row);
      row = [];
    } else {
      token += c;
    }
  }
  if (token || row.length) { row.push(token); rows.push(row); }
  return rows;
}

if (!fs.existsSync(innerPath)) {
  console.log('File not found:', innerPath);
  process.exit(1);
}

const text = fs.readFileSync(innerPath, 'utf8');
const rows = parseCSV(text);
console.log('Total Parsed Rows:', rows.length);

for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  console.log(`[TUTOR ${r}] Name: "${row[1]}" | Email: "${row[2]}" | Phone: "${row[3]}" | Exp: "${row[4]}"`);
}
