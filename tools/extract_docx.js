const fs = require('fs');
const { execSync } = require('child_process');

// Use python to extract to a utf-8 text file
const pyScript = `
import zipfile, xml.etree.ElementTree as ET

docx_path = r'c:\\Users\\USER\\.gemini\\antigravity\\scratch\\STEMulus_Curated_Scratch_Learning_Pathway.docx'
with zipfile.ZipFile(docx_path) as z:
    xml_content = z.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    text = []
    for elem in tree.iter():
        if elem.tag.endswith('t'):
            if elem.text:
                text.append(elem.text)
        elif elem.tag.endswith('p'):
            text.append('\\n')
    full_text = ''.join(text)
    with open('data/scratch_learning_pathway.txt', 'w', encoding='utf-8') as f:
        f.write(full_text)
print('SUCCESS, length:', len(full_text))
`;

fs.writeFileSync('tools/temp_extract.py', pyScript, 'utf8');
const out = execSync('python tools/temp_extract.py').toString();
console.log(out);
fs.unlinkSync('tools/temp_extract.py');
