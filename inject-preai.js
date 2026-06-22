const fs = require('fs');
const path = require('path');

const dir = __dirname;
const allFiles = fs.readdirSync(dir);

let injectedCount = 0;

allFiles.forEach(file => {
    if (file.endsWith('.html')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf-8');
        let origContent = content;

        // Ensure preai-overhaul.css is included
        const preaiTag = '<link rel="stylesheet" href="preai-overhaul.css">';
        if (!content.includes('preai-overhaul.css')) {
            // Find </head> to inject it just before
            if (content.includes('</head>')) {
                content = content.replace('</head>', `    ${preaiTag}\n</head>`);
                injectedCount++;
            }
        }
        
        // Disable touch hover states if missing (for GSAP/mobile optimization config)
        // Ensure meta viewport is correct
        if (!content.includes('viewport" content="width=device-width, initial-scale=1.0')) {
             if (content.includes('viewport" content="width=device-width, initial-scale=1')) {
                 content = content.replace('viewport" content="width=device-width, initial-scale=1"', 'viewport" content="width=device-width, initial-scale=1.0"');
             }
        }

        if (content !== origContent) {
            fs.writeFileSync(path.join(dir, file), content, 'utf-8');
            console.log(`Injected preai-overhaul.css into: ${file}`);
        }
    }
});

console.log(`Total injections completed: ${injectedCount}`);
