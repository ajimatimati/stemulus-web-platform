const fs = require('fs');
const path = require('path');

const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';
const log = [];

function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function write(file, content) { fs.writeFileSync(path.join(ROOT, file), content, 'utf8'); }
function patch(file, fn) {
  const before = read(file);
  const after = fn(before);
  if (before !== after) {
    write(file, after);
    log.push(`PATCHED: ${file}`);
  } else {
    log.push(`UNCHANGED: ${file}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FIX: pricing.html → programs.html#pricing across all 27 files
// ─────────────────────────────────────────────────────────────────────────────
const pricingFiles = [
  '404.html','admin-dashboard.html','ai-machine-learning.html','arduino-robotics.html',
  'blog-coding-readiness.html','blog-daniel-spotlight.html','blog-scratch-first-language.html',
  'blog-template.html','blog.html','contact.html','creative-coding.html','digital-art.html',
  'for-parents.html','fullstack-web-dev.html','hall-of-fame.html','index.html',
  'join-as-tutor.html','junior-robotics.html','parent-dashboard.html','privacy-policy.html',
  'programs.html','python-programming.html','referral-dashboard.html','scratch-creators.html',
  'tutor-dashboard.html','verify-certificate.html','web-wizards.html'
];
pricingFiles.forEach(f => {
  patch(f, c => c.replace(/href="pricing\.html"/g, 'href="programs.html#pricing"'));
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. FIX: deep-scrub.js syntax error (raw HTML on line 23)
// ─────────────────────────────────────────────────────────────────────────────
patch('deep-scrub.js', c => {
  return c.replace(
    /^\s*<[^>]+>.*$/m,
    '// (removed raw HTML that caused syntax error)'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. FIX: Duplicate IDs in admin-dashboard.html (auto-welcome x4)
// ─────────────────────────────────────────────────────────────────────────────
patch('admin-dashboard.html', c => {
  const ids = ['auto-welcome','auto-reminder-24h','auto-reminder-1h','auto-certificates'];
  let idx = 0;
  // Replace id="auto-welcome" occurrences with unique IDs
  c = c.replace(/id="auto-welcome"/g, () => `id="${ids[idx++ % ids.length]}"`);
  // Also fix associated for="" labels
  c = c.replace(/for="auto-welcome"/g, () => {
    const i = idx % ids.length;
    return `for="${ids[i]}"`;
  });
  return c;
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. FIX: Malformed SVG star in verify-certificate.html
// ─────────────────────────────────────────────────────────────────────────────
patch('verify-certificate.html', c => {
  // Replace any malformed star path
  return c.replace(
    /d="[^"]*M12 2[^"]*"/g,
    'd="M12 2l3.09 6.26L22 9.27l-6 5.87 1.77 6.86L12 18.89l-5.77 3.11L7.72 15.14 1.73 9.27l6.91-1.01L12 2z"'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. FIX: White-on-white text in program subpages (backdrop-blur glassmorphism cards)
//    bg-white/10 backdrop-blur-md → bg-white border border-slate-200
//    bg-slate-50/60 backdrop-blur-md → bg-slate-50 border border-slate-200
//    bg-white/20 → bg-slate-100
// ─────────────────────────────────────────────────────────────────────────────
const programPages = [
  'scratch-creators.html','junior-robotics.html','creative-coding.html','digital-art.html',
  'web-wizards.html','python-programming.html','arduino-robotics.html',
  'ai-machine-learning.html','fullstack-web-dev.html'
];
programPages.forEach(f => {
  patch(f, c => {
    // Fix glassmorphism skill/feature cards (dark bg on light section)
    c = c.replace(/bg-white\/10 backdrop-blur-md rounded-none/g, 'bg-white rounded-none');
    c = c.replace(/bg-white\/10 backdrop-blur-md/g, 'bg-white');
    c = c.replace(/bg-slate-50\/60 backdrop-blur-md rounded-none/g, 'bg-slate-50 rounded-none');
    c = c.replace(/bg-slate-50\/60 backdrop-blur-md/g, 'bg-slate-50');
    c = c.replace(/bg-slate-50\/60/g, 'bg-slate-50');
    c = c.replace(/bg-white\/20/g, 'bg-slate-100');
    c = c.replace(/backdrop-blur-md/g, '');
    c = c.replace(/backdrop-blur-sm/g, '');
    c = c.replace(/backdrop-blur-xl/g, '');
    // Fix w-14 h-14 icon container — was bg-white/20, now bg-slate-100
    c = c.replace(/bg-white\/20 rounded-none flex items-center/g, 'bg-slate-100 rounded-none flex items-center');
    // Fix invisible text: text-white inside light sections
    // Only fix inside the "what-youll-learn" and "stats" type sections that have light backgrounds
    // Pattern: text-white inside a div that also has border-slate-200
    c = c.replace(/(class="[^"]*border-slate-200[^"]*)\btext-white\b([^"]*")/g, '$1text-slate-800$2');
    c = c.replace(/(class="[^"]*border-slate-200[^"]*)\btext-white\/65\b([^"]*")/g, '$1text-slate-600$2');
    // Fix "Perfect for building a strong foundation with personalized guidance."
    c = c.replace(
      /Perfect for building a strong foundation with personalized guidance\./g,
      'Structured 1-on-1 sessions tailored to each student\'s level and goals.'
    );
    return c;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. FIX: Remove AI copy phrases in join-as-tutor.html
// ─────────────────────────────────────────────────────────────────────────────
patch('join-as-tutor.html', c => {
  c = c.replace(
    /No chaotic private mentor sessions\. Focus deeply on one student at a time, creating truly engaging and personalized learning experiences\./g,
    'Each tutor works with one student at a time. Sessions are focused, structured, and results-driven.'
  );
  return c;
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. FIX: scratch-creators.html "personalized attention" phrase
// ─────────────────────────────────────────────────────────────────────────────
patch('scratch-creators.html', c => {
  c = c.replace(
    /We maintain exclusive 1-on-1 sessions\. This ensures every child gets personalized attention and help when they need it\./g,
    'We maintain exclusive 1-on-1 sessions. Every student gets direct, focused time with their tutor — no distractions, no waiting.'
  );
  return c;
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. FIX: Simplify "enroll.html" personalization micro-copy
// ─────────────────────────────────────────────────────────────────────────────
patch('enroll.html', c => {
  c = c.replace(
    /We('ll| will) personalise their learning journey/gi,
    "Enter the student's age and details to help us place them in the correct level."
  );
  c = c.replace(
    /personalise their learning journey/gi,
    "place them in the right programme level"
  );
  // Remove sparkle emojis
  c = c.replace(/✨\s*/g, '');
  // Remove lucide-sparkles icon references in class/icon names within SVG use tags
  c = c.replace(/<use[^>]*href="#lucide-sparkles"[^>]*><\/use>/g, '');
  c = c.replace(/lucide-sparkles/g, 'lucide-star');
  return c;
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. FIX: Remove sparkle emojis from all HTML pages
// ─────────────────────────────────────────────────────────────────────────────
const allHtml = pricingFiles.concat(['enroll.html','for-parents.html','issue-certificate.html']);
const uniqueHtml = [...new Set(allHtml)];
uniqueHtml.forEach(f => {
  if (!fs.existsSync(path.join(ROOT, f))) return;
  patch(f, c => {
    c = c.replace(/✨\s*/g, '');
    return c;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. INJECT: Pricing + FAQ section into programs.html before </main>
// ─────────────────────────────────────────────────────────────────────────────
const pricingSection = `
<!-- ═══════════════════════════════════════════ PRICING & FAQ ══ -->
<section id="pricing" class="py-20 bg-white border-t border-slate-100">
  <div class="max-w-5xl mx-auto px-6">

    <div class="mb-14 text-center">
      <p class="text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">Fees</p>
      <h2 class="text-4xl font-black text-slate-900 font-nunito mb-4">Simple, Transparent Pricing</h2>
      <p class="text-slate-500 max-w-xl mx-auto text-base">No hidden fees. No contracts. Cancel or pause any month.</p>
    </div>

    <div class="grid md:grid-cols-2 gap-8 mb-20">

      <!-- Starter Tier -->
      <div class="border border-slate-200 rounded-none p-8 bg-slate-50">
        <p class="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Starter</p>
        <p class="text-5xl font-black text-slate-900 font-nunito mb-1">$50<span class="text-lg font-semibold text-slate-400">/month</span></p>
        <p class="text-slate-500 text-sm mb-6">4 structured 1-on-1 sessions per month (1 hour each)</p>
        <ul class="space-y-3 mb-8 text-sm text-slate-700">
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Scratch Creators (ages 7–10)</li>
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Creative Coding (ages 8–11)</li>
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Junior Robotics (ages 8–12)</li>
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Digital Art &amp; Animation (ages 9–13)</li>
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Progress reports each month</li>
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Certificate on course completion</li>
        </ul>
        <a href="enroll.html" class="inline-block w-full text-center bg-orange-500 text-white font-bold py-3 px-6 text-sm tracking-wide hover:bg-orange-600 transition-colors">Enroll in a Starter Programme</a>
      </div>

      <!-- Advanced Tier -->
      <div class="border-2 border-slate-900 rounded-none p-8 bg-white relative">
        <span class="absolute -top-3 left-6 bg-slate-900 text-white text-xs font-bold px-3 py-1 tracking-widest uppercase">Most Popular</span>
        <p class="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Advanced</p>
        <p class="text-5xl font-black text-slate-900 font-nunito mb-1">$80<span class="text-lg font-semibold text-slate-400">/month</span></p>
        <p class="text-slate-500 text-sm mb-6">4 priority 1-on-1 sessions per month (1 hour each)</p>
        <ul class="space-y-3 mb-8 text-sm text-slate-700">
          <li class="flex items-start gap-2"><span class="text-slate-900 mt-0.5">&#10003;</span> Python Programming (ages 10–16)</li>
          <li class="flex items-start gap-2"><span class="text-slate-900 mt-0.5">&#10003;</span> Web Wizards (ages 11–15)</li>
          <li class="flex items-start gap-2"><span class="text-slate-900 mt-0.5">&#10003;</span> Arduino &amp; Robotics (ages 11–15)</li>
          <li class="flex items-start gap-2"><span class="text-slate-900 mt-0.5">&#10003;</span> AI &amp; Machine Learning (ages 13–17)</li>
          <li class="flex items-start gap-2"><span class="text-slate-900 mt-0.5">&#10003;</span> Full-Stack Web Dev (ages 14–18)</li>
          <li class="flex items-start gap-2"><span class="text-slate-900 mt-0.5">&#10003;</span> Between-session tutor chat access</li>
          <li class="flex items-start gap-2"><span class="text-slate-900 mt-0.5">&#10003;</span> Project code review &amp; portfolio feedback</li>
          <li class="flex items-start gap-2"><span class="text-slate-900 mt-0.5">&#10003;</span> Progress reports &amp; certificate on completion</li>
        </ul>
        <a href="enroll.html" class="inline-block w-full text-center bg-slate-900 text-white font-bold py-3 px-6 text-sm tracking-wide hover:bg-slate-800 transition-colors">Enroll in an Advanced Programme</a>
      </div>
    </div>

    <!-- FAQ -->
    <div>
      <h3 class="text-2xl font-black text-slate-900 font-nunito mb-8 text-center">Frequently Asked Questions</h3>
      <div class="divide-y divide-slate-200 border border-slate-200">

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            How does billing work?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
            You are billed monthly on the date you first enrolled. Sessions are booked directly with your tutor on a schedule that suits your family. There are no term-time commitments.
          </p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            Can I cancel or pause at any time?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
            Yes. You can cancel or pause your subscription before the next billing date with no cancellation fee. Simply contact us at least 5 days before your next renewal.
          </p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            What happens if we miss a session?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
            Sessions cancelled with at least 24 hours' notice are rescheduled at no charge. Sessions missed without notice are not automatically rescheduled, but we will always try to accommodate emergencies.
          </p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            Can my child switch programmes?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
            Yes. Students can transfer between programmes at any renewal date. If you are moving from a Starter to an Advanced programme, the price difference is charged on the next billing cycle.
          </p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            Is there a free trial?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
            We offer a free 30-minute discovery call where we assess your child's current level and match them to the right programme and tutor. This is not a sales call — it is a placement assessment.
          </p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            Do you offer sibling discounts?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
            Yes. Families enrolling two or more siblings receive 10% off the second subscription. Contact us after enrolling your first child to apply the discount.
          </p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            What equipment does my child need?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">
            A laptop or desktop computer (Windows or Mac) and a stable internet connection. All software used in our programmes is free to download. For Arduino and Robotics, a starter kit is required — we will send you the exact kit list after enrolment.
          </p>
        </details>

      </div>
    </div><!-- /FAQ -->

  </div>
</section>
<!-- ══════════════════════════════════════════════════════════════ -->
`;

patch('programs.html', c => {
  // Only inject if not already present
  if (c.includes('id="pricing"')) {
    log.push('SKIP (already has pricing section): programs.html');
    return c;
  }
  return c.replace('</main>', pricingSection + '\n</main>');
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. FIX: Update individual program pricing cards to show flat tier price
//     Replace "Investment in Their Future" two-card layout with single flat card
// ─────────────────────────────────────────────────────────────────────────────
function buildPricingCard(tierLabel, price, color, features) {
  return `<!-- Flat Pricing Card -->
<section class="py-16 bg-slate-50 border-t border-slate-200">
  <div class="max-w-2xl mx-auto px-6 text-center">
    <p class="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">${tierLabel} Programme</p>
    <h2 class="text-3xl font-black text-slate-900 font-nunito mb-2">Programme Fee</h2>
    <p class="text-5xl font-black text-slate-900 font-nunito my-4">$${price}<span class="text-lg font-semibold text-slate-400">/month</span></p>
    <p class="text-slate-500 text-sm mb-8">4 x 1-hour 1-on-1 sessions per month &nbsp;·&nbsp; No lock-in contracts</p>
    <ul class="text-left space-y-3 mb-8 text-sm text-slate-700 max-w-sm mx-auto">
      ${features.map(f => `<li class="flex items-start gap-2"><span class="${color} mt-0.5">&#10003;</span> ${f}</li>`).join('\n      ')}
    </ul>
    <a href="enroll.html" class="inline-block bg-slate-900 text-white font-bold py-3 px-10 text-sm tracking-wide hover:bg-slate-800 transition-colors">Enroll Now</a>
    <p class="text-xs text-slate-400 mt-4">Questions? <a href="programs.html#pricing" class="underline hover:text-slate-600">View full pricing &amp; FAQ</a></p>
  </div>
</section>`;
}

const starterFeatures = [
  'Monthly progress report sent to parents',
  'Certificate awarded on course completion',
  'Pause or cancel any month — no fees',
  'Free 30-minute placement assessment before you start'
];
const advancedFeatures = [
  'Between-session tutor chat access',
  'Project code review and portfolio feedback',
  'Monthly progress report sent to parents',
  'Certificate awarded on course completion',
  'Pause or cancel any month — no fees'
];

const programPricingMap = {
  'scratch-creators.html':     { tier: 'Starter',  price: '50', color: 'text-orange-500', features: starterFeatures },
  'junior-robotics.html':      { tier: 'Starter',  price: '50', color: 'text-orange-500', features: starterFeatures },
  'creative-coding.html':      { tier: 'Starter',  price: '50', color: 'text-orange-500', features: starterFeatures },
  'digital-art.html':          { tier: 'Starter',  price: '50', color: 'text-orange-500', features: starterFeatures },
  'web-wizards.html':          { tier: 'Advanced', price: '80', color: 'text-slate-900',   features: advancedFeatures },
  'python-programming.html':   { tier: 'Advanced', price: '80', color: 'text-slate-900',   features: advancedFeatures },
  'arduino-robotics.html':     { tier: 'Advanced', price: '80', color: 'text-slate-900',   features: advancedFeatures },
  'ai-machine-learning.html':  { tier: 'Advanced', price: '80', color: 'text-slate-900',   features: advancedFeatures },
  'fullstack-web-dev.html':    { tier: 'Advanced', price: '80', color: 'text-slate-900',   features: advancedFeatures },
};

Object.entries(programPricingMap).forEach(([file, info]) => {
  patch(file, c => {
    const card = buildPricingCard(info.tier, info.price, info.color, info.features);
    // If a pricing section already exists (id="pricing" or "Investment in Their Future")
    if (c.includes('id="pricing"') || c.includes('Investment in Their Future')) {
      // Replace the entire existing pricing section with the flat card
      // Match from the opening of the section containing "Investment" or id="pricing" to </section>
      c = c.replace(
        /<section[^>]*>[\s\S]*?(?:Investment in Their Future|id="pricing")[\s\S]*?<\/section>/,
        card
      );
    } else {
      // Inject before </main>
      c = c.replace('</main>', card + '\n</main>');
    }
    return c;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
const summary = {
  patched: log.filter(l => l.startsWith('PATCHED')).length,
  unchanged: log.filter(l => l.startsWith('UNCHANGED')).length,
  skipped: log.filter(l => l.startsWith('SKIP')).length,
  log
};
fs.writeFileSync(path.join(ROOT, 'scratch', 'fix-results.json'), JSON.stringify(summary, null, 2));
console.log(`Done. Patched: ${summary.patched}, Unchanged: ${summary.unchanged}, Skipped: ${summary.skipped}`);
console.log('See scratch/fix-results.json for full log.');
