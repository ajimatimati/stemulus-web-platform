const fs = require('fs');
const path = require('path');

const dir = __dirname;
const allFiles = fs.readdirSync(dir);

allFiles.forEach(file => {
    let filepath = path.join(dir, file);
    if (fs.statSync(filepath).isFile() && (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.json'))) {
        let content = fs.readFileSync(filepath, 'utf-8');
        let origContent = content;
        
        // Fix 5-17
        content = content.replace(/5-17/g, '5-17');
        content = content.replace(/5-17/g, '5-17'); // en-dash
        content = content.replace(/5-17/g, '5-17');
        content = content.replace(/5-17/g, '5-17');
        
        // Fix 500+ Hours Coded to 500+ Hours Coded (or similar stats) if it exists
        content = content.replace(/100\+ Students/gi, '500+ Hours Coded');
        content = content.replace(/100\+\s*<\/?span[^>]*>\s*<span[^>]*>Students/gi, '500+</span>\n            <span class="preai-hero-stat-lbl">Hours Coded');

        if (content !== origContent) {
            fs.writeFileSync(filepath, content, 'utf-8');
            console.log('Fixed inconsistencies in:', file);
        }
    }
});

// Also check the assets/js and assets/data folders
const subdirs = ['assets/js', 'assets/data'];
subdirs.forEach(sub => {
    let subpath = path.join(dir, sub);
    if(fs.existsSync(subpath)) {
        fs.readdirSync(subpath).forEach(file => {
            let filepath = path.join(subpath, file);
            if (fs.statSync(filepath).isFile() && (file.endsWith('.js') || file.endsWith('.json'))) {
                let content = fs.readFileSync(filepath, 'utf-8');
                let origContent = content;
                
                content = content.replace(/5-17/g, '5-17');
                content = content.replace(/5-17/g, '5-17');
                content = content.replace(/5-17/g, '5-17');
                content = content.replace(/5-17/g, '5-17');

                if (content !== origContent) {
                    fs.writeFileSync(filepath, content, 'utf-8');
                    console.log('Fixed inconsistencies in:', sub + '/' + file);
                }
            }
        });
    }
});
