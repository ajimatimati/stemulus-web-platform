const fs = require('fs');
const path = require('path');

const dir = __dirname;

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        const filepath = path.join(directory, file);
        const stat = fs.statSync(filepath);
        
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'tools') {
                processDirectory(filepath);
            }
        } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.json')) {
            let content = fs.readFileSync(filepath, 'utf-8');
            let origContent = content;
            
            // Replace Est. 2025, Est. 2025, etc.
            content = content.replace(/Est\.?\s*2025/gi, 'Est. 2025');
            // General 2025 in relevant contexts: 'Ages 5–17  ·  Est. 2025' etc.
            content = content.replace(/2025/g, '2025');

            if (content !== origContent) {
                fs.writeFileSync(filepath, content, 'utf-8');
                console.log(`Updated 2025 to 2025 in: ${filepath}`);
            }
        }
    });
}

processDirectory(dir);
console.log('Finished updating founding dates.');
