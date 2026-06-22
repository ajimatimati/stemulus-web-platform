const fs = require('fs');
const path = require('path');
const ROOT = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus';

function read(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }
function write(f, c) { fs.writeFileSync(path.join(ROOT, f), c, 'utf8'); }
function patch(f, fn) {
  const before = read(f);
  const after = fn(before);
  if (before !== after) { write(f, after); return 'PATCHED'; }
  return 'UNCHANGED';
}

// ─── STEP 1: Find programs.html closing structure ───────────────────────────
const pr = read('programs.html');
const prLines = pr.split('\n');
const footerLine = prLines.findIndex(l => l.includes('<footer'));
const closingBodyLine = prLines.findIndex(l => l.includes('</body>'));

console.log('programs.html <footer> at line:', footerLine + 1);
console.log('programs.html </body> at line:', closingBodyLine + 1);
console.log('programs.html has id=pricing:', pr.includes('id="pricing"'));
console.log('programs.html total lines:', prLines.length);

// Show 10 lines before footer
if (footerLine > 0) {
  console.log('\n--- Lines before footer ---');
  prLines.slice(Math.max(0, footerLine - 10), footerLine + 2).forEach((l, i) => {
    console.log(footerLine - 10 + i + 1, ':', l);
  });
}

// ─── STEP 2: Check pricing link format in unchanged files ────────────────────
const unchangedFiles = [
  '404.html', 'admin-dashboard.html', 'blog-coding-readiness.html',
  'blog-daniel-spotlight.html', 'blog.html', 'contact.html',
  'for-parents.html', 'hall-of-fame.html', 'index.html',
  'join-as-tutor.html', 'parent-dashboard.html', 'privacy-policy.html',
  'referral-dashboard.html', 'tutor-dashboard.html'
];

console.log('\n--- Pricing link check in unchanged files ---');
unchangedFiles.forEach(f => {
  const c = read(f);
  const hasOld = c.includes('href="pricing.html"');
  const hasNew = c.includes('href="programs.html#pricing"');
  if (hasOld || hasNew) {
    console.log(f, '| old:', hasOld, '| new:', hasNew);
  }
});

// ─── STEP 3: Fix pricing links in ALL files that still have old link ─────────
const allHtml = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
let fixedPricing = 0;
allHtml.forEach(f => {
  const r = patch(f, c => c.replace(/href="pricing\.html"/g, 'href="programs.html#pricing"'));
  if (r === 'PATCHED') { fixedPricing++; console.log('Fixed pricing link in:', f); }
});
console.log('\nTotal files with pricing link fixed:', fixedPricing);

// ─── STEP 4: Inject Pricing + FAQ into programs.html before <footer ──────────
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
      <div class="border border-slate-200 p-8 bg-slate-50">
        <p class="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Starter</p>
        <p class="text-5xl font-black text-slate-900 font-nunito mb-1">$50<span class="text-lg font-semibold text-slate-400">/month</span></p>
        <p class="text-slate-500 text-sm mb-6">4 structured 1-on-1 sessions per month (1 hour each)</p>
        <ul class="space-y-3 mb-8 text-sm text-slate-700">
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Scratch Creators (ages 7–10)</li>
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Creative Coding (ages 8–11)</li>
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Junior Robotics (ages 8–12)</li>
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Digital Art &amp; Animation (ages 9–13)</li>
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Monthly progress reports for parents</li>
          <li class="flex items-start gap-2"><span class="text-orange-500 mt-0.5">&#10003;</span> Certificate on course completion</li>
        </ul>
        <a href="enroll.html" class="block text-center bg-orange-500 text-white font-bold py-3 px-6 text-sm tracking-wide hover:bg-orange-600 transition-colors">Enroll in a Starter Programme</a>
      </div>

      <!-- Advanced Tier -->
      <div class="border-2 border-slate-900 p-8 bg-white relative">
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
          <li class="flex items-start gap-2"><span class="text-slate-900 mt-0.5">&#10003;</span> Monthly progress reports &amp; certificate</li>
        </ul>
        <a href="enroll.html" class="block text-center bg-slate-900 text-white font-bold py-3 px-6 text-sm tracking-wide hover:bg-slate-800 transition-colors">Enroll in an Advanced Programme</a>
      </div>
    </div>

    <!-- FAQ -->
    <div>
      <h3 class="text-2xl font-black text-slate-900 font-nunito mb-8 text-center">Frequently Asked Questions</h3>
      <div class="divide-y divide-slate-200 border border-slate-200">

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            How does billing work?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light select-none">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">You are billed monthly on the date you first enrolled. Sessions are booked directly with your tutor on a schedule that suits your family. There are no term-time commitments.</p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            Can I cancel or pause at any time?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light select-none">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">Yes. You can cancel or pause your subscription before the next billing date with no cancellation fee. Simply contact us at least 5 days before your next renewal.</p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            What happens if we miss a session?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light select-none">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">Sessions cancelled with at least 24 hours notice are rescheduled at no charge. Sessions missed without notice are not automatically rescheduled, but we will always try to accommodate genuine emergencies.</p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            Can my child switch programmes?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light select-none">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">Yes. Students can transfer between programmes at any renewal date. If moving from Starter to Advanced, the price difference is charged on the next billing cycle.</p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            Is there a free trial or assessment?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light select-none">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">We offer a free 30-minute discovery call to assess your child's current level and match them to the right programme and tutor. This is a placement assessment — not a sales call.</p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            Do you offer sibling discounts?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light select-none">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">Yes. Families enrolling two or more siblings receive 10% off the second subscription. Contact us after enrolling your first child to apply the discount.</p>
        </details>

        <details class="group">
          <summary class="flex justify-between items-center cursor-pointer px-6 py-5 text-slate-800 font-semibold hover:bg-slate-50 transition-colors list-none">
            What equipment does my child need?
            <span class="text-slate-400 group-open:rotate-45 transition-transform text-xl font-light select-none">+</span>
          </summary>
          <p class="px-6 pb-5 text-slate-600 text-sm leading-relaxed">A laptop or desktop computer (Windows or Mac) and a stable internet connection. All software used in our programmes is free. For Arduino and Robotics, a starter kit is required — we will send the exact kit list after enrolment.</p>
        </details>

      </div>
    </div>

  </div>
</section>
<!-- ══════════════════════════════════════════════════════════════ -->
`;

const r = patch('programs.html', c => {
  if (c.includes('id="pricing"')) return c; // already injected
  // Inject before <footer
  if (c.includes('<footer')) {
    return c.replace('<footer', pricingSection + '\n<footer');
  }
  // Fallback: inject before </body>
  return c.replace('</body>', pricingSection + '\n</body>');
});
console.log('\nprograms.html pricing injection:', r);

// ─── STEP 5: Verify SVG star fix in verify-certificate.html ─────────────────
const vc = read('verify-certificate.html');
const starLines = vc.split('\n').filter(l => l.includes('M12 2'));
console.log('\nverify-certificate.html star path lines:', starLines.map(l => l.trim().substring(0, 150)));

// ─── STEP 6: Final count of remaining pricing.html links ────────────────────
let remaining = 0;
allHtml.forEach(f => {
  const c = read(f);
  if (c.includes('href="pricing.html"')) { remaining++; console.log('Still has old link:', f); }
});
console.log('\nFiles with remaining old pricing links:', remaining);

console.log('\nAll done.');
