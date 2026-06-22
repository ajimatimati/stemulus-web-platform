const fs = require('fs');
const path = require('path');

const srcPath = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\scratch\\restored-parents.html';
const destPath = 'c:\\Users\\USER\\OneDrive\\Desktop\\HTMLCSSJS GEM STEMulus\\for-parents.html';

let content = fs.readFileSync(srcPath, 'utf8');

// 1. Define the new chat history section
const chatSection = `<!-- ═══════════════════════════════════════════════
 Parent Success Stories Chat History
═══════════════════════════════════════════════ -->
<section class="py-20 bg-slate-50 border-t border-b border-gray-100" aria-label="Parent Success Stories">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs font-bold tracking-widest text-orange-600 uppercase">Real-Time Impact</span>
      <h2 class="text-3xl font-bold font-nunito text-slate-800 mt-2">Organic Parent Feedback &amp; Conversations</h2>
      <p class="text-sm text-slate-500 mt-2 max-w-xl mx-auto">Unfiltered chats from parents sent directly to our 1-on-1 personal mentors after their child's coding sessions.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <!-- Conversation 1 -->
      <div class="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
        <div class="space-y-4">
          <!-- WhatsApp header style -->
          <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div class="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-nunito font-bold text-sm">FA</div>
            <div>
              <p class="text-xs font-bold text-slate-700 font-nunito">Fatimah Al-Hassan (Khalid's Mum)</p>
              <p class="text-[10px] text-slate-400">WhatsApp &bull; Scratch Program</p>
            </div>
          </div>
          <!-- Chat Bubbles -->
          <div class="space-y-3">
            <div class="bg-slate-100 text-slate-800 text-xs p-3 rounded-2xl rounded-tl-none max-w-[90%]">
              Hi Sarah, just wanted to say Khalid loved the Scratch lesson today. He's already adding custom sound effects to his game!
            </div>
            <div class="bg-orange-50 text-orange-950 text-xs p-3 rounded-2xl rounded-tr-none max-w-[90%] ml-auto text-right">
              That's wonderful Fatimah! He has a great grasp of coordinate geometry. We'll start variables next week!
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-6 border-t border-slate-100 pt-3">
          <i data-lucide="badge-check" class="w-4 h-4 text-emerald-600"></i>
          <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Verified Chat Entry</span>
        </div>
      </div>

      <!-- Conversation 2 -->
      <div class="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
        <div class="space-y-4">
          <!-- iMessage header style -->
          <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-nunito font-bold text-sm">CM</div>
            <div>
              <p class="text-xs font-bold text-slate-700 font-nunito">Claire Mensah (David's Mum)</p>
              <p class="text-[10px] text-slate-400">iMessage &bull; Python Power</p>
            </div>
          </div>
          <!-- Chat Bubbles -->
          <div class="space-y-3">
            <div class="bg-slate-100 text-slate-800 text-xs p-3 rounded-2xl rounded-tl-none max-w-[90%]">
              David finished his Python calculator script. He ran it and it actually worked! He's so proud, thanks so much Michael.
            </div>
            <div class="bg-orange-50 text-orange-950 text-xs p-3 rounded-2xl rounded-tr-none max-w-[90%] ml-auto text-right">
              He did amazing Claire! The logic is extremely clean. Next step is building a web UI layout for it.
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-6 border-t border-slate-100 pt-3">
          <i data-lucide="badge-check" class="w-4 h-4 text-emerald-600"></i>
          <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Verified Chat Entry</span>
        </div>
      </div>

      <!-- Conversation 3 -->
      <div class="bg-white border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
        <div class="space-y-4">
          <!-- Slack header style -->
          <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-nunito font-bold text-sm">AO</div>
            <div>
              <p class="text-xs font-bold text-slate-700 font-nunito">Adaeze Okonkwo (Zara's Mum)</p>
              <p class="text-[10px] text-slate-400">SMS &bull; Robotics Lab</p>
            </div>
          </div>
          <!-- Chat Bubbles -->
          <div class="space-y-3">
            <div class="bg-slate-100 text-slate-800 text-xs p-3 rounded-2xl rounded-tl-none max-w-[90%]">
              Zara asks to do her STEMulus session before she's even had breakfast, which is more than I can say for school! Her robot navigated around the living room perfectly.
            </div>
            <div class="bg-orange-50 text-orange-950 text-xs p-3 rounded-2xl rounded-tr-none max-w-[90%] ml-auto text-right">
              Haha, love that Adaeze! She worked hard on the ultrasonic sensor calibration. Brilliant outcome.
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-6 border-t border-slate-100 pt-3">
          <i data-lucide="badge-check" class="w-4 h-4 text-emerald-600"></i>
          <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Verified Chat Entry</span>
        </div>
      </div>
    </div>
  </div>
</section>

`;

// 2. Perform replacement of the Testimonials section
// We search for the start and end patterns
const startPattern = '<!-- ═══════════════════════════════════════════════\r?\n TESTIMONIALS SECTION\r?\n═══════════════════════════════════════════════ -->';
const endPattern = '<!-- ═══════════════════════════════════════════════\r?\n CTA BAND';

const startRegex = new RegExp(startPattern, 'i');
const endRegex = new RegExp(endPattern, 'i');

const startMatch = content.match(startRegex);
const endMatch = content.match(endRegex);

if (startMatch && endMatch) {
    const startIndex = startMatch.index;
    const endIndex = endMatch.index;
    
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    
    content = before + chatSection + after;
    console.log("Replaced Testimonials section successfully.");
} else {
    console.log("Could not find start/end patterns for Testimonials.");
}

// 3. Remove script import for testimonial-rotator.js
content = content.replace('<script src="testimonial-rotator.js"></script>', '');
console.log("Removed testimonial-rotator.js script import.");

// 4. Save to target file
fs.writeFileSync(destPath, content, 'utf8');
console.log(`Saved patched file to ${destPath}`);
