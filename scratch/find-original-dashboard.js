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
        if (obj.tool_calls) {
            obj.tool_calls.forEach(tc => {
                if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
                    const args = typeof tc.args === 'string' ? JSON.parse(tc.args) : tc.args;
                    const file = args.TargetFile || args.targetFile || '';
                    if (file.includes('index.html')) {
                        console.log(`Step ${obj.step_index}: Edit to index.html`);
                        console.log(`Instruction: ${args.Instruction}`);
                        console.log(`TargetContent:\n${args.TargetContent || JSON.stringify(args.ReplacementChunks)}`);
                        console.log(`ReplacementContent:\n${args.ReplacementContent}\n`);
                    }
                }
            });
        }
    } catch (e) {
        // ignore JSON parse errors
    }
});
