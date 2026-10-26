const fs = require('fs');
const path = require('path');

const dashEnginePath = path.join(__dirname, '../assets/js/dashboard-engine.js');
let code = fs.readFileSync(dashEnginePath, 'utf8');

// 1. Update Pearl Babalola
// Age 13, Intermediate Package: ₦75,000
const oldPearlMarker = `"id": "std-1007-r4cv",\r\n                "firstName": "Babalola",\r\n                "lastName": "Oluwadunmininu Pearl",\r\n                "age": 12,`;
const altPearlMarker = `"id": "std-1007-r4cv",\n                "firstName": "Babalola",\n                "lastName": "Oluwadunmininu Pearl",\n                "age": 12,`;

if (code.includes(oldPearlMarker)) {
    code = code.replace(oldPearlMarker, `"id": "std-1007-r4cv",\r\n                "firstName": "Babalola",\r\n                "lastName": "Oluwadunmininu Pearl",\r\n                "age": 13,\r\n                "tier": "intermediate",\r\n                "package": "Intermediate Young Engineers",`);
} else if (code.includes(altPearlMarker)) {
    code = code.replace(altPearlMarker, `"id": "std-1007-r4cv",\n                "firstName": "Babalola",\n                "lastName": "Oluwadunmininu Pearl",\n                "age": 13,\n                "tier": "intermediate",\n                "package": "Intermediate Young Engineers",`);
} else {
    // Regex fallback
    code = code.replace(/"id":\s*"std-1007-r4cv",[\s\S]*?"age":\s*\d+,/, `"id": "std-1007-r4cv",\r\n                "firstName": "Babalola",\r\n                "lastName": "Oluwadunmininu Pearl",\r\n                "age": 13,\r\n                "tier": "intermediate",\r\n                "package": "Intermediate Young Engineers",`);
}

// Update Pearl's billing block
const oldPearlBilling = `"monthlyFee": 35000,
                        "status": "renewal_pending",
                        "uncollectedOctober": true,
                        "notes": "Paid 1 month (September). No payment collected in October. Follow-up invoice to be sent after approved progress report.",`;

code = code.replace(
    /"monthlyFee":\s*35000,[\s\S]*?"uncollectedOctober":\s*true,[\s\S]*?"notes":\s*"[^"]*",/,
    `"monthlyFee": 75000,\r\n                        "packageRate": 75000,\r\n                        "tier": "intermediate",\r\n                        "octoberBridge": 37500,\r\n                        "nextCycleFee": 75000,\r\n                        "combinedRealignment": 112500,\r\n                        "status": "renewal_pending",\r\n                        "uncollectedOctober": true,\r\n                        "notes": "Intermediate package (Age 13): ₦75,000/month. October bridge (Oct 19-31, 4 sessions): ₦37,500. November cycle: ₦75,000. Realignment total: ₦112,500 (or ₦37,500 bridge now + ₦75,000 on Nov 1).",`
);

// Bump DB_SYNC_VERSION to refresh cached vaults
code = code.replace(
    /const DB_SYNC_VERSION = '[^']+';/,
    `const DB_SYNC_VERSION = '2026.10.26.v102_pricing_smart_ntfy';`
);

fs.writeFileSync(dashEnginePath, code, 'utf8');
console.log('Successfully updated Pearl Babalola to Age 13, Intermediate tier (₦75,000/mo) and recalculated bridge in dashboard-engine.js!');
