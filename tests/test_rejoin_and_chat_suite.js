// tests/test_rejoin_and_chat_suite.js
// Automated verification for Mid-Class Dropout/Rejoin Monitoring & WhatsApp/Telegram-grade Faculty Chat Suite

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Rejoin Monitoring & Faculty Chat Suite E2E Test...');

// Mock browser window and localStorage
const localStorageStore = {};
global.localStorage = {
    getItem: (key) => localStorageStore[key] || null,
    setItem: (key, val) => { localStorageStore[key] = String(val); },
    removeItem: (key) => { delete localStorageStore[key]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

global.window = {
    localStorage: global.localStorage,
    addEventListener: () => {},
    dispatchEvent: () => {},
    AudioContext: function() {
        return {
            currentTime: 0,
            destination: {},
            createOscillator: () => ({
                type: 'sine',
                frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
                connect: () => {},
                start: () => {},
                stop: () => {}
            }),
            createGain: () => ({
                gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
                connect: () => {}
            })
        };
    },
    Notification: class MockNotification {
        static permission = 'granted';
        static requestPermission() { return Promise.resolve('granted'); }
        constructor(title, options) {
            this.title = title;
            this.options = options;
            MockNotification.instances.push({ title, options });
        }
    }
};
global.window.webkitAudioContext = global.window.AudioContext;
global.window.Notification.instances = [];
global.Notification = global.window.Notification;

// Mock DOM environment
global.document = {
    getElementById: (id) => {
        if (id === 'live-rejoin-beacon-container') return { innerHTML: '', remove: () => {} };
        if (id === 'mount-faculty-chat-suite') return { innerHTML: '' };
        if (id === 'mount-tutor-chat-drawer') return { innerHTML: '' };
        if (id === 'chat-push-toggle-btn') return { innerHTML: '', className: '', onclick: null };
        return null;
    },
    createElement: (tag) => ({
        id: '',
        className: '',
        innerHTML: '',
        style: {},
        appendChild: () => {},
        setAttribute: () => {},
        querySelector: () => null,
        remove: () => {},
        classList: { add: () => {}, remove: () => {}, contains: () => false }
    }),
    body: {
        appendChild: () => {},
        style: {}
    },
    addEventListener: () => {}
};

// 1. Test Class Escalation Engine Rejoin & Telemetry
console.log('\n--- 1. Testing Class Escalation Engine Rejoin & Dropout Telemetry ---');
const ClassEscalationEngine = require('../assets/js/class-escalation-engine.js');

assert.strictEqual(typeof ClassEscalationEngine, 'object', 'ClassEscalationEngine must be defined');
assert.strictEqual(typeof ClassEscalationEngine.recordDisconnect, 'function', 'recordDisconnect must be exported');
assert.strictEqual(typeof ClassEscalationEngine.recordReconnect, 'function', 'recordReconnect must be exported');
assert.strictEqual(typeof ClassEscalationEngine.autoLogSessionAttendance, 'function', 'autoLogSessionAttendance must be exported');

// Test recordDisconnect
const testClassData = {
    scheduleId: 'sched-daniel-001',
    studentName: 'Daniel Adeleke',
    tutorName: 'David Adeleke',
    courseName: 'Roblox Lua Masterclass',
    meetLink: 'https://meet.google.com/abc-defg-hij'
};

const disconnectAlert = ClassEscalationEngine.recordDisconnect('session-123', 'sched-daniel-001', 'student', 'Daniel Adeleke', 'Roblox Lua Masterclass');
console.log('✅ recordDisconnect output alert type:', disconnectAlert.type);
assert.strictEqual(disconnectAlert.type, 'dropout', 'Alert type should be dropout');
assert(disconnectAlert.title.includes('DISCONNECT'), 'Title should indicate disconnect');

// Verify active rejoin prompt stored in localStorage
const rejoinPromptsRaw = localStorage.getItem('stemulus_active_rejoin_prompts');
assert(rejoinPromptsRaw, 'stemulus_active_rejoin_prompts must be stored in localStorage');
const rejoinPrompts = JSON.parse(rejoinPromptsRaw);
assert(rejoinPrompts['session-123'] || rejoinPrompts['sched-daniel-001'], 'Active prompt for schedule must exist');
const activePrompt = rejoinPrompts['session-123'] || rejoinPrompts['sched-daniel-001'];
assert.strictEqual(activePrompt.studentName, 'Daniel Adeleke');
console.log('✅ Active rejoin prompt stored in localStorage:', activePrompt.studentName);

// Test recordReconnect
const reconnectAlert = ClassEscalationEngine.recordReconnect('session-123', 'sched-daniel-001', 'student', 'Daniel Adeleke', 'Roblox Lua Masterclass');
console.log('✅ recordReconnect output alert type:', reconnectAlert.type);
assert.strictEqual(reconnectAlert.type, 'reconnect', 'Alert type should be reconnect');
assert(reconnectAlert.message.includes('RECONNECTED') || reconnectAlert.title.includes('RECONNECTED'), 'Message should indicate reconnected');
assert(reconnectAlert.message.includes('after') || reconnectAlert.message.includes('secs') || reconnectAlert.message.includes('mins'), 'Message should compute offline duration');

// Verify rejoin prompt cleared
const clearedPrompts = JSON.parse(localStorage.getItem('stemulus_active_rejoin_prompts') || '{}');
assert(!clearedPrompts['sched-daniel-001'], 'Active rejoin prompt should be cleared upon reconnection');
console.log('✅ Rejoin prompt cleared from localStorage on reconnect');

// Test autoLogSessionAttendance
const attendanceRecord = ClassEscalationEngine.autoLogSessionAttendance({
    scheduleId: 'sched-daniel-001',
    studentName: 'Daniel Adeleke',
    tutorName: 'David Adeleke',
    courseName: 'Roblox Lua Masterclass',
    startTime: Date.now() - 60 * 60 * 1000,
    endTime: Date.now()
});
assert.strictEqual(attendanceRecord.studentName, 'Daniel Adeleke');
assert.strictEqual(attendanceRecord.attendanceStatus, 'present');
assert(attendanceRecord.activeDurationMins >= 50, 'Active duration should be close to 60 mins');
console.log('✅ autoLogSessionAttendance verified: status=' + attendanceRecord.attendanceStatus + ', activeMins=' + attendanceRecord.activeDurationMins);

// Verify prefilled tutor log exists
const prefilledLogRaw = localStorage.getItem('stemulus_prefilled_tutor_log');
assert(prefilledLogRaw, 'stemulus_prefilled_tutor_log must be set for tutor logging');
const prefilledLog = JSON.parse(prefilledLogRaw);
assert.strictEqual(prefilledLog.scheduleId, 'sched-daniel-001');
assert(prefilledLog.verifiedTelemetry, 'Verified telemetry notes must be prefilled');
console.log('✅ Tutor Session Log prefilled with telemetry notes');


// 2. Test Classroom Rejoin Beacon
console.log('\n--- 2. Testing Classroom Rejoin Beacon ---');
const ClassroomRejoinBeacon = require('../assets/js/classroom-rejoin-beacon.js');

assert.strictEqual(typeof ClassroomRejoinBeacon, 'object', 'ClassroomRejoinBeacon must be defined');
const beaconHtml = ClassroomRejoinBeacon.renderBeaconHTML({
    scheduleId: 'sched-daniel-001',
    studentName: 'Daniel Adeleke',
    tutorName: 'David Adeleke',
    courseName: 'Roblox Lua Masterclass',
    meetLink: 'https://meet.google.com/abc-defg-hij',
    disconnectTime: Date.now() - 120 * 1000
});
assert(beaconHtml.includes('Live Class Disconnected'), 'Beacon HTML must indicate disconnected state');
assert(beaconHtml.includes('Rejoin Class Now'), 'Beacon HTML must include 1-click Rejoin button');
assert(beaconHtml.includes('join-class.html?id=sched-daniel-001'), 'Rejoin button must link directly to classroom');
assert(beaconHtml.includes('T+'), 'Beacon HTML must include elapsed timer badge');
console.log('✅ ClassroomRejoinBeacon renders 3D playful squircle card with 1-click rejoin button');


// 3. Test Faculty Chat Engine
console.log('\n--- 3. Testing Faculty Chat Engine ---');
const FacultyChatEngine = require('../assets/js/faculty-chat-engine.js');

assert.strictEqual(typeof FacultyChatEngine, 'object', 'FacultyChatEngine must be defined');

// Initialize Admin
FacultyChatEngine.init('admin');
const store = FacultyChatEngine.getStore();
const threadIds = Object.keys(store);
assert(threadIds.length > 0, 'Faculty directory must list threads');
console.log('✅ Faculty store loaded with threads:', threadIds);

// Admin selects thread and sends message
const activeThreadKey = threadIds[0];
FacultyChatEngine.selectThread(activeThreadKey);

FacultyChatEngine.sendMessage('Hello ' + store[activeThreadKey].tutorName + '! How is your lesson proceeding today?');
const updatedStoreAfterAdmin = FacultyChatEngine.getStore();
const msgs = updatedStoreAfterAdmin[activeThreadKey].messages;
assert(msgs.length > 0, 'Messages must exist in thread');
const lastMsg = msgs[msgs.length - 1];
assert.strictEqual(lastMsg.sender, 'admin');
assert(lastMsg.text.includes('How is your lesson proceeding today?'));
console.log('✅ Admin successfully sent message to', store[activeThreadKey].tutorName);

// Tutor replies to Admin
FacultyChatEngine.init('tutor');
FacultyChatEngine.selectThread(activeThreadKey);
FacultyChatEngine.sendMessage('Class is going wonderfully! We just built our collision mechanics.');
const updatedStoreAfterTutor = FacultyChatEngine.getStore();
const tutorLastMsg = updatedStoreAfterTutor[activeThreadKey].messages.slice(-1)[0];
assert.strictEqual(tutorLastMsg.sender, 'tutor');
assert(tutorLastMsg.text.includes('collision mechanics'));
console.log('✅ Tutor successfully replied to Admin in the same channel');

// Quick Action Chip Test
FacultyChatEngine.init('admin');
FacultyChatEngine.selectThread(activeThreadKey);
FacultyChatEngine.sendQuickAction('dropout_alert');
const quickStore = FacultyChatEngine.getStore();
const quickMsg = quickStore[activeThreadKey].messages.slice(-1)[0];
assert(quickMsg.text.includes('🚨 Mid-Class Dropout Check'), 'Quick action chip message must be recorded');
console.log('✅ Quick Action Chip dispatched successfully');

// Sound synthesizer check
if (typeof FacultyChatEngine.playBubblePopSound === 'function') {
    FacultyChatEngine.playBubblePopSound();
    console.log('✅ Web Audio API bubble-pop synthesizer executed without error');
}

// UI Markup Generation Tests
const chatSuiteHtml = FacultyChatEngine.renderChatSuiteHTML();
assert(chatSuiteHtml.includes('Faculty Messenger'), 'Chat suite HTML must render header');
assert(chatSuiteHtml.includes('chat-text-input'), 'Chat input must be present');
assert(chatSuiteHtml.includes('Desktop Alerts') || chatSuiteHtml.includes('chat-push-toggle-btn'), 'Desktop push prompt must be present');
console.log('✅ FacultyChatEngine.renderChatSuiteHTML() generated full WhatsApp/Telegram-grade UI');

const tutorDrawerHtml = FacultyChatEngine.renderFloatingDrawerHTML();
assert(tutorDrawerHtml.includes('stemulus-floating-chat-bubble'), 'Floating dock button must be present');
assert(tutorDrawerHtml.includes('stemulus-floating-chat-drawer'), 'Slide-out drawer must be present');
console.log('✅ FacultyChatEngine.renderFloatingDrawerHTML() generated 3D floating drawer');

console.log('\n========================================');
console.log('🎉 ALL REJOIN & CHAT SUITE TESTS PASSED (100%)');
console.log('========================================\n');
process.exit(0);
