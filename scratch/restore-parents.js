const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\22f7580d-55fb-49a6-9dd7-e50f321df609\\.system_generated\\logs\\transcript.jsonl';
const outputPath = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\scratch\\restored-parents.html';

const rl = readline.createInterface({
    input: fs.createReadStream(logPath),
    crlfDelay: Infinity
});

let found = false;

rl.on('line', (line) => {
    try {
        const obj = JSON.parse(line);
        if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('for-parents.html')) {
            console.log(`Found file contents at step ${obj.step_index}`);
            
            // Extract lines that start with "<number>: "
            const rawText = obj.content;
            const lines = rawText.split(/\r?\n/);
            const cleanLines = [];
            
            lines.forEach(l => {
                const match = l.match(/^\d+:\s?(.*)$/);
                if (match) {
                    cleanLines.push(match[1]);
                }
            });
            
            if (cleanLines.length > 0) {
                fs.writeFileSync(outputPath, cleanLines.join('\n'), 'utf8');
                console.log(`Successfully extracted and saved to ${outputPath}`);
                found = true;
                rl.close();
            }
        }
    } catch (e) {
        // ignore
    }
});

rl.on('close', () => {
    if (!found) {
        console.log("Could not find the full view of for-parents.html in the logs.");
    }
});
