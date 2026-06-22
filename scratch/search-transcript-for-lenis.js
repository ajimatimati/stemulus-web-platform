const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\474ad478-bb4f-4e25-9c84-cf8d5e89a51b\\.system_generated\\logs\\transcript.jsonl';

const rl = readline.createInterface({
    input: fs.createReadStream(logPath),
    crlfDelay: Infinity
});

let matches = [];

rl.on('line', (line) => {
    try {
        const obj = JSON.parse(line);
        const lineStr = JSON.stringify(obj);
        if (lineStr.toLowerCase().includes('smooth-scroll.js') && obj.type === 'WRITE_FILE' || obj.type === 'REPLACE_FILE_CONTENT' || obj.type === 'MULTI_REPLACE_FILE_CONTENT' || (obj.tool_calls && JSON.stringify(obj.tool_calls).toLowerCase().includes('smooth-scroll.js'))) {
            matches.push({
              index: obj.step_index,
              type: obj.type,
              tool_calls: obj.tool_calls,
              description: obj.description || ''
            });
        }
    } catch (e) {
        // ignore
    }
});

rl.on('close', () => {
    console.log(`Found ${matches.length} matches in transcript:`);
    matches.forEach((m) => {
      console.log(`\nStep ${m.index} | Type: ${m.type} | Description: ${m.description}`);
      if (m.tool_calls) {
        m.tool_calls.forEach(tc => {
          console.log(`  Tool: ${tc.name}`);
          if (tc.arguments) {
            console.log(`    Arguments: ${JSON.stringify(tc.arguments).substring(0, 500)}`);
          }
        });
      }
    });
});
