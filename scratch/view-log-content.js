const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\22f7580d-55fb-49a6-9dd7-e50f321df609\\.system_generated\\logs\\transcript.jsonl';

const rl = readline.createInterface({
    input: fs.createReadStream(logPath),
    crlfDelay: Infinity
});

rl.on('line', (line) => {
    try {
        const obj = JSON.parse(line);
        if (obj.step_index === 525) {
            console.log(`Type: ${obj.type}`);
            console.log(`Content length: ${obj.content ? obj.content.length : 0}`);
            if (obj.content) {
                const lines = obj.content.split('\n');
                console.log(`Lines count in content: ${lines.length}`);
                console.log("First 20 lines of content:");
                for (let i = 0; i < Math.min(20, lines.length); i++) {
                    console.log(lines[i]);
                }
                console.log("\nLast 20 lines of content:");
                for (let i = Math.max(0, lines.length - 20); i < lines.length; i++) {
                    console.log(lines[i]);
                }
            }
            rl.close();
        }
    } catch (e) {
        // ignore
    }
});
