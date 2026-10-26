const fs = require('fs');
const path = require('path');

const configJson = path.join(process.env.APPDATA, 'netlify', 'Config', 'config.json');
const content = JSON.parse(fs.readFileSync(configJson, 'utf8'));
const token = content.users[content.userId].auth.token;

async function testApi() {
  const userRes = await fetch('https://api.netlify.com/api/v1/user', {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log('User status:', userRes.status);
  if (!userRes.ok) {
    console.log('User error:', await userRes.text());
    return;
  }
  const userData = await userRes.json();
  console.log('Logged in as:', userData.email, userData.full_name);

  const sitesRes = await fetch('https://api.netlify.com/api/v1/sites', {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log('Sites status:', sitesRes.status);
  const sites = await sitesRes.json();
  console.log('Total sites:', sites.length);
  sites.forEach((s, idx) => {
    console.log((idx + 1) + '. Site: ' + s.name + ' (' + s.id + ') | URL: ' + s.url + ' | Custom: ' + (s.custom_domain || 'none') + ' | Repo: ' + (s.build_settings?.repo_url || 'none') + ' | Deploys: ' + (s.published_deploy?.id || 'none'));
  });

  const accountsRes = await fetch('https://api.netlify.com/api/v1/accounts', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const accounts = await accountsRes.json();
  console.log('Accounts/Teams:', JSON.stringify(accounts.map(a => ({ id: a.id, name: a.name, slug: a.slug, type: a.type_name, plan: a.plan, roles_allowed: a.roles_allowed })), null, 2));
}

testApi().catch(err => console.error('API Error:', err));
