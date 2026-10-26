// Node.js Automated Headless DOM Simulation for STEMulus slide_engine.js
const fs = require('fs');
const path = require('path');

console.log("================================================================================");
console.log("STEMULUS RUNTIME SIMULATOR: Headless JS Engine Verification");
console.log("================================================================================");

// Read slide_engine.js
const jsCode = fs.readFileSync(path.join(__dirname, 'assets', 'slide_engine.js'), 'utf-8');

// Mock browser environment
const mockDocument = {
  elements: {},
  body: {
    classList: {
      add: (c) => {},
      remove: (c) => {}
    },
    appendChild: (elem) => {}
  },
  createElement: (tag) => {
    return {
      tagName: tag.toUpperCase(),
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => true,
        contains: () => false
      },
      style: {},
      setAttribute: () => {},
      getAttribute: () => null,
      addEventListener: () => {},
      remove: () => {}
    };
  },
  querySelectorAll: (selector) => {
    if (selector === '.slide') {
      return [
        { classList: { add: () => {}, remove: () => {} }, getAttribute: () => 'Note 1' },
        { classList: { add: () => {}, remove: () => {} }, getAttribute: () => 'Note 2' },
        { classList: { add: () => {}, remove: () => {} }, getAttribute: () => 'Note 3' },
        { classList: { add: () => {}, remove: () => {} }, getAttribute: () => 'Note 4' },
        { classList: { add: () => {}, remove: () => {} }, getAttribute: () => 'Note 5' },
        { classList: { add: () => {}, remove: () => {} }, getAttribute: () => 'Note 6' }
      ];
    }
    return [];
  },
  querySelector: (selector) => {
    return {
      style: {},
      classList: { add: () => {}, remove: () => {}, toggle: () => true },
      innerText: '',
      innerHTML: ''
    };
  },
  getElementById: (id) => {
    return {
      innerText: '',
      innerHTML: '',
      style: {},
      classList: { add: () => {}, remove: () => {}, toggle: () => true },
      addEventListener: () => {},
      appendChild: () => {},
      querySelectorAll: () => []
    };
  },
  addEventListener: () => {}
};

const mockWindow = {
  document: mockDocument,
  location: { pathname: '/slides/test_track/level/lesson_01.html', search: '' },
  localStorage: {
    data: {},
    getItem: (k) => mockWindow.localStorage.data[k] || null,
    setItem: (k, v) => { mockWindow.localStorage.data[k] = v; }
  },
  sessionStorage: {
    data: {},
    getItem: (k) => mockWindow.sessionStorage.data[k] || null,
    setItem: (k, v) => { mockWindow.sessionStorage.data[k] = v; }
  },
  AudioContext: function() {
    return {
      currentTime: 0,
      createOscillator: () => ({
        type: '',
        frequency: { setValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {}
      }),
      createGain: () => ({
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {}
      }),
      destination: {}
    };
  },
  addEventListener: () => {},
  crypto: {
    subtle: {
      digest: async (algo, data) => {
        return new Uint8Array([0xde, 0xad, 0xbe, 0xef]).buffer;
      }
    }
  }
};

// Global polyfills
global.window = mockWindow;
global.document = mockDocument;
global.navigator = { clipboard: { writeText: async () => {} } };
global.TextEncoder = require('util').TextEncoder;

try {
  eval(jsCode);
  console.log("[OK] slide_engine.js evaluated cleanly without top-level syntax or runtime errors.");

  // Test exposed global functions
  const requiredFunctions = [
    'toggleLearningJourney',
  'toggleGlossary',
  'verifyLessonSolution',
  'exportLearningJourney',
  'toggleTutorCockpit', 'switchCockpitTab', 'openPresenterPopout',
    'copyClassroomAssignment', 'printMissionBrief', 'handleQuestToggle',
    'handleQuiz', 'resetQuiz', 'toggleSound', 'toggleFullscreen',
    'copyCodeSnippet', 'toggleSandbox', 'updateCaesarCipher',
    'updateLiveHash', 'simulateCIAThreat', 'selectPromptChip',
    'playStepSequence', 'updateHtmlPreviewStyle', 'updateFlexLayout',
    'updateGridLayout', 'updateBoxModel', 'triggerDomClick', 'updateDataStats'
  ];

  let missingCount = 0;
  for (const fnName of requiredFunctions) {
    if (typeof mockWindow[fnName] === 'function') {
      console.log(`  [Pass] window.${fnName} is registered and callable.`);
    } else {
      console.error(`  [FAIL] window.${fnName} is MISSING!`);
      missingCount++;
    }
  }

  if (missingCount === 0) {
    console.log("\n[SUCCESS] All 23 essential interactive controller functions are registered properly!");
  } else {
    console.error(`\n[ERROR] ${missingCount} essential functions are missing!`);
    process.exit(1);
  }

  // Test CIA Triad Threat Simulator runtime behavior
  console.log("\nTesting CIA Triad Threat Simulator logic...");
  let breachedPillar = null;
  let analysisHtml = '';

  const mockSandbox = {
    closest: () => mockSandbox,
    querySelectorAll: () => [],
    querySelector: (sel) => {
      if (sel === '#pillar-c') return { querySelector: () => ({ className: '', innerText: '' }), classList: { add: (c) => { if (c==='breached') breachedPillar='c'; }, remove: () => {} } };
      if (sel === '#pillar-i') return { querySelector: () => ({ className: '', innerText: '' }), classList: { add: (c) => { if (c==='breached') breachedPillar='i'; }, remove: () => {} } };
      if (sel === '#pillar-a') return { querySelector: () => ({ className: '', innerText: '' }), classList: { add: (c) => { if (c==='breached') breachedPillar='a'; }, remove: () => {} } };
      if (sel === '#cia-analysis-summary') return { set innerHTML(val) { analysisHtml = val; }, get innerHTML() { return analysisHtml; } };
      return null;
    }
  };

  const mockChipBtn = {
    closest: () => mockSandbox,
    classList: { add: () => {}, remove: () => {} }
  };

  mockWindow.simulateCIAThreat(mockChipBtn, 'confidentiality');
  if (breachedPillar === 'c' && analysisHtml.includes('Confidentiality is breached')) {
    console.log("  [Pass] 'confidentiality' scenario correctly breached Pillar C and displayed countermeasure.");
  } else {
    console.error("  [FAIL] 'confidentiality' scenario failed:", breachedPillar, analysisHtml);
    process.exit(1);
  }

  mockWindow.simulateCIAThreat(mockChipBtn, 'integrity');
  if (breachedPillar === 'i' && analysisHtml.includes('Integrity is breached')) {
    console.log("  [Pass] 'integrity' scenario correctly breached Pillar I and displayed countermeasure.");
  } else {
    console.error("  [FAIL] 'integrity' scenario failed:", breachedPillar, analysisHtml);
    process.exit(1);
  }

  mockWindow.simulateCIAThreat(mockChipBtn, 'availability');
  if (breachedPillar === 'a' && analysisHtml.includes('Availability is breached')) {
    console.log("  [Pass] 'availability' scenario correctly breached Pillar A and displayed countermeasure.");
  } else {
    console.error("  [FAIL] 'availability' scenario failed:", breachedPillar, analysisHtml);
    process.exit(1);
  }

  console.log("\n================================================================================");
  console.log("HEADLESS RUNTIME VERIFICATION COMPLETE: ALL CHECKS PASSED 100%");
  console.log("================================================================================");

} catch (err) {
  console.error("Uncaught runtime exception in slide_engine.js:", err);
  process.exit(1);
}
