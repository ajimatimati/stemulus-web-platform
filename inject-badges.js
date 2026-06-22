const fs = require('fs');
const path = require('path');

const indexHtml = path.join(__dirname, 'index.html');
let content = fs.readFileSync(indexHtml, 'utf-8');

const badges = [
    'SYS.01 // INIT',
    'SYS.02 // EXE',
    'SYS.03 // HW',
    'SYS.04 // BIN',
    'SYS.05 // NET',
    'SYS.06 // CORE'
];

let i = 0;
// We need to replace the entire <div class="icon-3d">...</div></div> block.
// Example:
// <div class="icon-3d"><div class="icon-3d-inner">
//     <div class="face face-front icon-game">🎨</div>
//     <div class="face face-top   icon-game"></div>
//     <div class="face face-right icon-game"></div>
// </div></div>
content = content.replace(/<div class="icon-3d">[\s\S]*?<\/div><\/div>/g, () => {
    if (i >= badges.length) return '';
    const badgeHtml = `<div class="tech-badge"><span class="blink-square"></span>${badges[i]}</div>`;
    i++;
    return badgeHtml;
});

fs.writeFileSync(indexHtml, content, 'utf-8');
console.log(`Replaced ${i} 3D icon blocks with brutalist tech badges.`);
