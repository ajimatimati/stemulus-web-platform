#!/usr/bin/env node

/**
 * STEMulus Netlify Selective Build Ignorer
 *
 * Prevents unnecessary builds:
 * - If running on the Marketing site (stemuluskidstech.com), skips build if only portal files changed.
 *   This preserves SEO, Google rankings, edge cache, and saves Netlify build credits!
 * - If running on the Portal site (portal.stemuluskidstech.com), skips build if no portal files changed.
 *
 * Exit code 0 = IGNORE (Skip build, consumes 0 build minutes)
 * Exit code 1 = PROCEED (Run build)
 */

const { execSync } = require('child_process');

function getChangedFiles() {
  const cachedRef = process.env.CACHED_COMMIT_REF;
  const commitRef = process.env.COMMIT_REF || 'HEAD';

  try {
    let diffCmd;
    if (cachedRef && cachedRef !== commitRef) {
      diffCmd = `git diff --name-only ${cachedRef} ${commitRef}`;
    } else {
      // Fallback for first build or local check: diff against parent commit
      diffCmd = `git diff --name-only HEAD~1 HEAD`;
    }
    const output = execSync(diffCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return output.split('\n').map(f => f.trim()).filter(Boolean);
  } catch (err) {
    // If diff fails (e.g. initial clone or shallow fetch), safely proceed with build
    console.log('[STEMulus Build Check] Warning: Git diff failed, proceeding with build.');
    return null;
  }
}

function run() {
  const siteRole = (process.env.STEMULUS_SITE_ROLE || '').toLowerCase().trim();
  const siteName = (process.env.SITE_NAME || '').toLowerCase();

  // If no role or site indicator is set, safely proceed to prevent blocking until user configures the env var
  if (!siteRole && !siteName.includes('portal') && !siteName.includes('marketing')) {
    console.log('[STEMulus Build Filter] Notice: STEMULUS_SITE_ROLE is not set. Proceeding with standard build.');
    process.exit(1);
  }

  const isPortalSite = siteRole === 'portal' || siteName.includes('portal');
  const isMarketingSite = !isPortalSite;

  console.log(`[STEMulus Build Filter] Site Role detected: ${isPortalSite ? 'PORTAL' : 'MARKETING'}`);

  const changedFiles = getChangedFiles();
  if (!changedFiles || changedFiles.length === 0) {
    // No diff info, proceed
    console.log('[STEMulus Build Filter] No diff info found, proceeding with build.');
    process.exit(1);
  }

  console.log(`[STEMulus Build Filter] Changed files in this commit (${changedFiles.length}):`);
  changedFiles.forEach(f => console.log(`  - ${f}`));

  // Check commit message for manual override flags:
  // e.g. [deploy-all], [skip-build], [force-build]
  try {
    const commitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).toLowerCase();
    if (commitMsg.includes('[deploy-all]') || commitMsg.includes('[force-build]')) {
      console.log('[STEMulus Build Filter] Override keyword detected in commit message. Proceeding with build.');
      process.exit(1);
    }
    if (commitMsg.includes('[skip-all]') || commitMsg.includes('[skip-build]')) {
      console.log('[STEMulus Build Filter] Skip keyword detected in commit message. Ignoring build.');
      process.exit(0);
    }
  } catch (e) {}

  // Classification logic:
  // 1. Shared Infrastructure files (trigger both):
  const isSharedInfrastructure = (file) => {
    return (
      file === 'package.json' ||
      file === 'netlify.toml' ||
      file === 'src/tailwind-input.css' ||
      file.startsWith('tools/')
    );
  };

  // 2. Portal-related files:
  const isPortalFile = (file) => {
    return (
      file.includes('dashboard') ||
      file.includes('attendance') ||
      file.includes('tutor-') ||
      file.includes('parent-') ||
      file.includes('issue-certificate') ||
      file.includes('verify-certificate') ||
      file.includes('referral-dashboard') ||
      file.includes('admin-') ||
      file.includes('portal-') ||
      file.includes('engine') || // dashboard-engine, admin-engine, parent-engine, tutor-engine
      file.startsWith('netlify/functions/')
    );
  };

  // 3. Marketing-only files:
  const isMarketingFile = (file) => {
    return (
      file === 'index.html' ||
      file.startsWith('blog') ||
      file === 'programs.html' ||
      file === 'enroll.html' ||
      file === 'contact.html' ||
      file === 'about.html' ||
      file === 'for-parents.html' ||
      file === 'join-as-tutor.html' ||
      file === 'book-class.html' ||
      file === 'python-programming.html' ||
      file === 'scratch-creators.html' ||
      file === 'web-wizards.html' ||
      file === 'junior-robotics.html' ||
      file === 'arduino-robotics.html' ||
      file === 'fullstack-web-dev.html' ||
      file === 'ai-machine-learning.html' ||
      file === 'digital-art.html' ||
      file === 'creative-coding.html' ||
      file === 'sitemap.xml' ||
      file === 'robots.txt' ||
      file.startsWith('assets/images/') ||
      file.startsWith('assets/css/')
    );
  };

  const hasSharedChange = changedFiles.some(isSharedInfrastructure);
  if (hasSharedChange) {
    console.log('[STEMulus Build Filter] Shared infrastructure files changed. Proceeding with build.');
    process.exit(1);
  }

  const hasPortalChange = changedFiles.some(isPortalFile);
  const hasMarketingChange = changedFiles.some(isMarketingFile);

  if (isMarketingSite) {
    // If on Marketing Site, only build if marketing files changed
    if (hasMarketingChange) {
      console.log('[STEMulus Build Filter] Marketing files modified. Proceeding with Marketing Site deployment.');
      process.exit(1);
    } else {
      console.log('[STEMulus Build Filter] Only portal files modified. SKIPPING Marketing Site deployment to preserve SEO, CDN cache, and build credits.');
      process.exit(0);
    }
  } else {
    // If on Portal Site, only build if portal files changed
    if (hasPortalChange) {
      console.log('[STEMulus Build Filter] Portal files modified. Proceeding with Portal Site deployment.');
      process.exit(1);
    } else {
      console.log('[STEMulus Build Filter] No portal files modified. SKIPPING Portal Site deployment to save build credits.');
      process.exit(0);
    }
  }
}

run();
