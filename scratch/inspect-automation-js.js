const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';
const files = ['assets/js/admin-engine.js', 'assets/js/dashboard-engine.js', 'assets/js/visual-enhancements.js'];

files.forEach(f => {
    const filePath = path.join(WORKSPACE_DIR, f);
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        if (line.includes('auto-welcome') || line.includes('auto-reminder') || line.includes('auto-certificates') || line.includes('save-automation-btn') || line.includes('automation')) {
            console.log(`${f}:${idx + 1}: ${line.trim()}`);
        }
    });
});
