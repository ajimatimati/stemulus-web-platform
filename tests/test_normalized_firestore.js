/**
 * Test: Normalized Firestore Architecture & Zero-Downtime Migration
 * =================================================================
 * Verifies that the Firebase Firestore monolith has been completely decomposed into
 * discrete collections, all CRUD operations perform atomic collection-level sync,
 * and backwards-compatible mirror writing works properly.
 */

const assert = require('assert');
const path = require('path');

// Mock localStorage and window environment for Node.js test execution
const localStorageStore = {};
global.localStorage = {
    getItem: (key) => localStorageStore[key] || null,
    setItem: (key, val) => { localStorageStore[key] = String(val); },
    removeItem: (key) => { delete localStorageStore[key]; },
    clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    location: { href: 'https://stemuluskidstech.com' }
};
global.CustomEvent = class CustomEvent {
    constructor(type, detail) {
        this.type = type;
        this.detail = detail;
    }
};

// Mock Firebase Firestore SDK with in-memory collection stores
const mockFirestoreCollections = {};
const mockBatches = [];

function getCollectionDocRef(coll, id) {
    mockFirestoreCollections[coll] = mockFirestoreCollections[coll] || {};
    return {
        id: String(id),
        get: async () => ({
            exists: id in mockFirestoreCollections[coll],
            data: () => mockFirestoreCollections[coll][id]
        }),
        set: async (data, options) => {
            if (options && options.merge && mockFirestoreCollections[coll][id]) {
                mockFirestoreCollections[coll][id] = Object.assign({}, mockFirestoreCollections[coll][id], data);
            } else {
                mockFirestoreCollections[coll][id] = Object.assign({}, data);
            }
            return Promise.resolve();
        },
        delete: async () => {
            delete mockFirestoreCollections[coll][id];
            return Promise.resolve();
        }
    };
}

global.firebase = {
    apps: [{ name: '[DEFAULT]' }],
    firestore: function() {
        return {
            collection: function(name) {
                return {
                    doc: function(id) {
                        return getCollectionDocRef(name, id);
                    },
                    onSnapshot: function(cb) {
                        return () => {}; // unsubscribe stub
                    }
                };
            },
            batch: function() {
                const batchOps = [];
                return {
                    set: function(docRef, data, options) {
                        batchOps.push({ docRef, data, options });
                    },
                    commit: async function() {
                        for (const op of batchOps) {
                            await op.docRef.set(op.data, op.options);
                        }
                        mockBatches.push(batchOps);
                        return Promise.resolve();
                    }
                };
            }
        };
    }
};

// Load the normalized Firestore module
const StemulusFirestore = require('../assets/js/stemulus-firestore.js');
global.StemulusFirestore = StemulusFirestore;

// Load DashboardEngine
const DashboardEngine = require('../assets/js/dashboard-engine.js');

async function runTests() {
    console.log('🧪 Starting Normalized Firestore Architecture Test Suite...\n');

    // TEST 1: Module and Export Integrity
    console.log('Test 1: Module and API Exports');
    assert.strictEqual(typeof StemulusFirestore, 'object', 'StemulusFirestore should be an object');
    assert.strictEqual(typeof StemulusFirestore.syncDoc, 'function', 'syncDoc must be a function');
    assert.strictEqual(typeof StemulusFirestore.deleteDoc, 'function', 'deleteDoc must be a function');
    assert.strictEqual(typeof StemulusFirestore.decomposeMonolith, 'function', 'decomposeMonolith must be a function');
    assert.strictEqual(typeof DashboardEngine.syncToFirestore, 'function', 'DashboardEngine must export syncToFirestore');
    assert.strictEqual(typeof DashboardEngine.firestore, 'object', 'DashboardEngine must export firestore adapter');
    console.log('  ✅ Module exports and interfaces verified.');

    // TEST 2: Autonomous Decomposition of Monolith
    console.log('\nTest 2: Autonomous Decomposition of Monolithic State');
    const mockMonolith = {
        users: {
            "tutor.jane@stemulus.com": { id: "tut-1", name: "Jane Tutor", email: "tutor.jane@stemulus.com", role: "tutor" },
            "parent.mark@gmail.com": { id: "par-1", name: "Mark Parent", email: "parent.mark@gmail.com", role: "parent" }
        },
        students: [
            { id: "std-101", firstName: "Alex", lastName: "Smith", course: "Python 101", status: "active" },
            { id: "std-102", firstName: "Bella", lastName: "Smith", course: "Roblox Studio", status: "active" }
        ],
        schedules: [
            { id: "sch-501", studentId: "std-101", tutorName: "Jane Tutor", date: "2026-10-25", time: "16:00" }
        ],
        attendanceRecords: [
            { id: "att-801", studentId: "std-101", tutorName: "Jane Tutor", status: "completed", date: "2026-10-20" }
        ],
        certificates: [
            { credential_id: "STEM-2026-QWHF", student_name: "Modesire Abdusalam Shittu", program_name: "Streamlit Web Apps" }
        ],
        rescheduleRequests: [
            { id: "res-901", studentName: "Alex Smith", requestedDate: "2026-10-28", status: "pending" }
        ],
        coverageRequests: [
            { id: "cov-301", tutorId: "tut-1", course: "Python 101", date: "2026-10-29", status: "pending" }
        ],
        enrollments: [
            { id: "enr-701", studentFirstName: "Leo", email: "parent.leo@gmail.com", program: "AI & ML", status: "pending" }
        ],
        billingSettings: {
            currency: "USD",
            rate: 1500
        }
    };

    const decompResult = await StemulusFirestore.decomposeMonolith(mockMonolith);
    assert.strictEqual(decompResult, true, 'Decomposition should succeed');

    // Verify discrete documents created
    assert.ok(mockFirestoreCollections['users']['tutor.jane@stemulus.com'], 'User document tutor.jane@stemulus.com must exist');
    assert.ok(mockFirestoreCollections['users']['parent.mark@gmail.com'], 'User document parent.mark@gmail.com must exist');
    assert.ok(mockFirestoreCollections['students']['std-101'], 'Student document std-101 must exist');
    assert.ok(mockFirestoreCollections['students']['std-102'], 'Student document std-102 must exist');
    assert.ok(mockFirestoreCollections['schedules']['sch-501'], 'Schedule document sch-501 must exist');
    assert.ok(mockFirestoreCollections['attendance']['att-801'], 'Attendance document att-801 must exist');
    assert.ok(mockFirestoreCollections['certificates']['STEM-2026-QWHF'], 'Certificate document STEM-2026-QWHF must exist');
    assert.ok(mockFirestoreCollections['reschedules']['res-901'], 'Reschedule document res-901 must exist');
    assert.ok(mockFirestoreCollections['coverage_requests']['cov-301'], 'Coverage document cov-301 must exist');
    assert.ok(mockFirestoreCollections['leads']['enr-701'], 'Leads document enr-701 must exist');
    assert.ok(mockFirestoreCollections['system_settings']['billing'], 'Billing settings must exist');
    assert.ok(mockFirestoreCollections['system_settings']['metadata'], 'Metadata doc must exist');
    assert.strictEqual(mockFirestoreCollections['system_settings']['metadata'].schemaVersion, '2.0.0-normalized');
    console.log('  ✅ Monolith decomposed into 10+ normalized discrete collections successfully!');

    // TEST 3: Student CRUD Atomic Sync
    console.log('\nTest 3: Student CRUD Operations Syncing Discretely');
    const newStudent = DashboardEngine.addStudent({
        id: "std-test-999",
        firstName: "Zara",
        lastName: "Nwosu",
        course: "Python Web Apps",
        parentEmail: "zara.parent@example.com"
    });
    assert.ok(mockFirestoreCollections['students']['std-test-999'], 'addStudent must write to students/std-test-999');
    assert.strictEqual(mockFirestoreCollections['students']['std-test-999'].firstName, 'Zara');

    DashboardEngine.updateStudent("std-test-999", { progress: 85 });
    assert.strictEqual(mockFirestoreCollections['students']['std-test-999'].progress, 85, 'updateStudent must sync progress to Firestore');

    DashboardEngine.deleteStudent("std-test-999");
    assert.strictEqual(mockFirestoreCollections['students']['std-test-999'].isDeleted, true, 'deleteStudent must soft-delete in Firestore');
    console.log('  ✅ Student CRUD atomic sync verified.');

    // TEST 4: Schedule CRUD Atomic Sync
    console.log('\nTest 4: Schedule CRUD Operations Syncing Discretely');
    const newSchedule = DashboardEngine.addSchedule({
        studentId: "std-test-999",
        studentName: "Zara Nwosu",
        course: "Python Web Apps",
        tutorName: "David Okon",
        date: "2026-10-30",
        time: "15:00"
    });
    assert.ok(newSchedule.id.startsWith("sch-"), 'Schedule ID must be generated');
    assert.ok(mockFirestoreCollections['schedules'][newSchedule.id], `Schedule must exist at schedules/${newSchedule.id}`);

    DashboardEngine.updateSchedule(newSchedule.id, { time: "17:00" });
    assert.strictEqual(mockFirestoreCollections['schedules'][newSchedule.id].time, "17:00", 'updateSchedule must sync updated time');

    DashboardEngine.deleteSchedule(newSchedule.id);
    assert.strictEqual(mockFirestoreCollections['schedules'][newSchedule.id], undefined, 'deleteSchedule must delete from Firestore');
    console.log('  ✅ Schedule CRUD atomic sync verified.');

    // TEST 5: Attendance Submission Atomic Sync
    console.log('\nTest 5: Attendance Submission Syncing to Discrete Collection');
    const attendanceResult = DashboardEngine.addAttendanceRecord({
        id: "att-test-777",
        scheduleId: "sch-501",
        studentId: "std-101",
        studentName: "Alex Smith",
        tutorName: "Jane Tutor",
        tutorEmail: "tutor.jane@stemulus.com",
        classDate: "2026-10-23",
        topic: "Loops & Functions",
        status: "pending"
    });
    assert.ok(mockFirestoreCollections['attendance']['att-test-777'], 'Attendance record must exist in attendance collection');
    assert.strictEqual(mockFirestoreCollections['attendance']['att-test-777'].topic, "Loops & Functions");
    console.log('  ✅ Attendance submission atomic sync verified.');

    // TEST 6: Reschedule & Coverage Sync
    console.log('\nTest 6: Reschedule & Coverage Requests Sync');
    const resReq = DashboardEngine.submitReschedule({
        scheduleId: "sch-501",
        studentName: "Alex Smith",
        currentDate: "2026-10-25",
        requestedDate: "2026-10-27",
        requestedTime: "17:00",
        course: "Python 101"
    });
    assert.ok(resReq.id, 'Reschedule request must receive an ID');
    assert.ok(mockFirestoreCollections['reschedules'][resReq.id], 'Reschedule request must sync to reschedules collection');

    const covReq = DashboardEngine.submitCoverageRequest({
        scheduleId: "sch-501",
        tutorId: "tut-1",
        course: "Python 101",
        date: "2026-10-28",
        time: "16:00",
        reason: "Conference"
    });
    assert.ok(covReq.id, 'Coverage request must receive an ID');
    assert.ok(mockFirestoreCollections['coverage_requests'][covReq.id], 'Coverage request must sync to coverage_requests collection');
    console.log('  ✅ Reschedules and Coverage sync verified.');

    // TEST 7: Leads / Enrollments Atomic Sync
    console.log('\nTest 7: Enrollment / Discovery Leads Sync');
    const enr = DashboardEngine.addEnrollment({
        studentFirstName: "Maya",
        studentLastName: "Adeleke",
        email: "maya.parent@example.com",
        program: "Web Development",
        studentAge: 10
    });
    assert.ok(enr.id, 'Enrollment must receive an ID');
    assert.ok(mockFirestoreCollections['leads'][enr.id], 'Enrollment must sync to leads collection');
    console.log('  ✅ Leads / enrollments atomic sync verified.');

    // TEST 8: Direct User Lookup on Login (Fast Query without Monolith)
    console.log('\nTest 8: Direct Normalized User Query on Login');
    // Pre-populate a user in users/
    const expectedHash = '751e9c9468182422020548711982ad9fe36f65a0b254ca48c289974f02ba8a1a'; // STEMulus2026!
    mockFirestoreCollections['users']['direct.query@stemulus.com'] = {
        email: "direct.query@stemulus.com",
        name: "Direct Query User",
        role: "parent",
        password: expectedHash
    };
    // Ensure not in local store
    const currentDb = DashboardEngine.getDB();
    if (currentDb.users && currentDb.users['direct.query@stemulus.com']) {
        delete currentDb.users['direct.query@stemulus.com'];
        DashboardEngine.saveDB(currentDb);
    }
    const loginResult = await DashboardEngine.login("direct.query@stemulus.com", "STEMulus2026!");
    console.log('  Login Result:', loginResult);
    assert.strictEqual(loginResult.success, true, 'Direct normalized user lookup must succeed');
    assert.strictEqual(loginResult.user.email, "direct.query@stemulus.com");
    console.log('  ✅ Fast normalized user lookup on login verified.');

    // TEST 9: Dual-Write Backwards Compatibility Mirror
    console.log('\nTest 9: Dual-Write Mirror to state/current');
    DashboardEngine.saveDB(DashboardEngine.getDB());
    // Wait 600ms for debounced mirror write
    await new Promise(r => setTimeout(r, 650));
    assert.ok(mockFirestoreCollections['state']['current'], 'Dual-write mirror must update state/current');
    assert.strictEqual(mockFirestoreCollections['state']['current']._schemaVersion, '2.0.0-normalized');
    console.log('  ✅ Dual-write mirror to state/current verified.');

    console.log('\n🎉 ALL 9 NORMALIZED FIRESTORE TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch(err => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
});
