const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '..', 'assets', 'js', 'dashboard-engine.js');
let code = fs.readFileSync(enginePath, 'utf8');

const targetChunk = `                let tutorsAppended = false;
                coreVerifiedTutors.forEach(ct => {
                    const ctKey = ct.email.toLowerCase().trim();
                    const exists = parsed.tutors.some(t => (t.email && t.email.toLowerCase().trim() === ctKey) || (t.id && t.id === ct.id));
                    if (!exists) {
                        parsed.tutors.push(ct);
                        tutorsAppended = true;
                    }
                });`;

const replacementChunk = `                let tutorsAppended = false;
                coreVerifiedTutors.forEach(ct => {
                    const ctKey = ct.email.toLowerCase().trim();
                    const existing = parsed.tutors.find(t => (t.email && t.email.toLowerCase().trim() === ctKey) || (t.id && t.id === ct.id));
                    if (!existing) {
                        parsed.tutors.push(ct);
                        tutorsAppended = true;
                    } else {
                        // Enrich existing record with verified onboarding & banking details if missing
                        const fieldsToSync = ['bankName', 'accountHolderName', 'accountNumber', 'location', 'assignmentType', 'nextOfKinName', 'nextOfKinContact', 'workstationAudit', 'weeklyAvailableSlots', 'operatingStandard', 'digitalSignature', 'onboardedAt'];
                        fieldsToSync.forEach(f => {
                            if (ct[f] && (!existing[f] || existing[f] !== ct[f])) {
                                existing[f] = ct[f];
                                tutorsAppended = true;
                            }
                        });
                    }
                });`;

// Normalize \r\n to \n for replacement
const normalizedCode = code.replace(/\r\n/g, '\n');
const normalizedTarget = targetChunk.replace(/\r\n/g, '\n');
const normalizedReplacement = replacementChunk.replace(/\r\n/g, '\n');

if (normalizedCode.includes(normalizedTarget)) {
    const updated = normalizedCode.replace(normalizedTarget, normalizedReplacement);
    fs.writeFileSync(enginePath, updated, 'utf8');
    console.log('Successfully patched tutor merge loop in dashboard-engine.js!');
} else {
    console.error('Target chunk not found in dashboard-engine.js');
}
