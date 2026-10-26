const fs = require('fs');

let adminEngine = fs.readFileSync('assets/js/admin-engine.js', 'utf8');

// Replacement for enrollment section
const oldStart = adminEngine.indexOf('function loadNetlifyEnrollments()');
const oldEnd = adminEngine.indexOf('function showToast(', oldStart);

if (oldStart === -1 || oldEnd === -1) {
    console.error('Could not find markers in admin-engine.js');
    process.exit(1);
}

const newEnrollmentBlock = `function loadNetlifyEnrollments() {
    var container = document.getElementById('netlify-enrollments-list');
    if (!container) return;
    var pending = JSON.parse(localStorage.getItem('stemulus_pending_enrollments') || '[]');
    if (!pending.length) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">No pending web form submissions found.<br><span class="text-xs">Submissions appear here after parents complete the enrollment form on the website.</span></p>';
        return;
    }
    container.innerHTML = pending.map(function(enr, idx) {
        var children = enr.children || [];
        var childList = children.length ?
            children.map(function(c){ 
                var dob = c.birthday ? ' <span class="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">🎂 DOB: ' + c.birthday + '</span>' : '';
                return (c.firstName||'') + ' ' + (c.lastName||'') + ' (' + (c.program||'?') + ', Age ' + (c.age||'?') + ')' + dob; 
            }).join(', ') :
            (enr.studentFirstName||'') + ' ' + (enr.studentLastName||'') + ' (' + (enr.program||'?') + ', Age ' + (enr.studentAge||'?') + ')' + (enr.studentBirthday ? ' <span class="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">🎂 DOB: ' + enr.studentBirthday + '</span>' : '');
        var submitted = enr.timestamp ? new Date(enr.timestamp).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '?';
        return '<div class="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4 bg-white hover:border-indigo-200 transition-colors">' +
            '<div class="flex-1 min-w-0">' +
                '<p class="font-semibold text-gray-800 text-sm">' + (enr.parentName||'Parent') + ' &bull; ' + (enr.email||'') + ' &bull; ' + (enr.phone||'') + '</p>' +
                '<p class="text-sm text-gray-600 mt-1 leading-relaxed">Child/Children: ' + childList + '</p>' +
                '<p class="text-xs text-gray-400 mt-1">Submitted: ' + submitted + ' &bull; Ref: ' + (enr.id||enr.enrollmentId||'N/A') + '</p>' +
            '</div>' +
            '<div class="flex items-center gap-2 shrink-0">' +
                '<button onclick="importNetlifyEnrollment(' + idx + ')" class="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors">Approve &amp; Add</button>' +
            '</div>' +
        '</div>';
    }).join('');
}

window.importNetlifyEnrollment = function(idx) {
    var pending = JSON.parse(localStorage.getItem('stemulus_pending_enrollments') || '[]');
    var enr = pending[idx];
    if (!enr) return;
    var children = enr.children || [];
    if (!children.length && enr.studentFirstName) {
        children = [{ 
            firstName: enr.studentFirstName, 
            lastName: enr.studentLastName, 
            age: enr.studentAge, 
            birthday: enr.studentBirthday || '', 
            gender: enr.studentGender, 
            experience: enr.experience, 
            program: enr.program 
        }];
    }
    // Generate random password — never hardcode defaults
    var chars2 = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@';
    var importTempPwd = Array.from(crypto.getRandomValues(new Uint8Array(10))).map(function(b){return chars2[b%chars2.length];}).join('');
    var added = 0;
    children.forEach(function(child) {
        var studentData = { 
            firstName: child.firstName, 
            lastName: child.lastName, 
            age: child.age, 
            birthday: (child.birthday && typeof child.birthday === 'string' && child.birthday.trim().length >= 10) ? child.birthday.trim() : (enr.studentBirthday || ''),
            hasExplicitBirthday: !!(child.birthday || enr.studentBirthday),
            gender: child.gender, 
            experience: child.experience, 
            program: child.program, 
            parentName: enr.parentName, 
            parentEmail: enr.email, 
            parentPhone: enr.phone, 
            tutorName: '', 
            classroomLink: '', 
            status: 'active', 
            remindersPaused: false 
        };
        if (DashboardEngine.addStudent) DashboardEngine.addStudent(studentData);
        if (DashboardEngine.getDB && enr.email) {
            var db2 = DashboardEngine.getDB();
            if (db2.users && !db2.users[enr.email.toLowerCase()]) {
                if (DashboardEngine.addUser) DashboardEngine.addUser({ email: enr.email, name: enr.parentName, role: 'parent', password: importTempPwd });
            }
        }
        added++;
    });
    // Queue welcome email for admin review
    if (DashboardEngine.addToEmailQueue && enr.email) {
        DashboardEngine.addToEmailQueue({
            type: 'welcome',
            to: enr.email,
            recipientName: enr.parentName || 'Parent',
            subject: "Welcome to STEMulus — your child's coding journey starts!",
            htmlPreview: 'Welcome email for ' + (enr.parentName||'') + ' (' + enr.email + '). Temp password: ' + importTempPwd + '. Review before sending.',
            data: { parentEmail: enr.email, parentName: enr.parentName, studentName: children[0] ? (children[0].firstName+' '+children[0].lastName) : '', courseName: children[0] ? children[0].program : '', tempPassword: importTempPwd, classroomLink: '' },
            triggeredBy: 'netlify_enrollment_import'
        });
    }
    pending.splice(idx, 1);
    localStorage.setItem('stemulus_pending_enrollments', JSON.stringify(pending));
    if (typeof showToast === 'function') showToast(added + ' student(s) added with birthday saved. Welcome email queued in Email Queue.', 'success');
    loadNetlifyEnrollments();
    if (typeof loadDashboardData === 'function') loadDashboardData();
};

function exportEnrollmentsSpreadsheet() {
    var pending = JSON.parse(localStorage.getItem('stemulus_pending_enrollments') || '[]');
    var history = JSON.parse(localStorage.getItem('stemulus_enrollments') || '[]');
    var dbEnrollments = (typeof DashboardEngine !== 'undefined' && DashboardEngine.getDB) ? (DashboardEngine.getDB().enrollments || []) : [];
    
    // Combine all unique enrollments
    var allMap = new Map();
    [...history, ...dbEnrollments, ...pending].forEach(function(e) {
        if (!e) return;
        var key = e.enrollmentId || e.id || ((e.parentEmail || e.email || '') + '_' + (e.studentFirstName || ''));
        if (!allMap.has(key)) allMap.set(key, e);
    });

    var rows = [
        ['Enrollment ID', 'Date Submitted', 'Student Name', 'Birthday (DOB)', 'Age', 'Gender', 'Program', 'Experience Level', 'Parent Name', 'Parent Email', 'Phone / WhatsApp', 'Country', 'Timezone', 'Media Consent', 'Referral / Source', 'Status']
    ];

    allMap.forEach(function(e) {
        var children = e.children && e.children.length ? e.children : [{
            firstName: e.studentFirstName,
            lastName: e.studentLastName,
            age: e.studentAge,
            birthday: e.studentBirthday,
            gender: e.studentGender,
            program: e.program,
            experience: e.experience
        }];

        children.forEach(function(c) {
            rows.push([
                e.enrollmentId || e.id || 'N/A',
                e.timestamp ? new Date(e.timestamp).toISOString().split('T')[0] : '',
                (c.firstName || e.studentFirstName || '') + ' ' + (c.lastName || e.studentLastName || ''),
                c.birthday || e.studentBirthday || 'Not specified',
                c.age || e.studentAge || '',
                c.gender || e.studentGender || '',
                c.program || e.program || '',
                c.experience || e.experience || 'Beginner',
                e.parentName || '',
                e.parentEmail || e.email || '',
                e.phone || '',
                e.country || 'Global',
                e.timeZone || '',
                e.mediaConsent === false ? 'Declined' : 'Granted',
                e.referral || e.leadSource || e.source || 'Website',
                e.status || 'pending'
            ]);
        });
    });

    var csvContent = '\uFEFF' + rows.map(function(r) {
        return r.map(function(field) {
            var str = String(field == null ? '' : field);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }).join(',');
    }).join('\r\n');

    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'stemulus_enrollments_spreadsheet_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof showToast === 'function') showToast('Enrollment spreadsheet exported successfully (' + (rows.length - 1) + ' records).', 'success');
}

`;

adminEngine = adminEngine.substring(0, oldStart) + newEnrollmentBlock + adminEngine.substring(oldEnd);

// Expose in return object
if (!adminEngine.includes('exportEnrollmentsSpreadsheet,')) {
    adminEngine = adminEngine.replace('loadNetlifyEnrollments,', 'loadNetlifyEnrollments,\r\n    exportEnrollmentsSpreadsheet,');
}

// Expose window alias
if (!adminEngine.includes('window.exportEnrollmentsSpreadsheet =')) {
    adminEngine = adminEngine.replace('window.loadNetlifyEnrollments = AdminEngine.loadNetlifyEnrollments;', 'window.loadNetlifyEnrollments = AdminEngine.loadNetlifyEnrollments;\r\n    window.exportEnrollmentsSpreadsheet = AdminEngine.exportEnrollmentsSpreadsheet;');
}

fs.writeFileSync('assets/js/admin-engine.js', adminEngine, 'utf8');
console.log('Successfully updated assets/js/admin-engine.js!');
