const fs = require('fs');
const path = require('path');

// We can read image size from headers to avoid large dependencies
function getPngSize(buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function getJpgSize(buffer) {
  let i = 4;
  while (i < buffer.length) {
    const marker = buffer.readUInt16BE(i);
    i += 2;
    if (marker === 0xFFC0 || marker === 0xFFC2) {
      return {
        height: buffer.readUInt16BE(i + 3),
        width: buffer.readUInt16BE(i + 5)
      };
    }
    const size = buffer.readUInt16BE(i);
    i += size;
  }
  return null;
}

const dir = 'assets/images';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
    try {
      const buffer = fs.readFileSync(path.join(dir, file));
      let size = null;
      if (file.endsWith('.png')) {
        size = getPngSize(buffer);
      } else {
        size = getJpgSize(buffer);
      }
      if (size) {
        console.log(`${file}: ${size.width}x${size.height} (ratio: ${(size.width / size.height).toFixed(2)})`);
      } else {
        console.log(`${file}: unknown size`);
      }
    } catch (e) {
      console.log(`${file}: error ${e.message}`);
    }
  }
});
