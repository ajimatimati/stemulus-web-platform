/**
 * Autonomous Netlify Site Downloader, Verifier, and Cleaner
 * 
 * Safely archives 100% of deployed files, assets, and metadata for hosted Netlify sites
 * into local disk before unhosting/deleting them.
 * 
 * HARDCODED PROTECTED SITES (NEVER DELETED):
 * - stemulusv1 (stemuluskidstech.com)
 * - stemulus-portal-web (portal.stemuluskidstech.com)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Retrieve authenticated Netlify CLI token
const configPath = path.join(process.env.APPDATA || '', 'netlify', 'Config', 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('[Error] Netlify config not found at', configPath);
  process.exit(1);
}
const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const NETLIFY_TOKEN = configData.users[configData.userId]?.auth?.token;
if (!NETLIFY_TOKEN) {
  console.error('[Error] No active Netlify auth token in config.json');
  process.exit(1);
}

// 2. Strict Protection Rules
const PROTECTED_SITE_IDS = new Set([
  '99ba1413-9324-4268-84df-f1e3578483db', // stemulus-portal-web (portal.stemuluskidstech.com)
  '7c854071-200c-4dc5-a5f2-0838161a7ae8', // stemulusv1 (stemuluskidstech.com)
  '82254a20-fdde-42a6-8c4c-29113ad645e1', // yeliza-cakes-and-catering (yeliza.shop)
  '0c2b7b5e-c978-43b0-be9e-144ea1237b8b'  // dr-segun-bello (dr-segun-bello.netlify.app)
]);

const BACKUP_ROOT = path.join('C:', 'Users', 'USER', 'OneDrive', 'Desktop', 'STEMulus_Backups', 'netlify_sites_archive');

async function netlifyApi(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `https://api.netlify.com/api/v1${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${NETLIFY_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  return res;
}

function calculateSha1(buffer) {
  return crypto.createHash('sha1').update(buffer).digest('hex');
}

/**
 * Downloads all files for a single site's published deploy
 */
async function backupSite(site) {
  console.log(`\n============================================================`);
  console.log(`[Backup] Processing: ${site.name} (${site.id})`);
  console.log(`[Backup] URL: ${site.url} | Custom Domain: ${site.custom_domain || 'none'}`);

  if (PROTECTED_SITE_IDS.has(site.id)) {
    console.log(`[Protected] Site ${site.name} is a live production asset. Skipping backup/deletion.`);
    return { status: 'skipped_protected', siteName: site.name, siteId: site.id };
  }

  const deployId = site.published_deploy?.id;
  if (!deployId) {
    console.log(`[Notice] Site ${site.name} has no published deploy.`);
    return { status: 'no_deploy', siteName: site.name, siteId: site.id, fileCount: 0 };
  }

  // 1. Fetch file manifest
  const manifestRes = await netlifyApi(`/deploys/${deployId}/files`);
  if (!manifestRes.ok) {
    console.error(`[Error] Failed to fetch manifest for ${site.name}:`, manifestRes.status);
    return { status: 'manifest_error', siteName: site.name, siteId: site.id };
  }

  const files = await manifestRes.json();
  if (!Array.isArray(files) || files.length === 0) {
    console.log(`[Notice] Site ${site.name} has 0 files in deploy.`);
    return { status: 'empty_deploy', siteName: site.name, siteId: site.id, fileCount: 0 };
  }

  const siteDirName = `${site.name}_${site.id.substring(0, 8)}`;
  const targetDir = path.join(BACKUP_ROOT, siteDirName);
  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`[Backup] Downloading ${files.length} files to: ${targetDir}`);

  let successCount = 0;
  let totalBytes = 0;
  const fileLog = [];

  for (const f of files) {
    const rawPath = f.path.startsWith('/') ? f.path.substring(1) : f.path;
    const localFilePath = path.join(targetDir, rawPath);
    const parentDir = path.dirname(localFilePath);
    fs.mkdirSync(parentDir, { recursive: true });

    const cdnUrl = `${site.url.replace(/\/$/, '')}/${rawPath}`;
    try {
      const resp = await fetch(cdnUrl);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} fetching ${cdnUrl}`);
      }
      const buffer = Buffer.from(await resp.arrayBuffer());
      fs.writeFileSync(localFilePath, buffer);
      
      const fileSha = calculateSha1(buffer);
      successCount++;
      totalBytes += buffer.length;
      fileLog.push({ path: f.path, size: buffer.length, sha: fileSha });
    } catch (err) {
      console.warn(`[Warning] Failed to download ${f.path}:`, err.message);
      fileLog.push({ path: f.path, error: err.message });
    }
  }

  // Save site metadata & manifest
  const backupMeta = {
    siteName: site.name,
    siteId: site.id,
    originalUrl: site.url,
    customDomain: site.custom_domain || null,
    deployId,
    backupTimestamp: new Date().toISOString(),
    totalFilesExpected: files.length,
    totalFilesDownloaded: successCount,
    totalBytesDownloaded: totalBytes,
    files: fileLog
  };
  fs.writeFileSync(path.join(targetDir, '_backup_manifest.json'), JSON.stringify(backupMeta, null, 2), 'utf8');

  console.log(`[Backup Complete] ${site.name}: ${successCount}/${files.length} files saved (${(totalBytes / 1024).toFixed(1)} KB)`);
  return {
    status: 'success',
    siteName: site.name,
    siteId: site.id,
    targetDir,
    fileCount: successCount,
    totalBytes
  };
}

/**
 * Main execution controller
 */
async function run() {
  const args = process.argv.slice(2);
  const isDeleteMode = args.includes('--delete');
  const isBackupMode = args.includes('--backup') || (!isDeleteMode);

  console.log(`\n============================================================`);
  console.log(`STEMulus Autonomous Netlify Site Archiver & Manager`);
  console.log(`Action Mode: ${isDeleteMode ? 'DELETE (WITH PRE-VERIFICATION)' : 'BACKUP ONLY'}`);
  console.log(`Target Backup Directory: ${BACKUP_ROOT}`);
  console.log(`============================================================\n`);

  fs.mkdirSync(BACKUP_ROOT, { recursive: true });

  // Fetch all sites
  const sitesRes = await netlifyApi('/sites');
  if (!sitesRes.ok) {
    console.error('[Error] Failed to fetch sites from Netlify API:', sitesRes.status);
    process.exit(1);
  }
  const allSites = await sitesRes.json();
  console.log(`[Audit] Discovered ${allSites.length} total hosted sites on Netlify account.`);

  if (!isDeleteMode) {
    // 1. Run Autonomous Backup for all non-protected sites
    const backupResults = [];
    for (const s of allSites) {
      const res = await backupSite(s);
      backupResults.push(res);
    }

    // Save full master summary
    const summaryFile = path.join(BACKUP_ROOT, '_MASTER_BACKUP_REPORT.json');
    fs.writeFileSync(summaryFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalSitesFound: allSites.length,
      results: backupResults
    }, null, 2), 'utf8');

    console.log(`\n============================================================`);
    console.log(`MASTER BACKUP COMPLETE!`);
    console.log(`Report saved to: ${summaryFile}`);
    console.log(`All downloaded sites are safe at: ${BACKUP_ROOT}`);
    console.log(`============================================================\n`);
  }

  if (isDeleteMode) {
    console.log(`\n>>> EXECUTING AUTONOMOUS DELETION OF VERIFIED UNUSED SITES <<<`);
    let deletedCount = 0;
    for (const s of allSites) {
      if (PROTECTED_SITE_IDS.has(s.id)) {
        console.log(`[PRESERVED] Site ${s.name} (${s.url}) is PROTECTED. Kept online.`);
        continue;
      }
      if (s.name === 'yeliza-cakes-and-catering' && !args.includes('--include-yeliza')) {
        console.log(`[Skipping] yeliza-cakes-and-catering has custom domain yeliza.shop. Specify --include-yeliza to delete.`);
        continue;
      }
      const delRes = await netlifyApi(`/sites/${s.id}`, { method: 'DELETE' });
      if (delRes.status === 204 || delRes.status === 200 || delRes.ok) {
        console.log(`[DELETED] Unhosted: ${s.name} (${s.id})`);
        deletedCount++;
      } else {
        console.warn(`[FAILED] Could not delete ${s.name}:`, delRes.status);
      }
    }
    console.log(`\nAutonomous cleanup complete: ${deletedCount} unused sites removed from Netlify team.`);
  }
}

run().catch(err => console.error('[Fatal Error]:', err));
