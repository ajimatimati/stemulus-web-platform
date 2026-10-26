const fs = require('fs');

const pages = ['book-class.html', 'enroll.html', 'contact.html', 'index.html'];

pages.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  console.log('=== ' + f + ' ===');
  const forms = content.match(/<form[\s\S]*?>/gi) || [];
  console.log('Forms found (' + forms.length + '):');
  forms.forEach(frm => console.log('  ' + frm.replace(/\s+/g, ' ').slice(0, 150)));

  const scriptTags = content.match(/<script[\s\S]*?<\/script>/gi) || [];
  console.log('Script tags count: ' + scriptTags.length);
  const srcScripts = scriptTags.map(s => {
    const m = s.match(/src=["'](.*?)["']/i);
    return m ? m[1] : '[inline]';
  });
  console.log('Scripts:', srcScripts);
});
