const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const OLD_SVG_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

const NEW_SVG_PATH = 'M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232';

files.forEach(file => {
  let html = fs.readFileSync(path.join(dir, file), 'utf-8');
  let originalHtml = html;

  // Since viewBox also needs to change from '0 0 24 24' to '0 0 16 16'
  // Let's use a regex to replace the entire <svg> containing that exact OLD_SVG_PATH
  // Or we can just replace the viewBox and path separately.
  
  if (html.includes(OLD_SVG_PATH)) {
      html = html.split('viewBox="0 0 24 24"').map((str, index, arr) => {
          if (index === arr.length - 1) return str;
          // check if next split string contains the old path
          if (arr[index + 1].includes(OLD_SVG_PATH)) {
              return str + 'viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"';
          }
          return str + 'viewBox="0 0 24 24"';
      }).join('');
      
      html = html.split(OLD_SVG_PATH).join(NEW_SVG_PATH);
  }
  
  // also look for SVG missing xmlns on WhatsApp floating button
  // it might already be 24 24 but let's just make sure all NEW_SVG_PATH are properly configured
  // wait, earlier I wrote `xmlns="http://www.w3.org/2000/svg"` in the viewBox string replace. Let's see if that duplicated it.
  html = html.replace(/xmlns="http:\/\/www.w3.org\/2000\/svg"\s*xmlns="http:\/\/www.w3.org\/2000\/svg"/g, 'xmlns="http://www.w3.org/2000/svg"');

  if (html !== originalHtml) {
    fs.writeFileSync(path.join(dir, file), html, 'utf-8');
    console.log('Fixed WhatsApp SVG in:', file);
  }
});
