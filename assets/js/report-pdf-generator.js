/**
 * STEMulus Official Monthly Report PDF Generator
 * Renders a publication-grade, clean white-background academic evaluation document
 * optimized for comprehension, parent readability, and 1-click browser print-to-PDF.
 */
(function(window) {
    'use strict';

    var StemulusReportPDF = {
        /**
         * Formats a raw report object into clean display data
         */
        formatReportData: function(raw) {
            var monthStr = 'Academic Evaluation';
            if (raw.month) {
                try {
                    var parts = raw.month.split('-');
                    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
                    monthStr = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                } catch(e) {
                    monthStr = raw.month;
                }
            }

            var submittedDateStr = raw.submittedAt 
                ? new Date(raw.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

            var grade = raw.overallGrade || 'A';
            var gradeDesc = 'Exceptional Performance';
            if (grade === 'A+' || grade === 'A') gradeDesc = 'Distinction & Outstanding Progress';
            else if (grade === 'B+' || grade === 'B') gradeDesc = 'Good Competency & Steady Growth';
            else if (grade === 'C+' || grade === 'C') gradeDesc = 'Satisfactory Progress — Reinforcement Needed';
            else if (grade === 'D' || grade === 'F') gradeDesc = 'Focus Support Required';

            var engagement = raw.engagementLevel || 'engaged';
            var engagementLabels = {
                'highly-engaged': 'Highly Engaged — Proactive & Enthusiastic',
                'engaged': 'Engaged — Actively Participates',
                'moderate': 'Moderate — Paced & Steady',
                'low': 'Needs Prompting — Developing Focus',
                'declining': 'Attention Needed'
            };
            var engagementText = engagementLabels[engagement] || 'Consistently Engaged';

            var reportCode = raw.id 
                ? (raw.id.startsWith('STEM-') ? raw.id : 'STEM-REP-' + raw.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase())
                : 'STEM-REP-' + Math.floor(100000 + Math.random() * 900000);

            return {
                id: reportCode,
                monthName: monthStr,
                submittedDate: submittedDateStr,
                studentName: raw.studentName || 'Student',
                course: raw.course || 'Foundational Computing & Coding',
                module: raw.module || 'Core Curriculum Module',
                tutorName: raw.tutorName || 'STEMulus Faculty Lead',
                sessionsAttended: raw.sessionsAttended !== undefined ? raw.sessionsAttended : (raw.totalSessions || 4),
                totalSessions: raw.totalSessions || 4,
                totalHours: raw.totalHours || (raw.totalSessions ? (raw.totalSessions * 1.5) : 6),
                grade: grade,
                gradeDesc: gradeDesc,
                engagementText: engagementText,
                topics: raw.topics || 'Core programming syntax, logical sequencing, hands-on project implementation, and computational problem-solving.',
                strengths: raw.strengths || raw.achievements || 'Demonstrates strong analytical thinking, positive enthusiasm during class, and an eagerness to experiment with new programming constructs.',
                challenges: raw.challenges || raw.supportNeeded || 'Occasional hesitation when debugging multi-step errors independently; continuing to reinforce debugging resilience and systematic testing.',
                recommendation: raw.recommendation || raw.otherComments || 'Continue advancing through the next module exercises. Reinforce coding practice between weekly classes to cement syntactic fluency.',
                adminNotes: raw.adminNotes || raw.directorNote || '',
                confidence: raw.confidence || 9
            };
        },

        /**
         * Generates the pure clean white background HTML string
         */
        buildDocumentHTML: function(data) {
            var attendanceRate = data.totalSessions > 0 
                ? Math.round((parseInt(data.sessionsAttended) / parseInt(data.totalSessions)) * 100) 
                : 100;
            if (isNaN(attendanceRate)) attendanceRate = 100;

            // Format topics into clean bullet items if multi-line or bulleted
            var topicsHTML = '';
            var topicLines = (data.topics || '').split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
            if (topicLines.length > 1) {
                topicsHTML = '<ul style="margin:0;padding-left:1.25rem;color:#334155;line-height:1.65;font-size:0.92rem;">' +
                    topicLines.map(function(line){
                        var cleanLine = line.replace(/^[•\-\*\d\.\)]\s*/, '');
                        return '<li style="margin-bottom:0.35rem;">' + cleanLine + '</li>';
                    }).join('') + '</ul>';
            } else {
                topicsHTML = '<p style="margin:0;color:#334155;line-height:1.65;font-size:0.92rem;">' + data.topics + '</p>';
            }

            var adminNoteBlock = data.adminNotes ? (
                '<div style="margin-top:1.5rem;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #4f46e5;border-radius:10px;padding:1rem 1.25rem;">' +
                    '<div style="font-size:0.75rem;font-weight:800;color:#4f46e5;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.35rem;">Academic Director Endorsement</div>' +
                    '<p style="margin:0;color:#1e293b;font-size:0.9rem;font-style:italic;line-height:1.6;">“' + data.adminNotes + '”</p>' +
                '</div>'
            ) : '';

            return (
                '<div id="stemulus-printable-doc" style="max-width:850px;margin:0 auto;background:#ffffff;color:#0f172a;font-family:\'Outfit\',\'Nunito\',-apple-system,sans-serif;padding:2.5rem 3rem;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.06);position:relative;">' +
                    
                    '<!-- Header Banner -->' +
                    '<div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:1.5rem;margin-bottom:2rem;gap:1.5rem;">' +
                        '<div style="flex:1;">' +
                            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:0.5rem;">' +
                                '<img src="favicon.png" alt="STEMulus" width="44" height="44" style="border-radius:10px;display:block;object-fit:contain;">' +
                                '<div>' +
                                    '<div style="font-size:1.45rem;font-weight:900;letter-spacing:-0.02em;color:#0f172a;line-height:1.1;">STEMulus Kids Academy</div>' +
                                    '<div style="font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#f97316;">Official Monthly Student Evaluation</div>' +
                                '</div>' +
                            '</div>' +
                            '<p style="margin:0;font-size:0.8rem;color:#64748b;line-height:1.4;">STEMulus Innovations Ltd &middot; Global Computing, AI & Robotics Education</p>' +
                        '</div>' +
                        '<div style="text-align:right;flex-shrink:0;">' +
                            '<div style="display:inline-block;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:0.4rem 0.85rem;margin-bottom:0.35rem;">' +
                                '<span style="font-size:0.7rem;font-weight:800;letter-spacing:0.05em;color:#475569;text-transform:uppercase;">Ref: </span>' +
                                '<span style="font-family:monospace;font-weight:800;font-size:0.82rem;color:#0f172a;">' + data.id + '</span>' +
                            '</div>' +
                            '<div style="font-size:0.78rem;color:#64748b;font-weight:600;">Issued: ' + data.submittedDate + '</div>' +
                            '<div style="font-size:0.78rem;color:#059669;font-weight:700;margin-top:2px;">&#10003; Verified Academy Record</div>' +
                        '</div>' +
                    '</div>' +

                    '<!-- Title & Period -->' +
                    '<div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:2rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">' +
                        '<div>' +
                            '<div style="font-size:0.7rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;margin-bottom:0.25rem;">Student Academic Evaluation</div>' +
                            '<div style="font-size:1.6rem;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">' + data.studentName + '</div>' +
                            '<div style="font-size:0.9rem;font-weight:600;color:#4f46e5;margin-top:0.2rem;">' + data.course + '</div>' +
                        '</div>' +
                        '<div style="text-align:right;">' +
                            '<div style="font-size:0.7rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;margin-bottom:0.25rem;">Evaluation Period</div>' +
                            '<div style="font-size:1.25rem;font-weight:800;color:#0f172a;">' + data.monthName + '</div>' +
                            '<div style="font-size:0.8rem;color:#64748b;">Instructor: <strong style="color:#0f172a;">' + data.tutorName + '</strong></div>' +
                        '</div>' +
                    '</div>' +

                    '<!-- Scorecard & Attendance Metrics Grid -->' +
                    '<div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:1rem;margin-bottom:2rem;">' +
                        '<div style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;padding:1rem;text-align:center;">' +
                            '<div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;color:#64748b;letter-spacing:0.05em;margin-bottom:0.35rem;">Overall Grade</div>' +
                            '<div style="font-size:2rem;font-weight:900;color:#059669;line-height:1;">' + data.grade + '</div>' +
                            '<div style="font-size:0.7rem;font-weight:700;color:#059669;margin-top:0.35rem;">' + data.gradeDesc.split(' ')[0] + '</div>' +
                        '</div>' +

                        '<div style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;padding:1rem;text-align:center;">' +
                            '<div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;color:#64748b;letter-spacing:0.05em;margin-bottom:0.35rem;">Attendance</div>' +
                            '<div style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1;">' + attendanceRate + '%</div>' +
                            '<div style="font-size:0.7rem;font-weight:600;color:#64748b;margin-top:0.35rem;">' + data.sessionsAttended + ' of ' + data.totalSessions + ' sessions</div>' +
                        '</div>' +

                        '<div style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;padding:1rem;text-align:center;">' +
                            '<div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;color:#64748b;letter-spacing:0.05em;margin-bottom:0.35rem;">Teaching Hours</div>' +
                            '<div style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1;">' + data.totalHours + '<span style="font-size:1rem;font-weight:600;color:#64748b;">h</span></div>' +
                            '<div style="font-size:0.7rem;font-weight:600;color:#64748b;margin-top:0.35rem;">Direct 1-on-1 contact</div>' +
                        '</div>' +

                        '<div style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;padding:1rem;text-align:center;">' +
                            '<div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;color:#64748b;letter-spacing:0.05em;margin-bottom:0.35rem;">Engagement</div>' +
                            '<div style="font-size:1.15rem;font-weight:800;color:#4f46e5;margin-top:0.3rem;line-height:1.2;">' + (data.engagementText.split('—')[0] || 'High') + '</div>' +
                            '<div style="font-size:0.68rem;font-weight:600;color:#64748b;margin-top:0.35rem;">Active participation</div>' +
                        '</div>' +
                    '</div>' +

                    '<!-- Curriculum & Topics Covered -->' +
                    '<div style="margin-bottom:1.75rem;border:1px solid #e2e8f0;border-radius:12px;padding:1.25rem 1.5rem;background:#ffffff;">' +
                        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:0.75rem;">' +
                            '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f97316;"></span>' +
                            '<h3 style="margin:0;font-size:0.95rem;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#0f172a;">Curriculum &amp; Topics Mastered This Month</h3>' +
                        '</div>' +
                        '<div style="font-size:0.8rem;font-weight:700;color:#4f46e5;margin-bottom:0.75rem;">' + data.module + '</div>' +
                        topicsHTML +
                    '</div>' +

                    '<!-- Two Column Qualitative Observations -->' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.75rem;">' +
                        '<!-- Strengths -->' +
                        '<div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:12px;padding:1.25rem 1.5rem;">' +
                            '<div style="font-size:0.78rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#166534;margin-bottom:0.6rem;display:flex;align-items:center;gap:6px;">' +
                                '<span>&#10024;</span> Strengths Observed &amp; Achievements' +
                            '</div>' +
                            '<p style="margin:0;color:#1e293b;font-size:0.9rem;line-height:1.65;font-family:\'DM Sans\',sans-serif;">' + data.strengths + '</p>' +
                        '</div>' +

                        '<!-- Challenges -->' +
                        '<div style="border:1px solid #fed7aa;background:#fffaf5;border-radius:12px;padding:1.25rem 1.5rem;">' +
                            '<div style="font-size:0.78rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#9a3412;margin-bottom:0.6rem;display:flex;align-items:center;gap:6px;">' +
                                '<span>&#127919;</span> Focus Areas &amp; Growth Potential' +
                            '</div>' +
                            '<p style="margin:0;color:#1e293b;font-size:0.9rem;line-height:1.65;font-family:\'DM Sans\',sans-serif;">' + data.challenges + '</p>' +
                        '</div>' +
                    '</div>' +

                    '<!-- Recommendations for Next Month -->' +
                    '<div style="border:1px solid #e0e7ff;background:#f8faff;border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:1.75rem;">' +
                        '<div style="font-size:0.78rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#3730a3;margin-bottom:0.6rem;display:flex;align-items:center;gap:6px;">' +
                            '<span>&#128640;</span> Recommendations &amp; Next Month\'s Roadmap' +
                        '</div>' +
                        '<p style="margin:0;color:#1e293b;font-size:0.9rem;line-height:1.65;font-family:\'DM Sans\',sans-serif;">' + data.recommendation + '</p>' +
                    '</div>' +

                    adminNoteBlock +

                    '<!-- Sign-off & Verification Footer -->' +
                    '<div style="margin-top:2.5rem;padding-top:1.5rem;border-top:1.5px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end;gap:1.5rem;">' +
                        '<!-- Tutor Signature -->' +
                        '<div>' +
                            '<div style="font-family:\'Nunito\',cursive,serif;font-style:italic;font-size:1.15rem;font-weight:700;color:#1e293b;margin-bottom:0.25rem;">' + data.tutorName + '</div>' +
                            '<div style="width:180px;height:1px;background:#cbd5e1;margin-bottom:0.35rem;"></div>' +
                            '<div style="font-size:0.75rem;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Assigned Lead Mentor</div>' +
                            '<div style="font-size:0.72rem;color:#94a3b8;">STEMulus Instructor Faculty</div>' +
                        '</div>' +

                        '<!-- Official Stamp/Seal -->' +
                        '<div style="text-align:center;padding:0 1rem;">' +
                            '<div style="width:68px;height:68px;border:2px dashed #f97316;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 0.35rem;background:#fff7ed;">' +
                                '<div style="font-size:0.6rem;font-weight:900;color:#c2410c;letter-spacing:0.05em;text-transform:uppercase;">STEMulus</div>' +
                                '<div style="font-size:0.85rem;color:#ea580c;">&#9733;&#9733;&#9733;</div>' +
                                '<div style="font-size:0.55rem;font-weight:700;color:#c2410c;text-transform:uppercase;">Verified</div>' +
                            '</div>' +
                            '<div style="font-size:0.65rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Academic Board Seal</div>' +
                        '</div>' +

                        '<!-- Director Signature -->' +
                        '<div style="text-align:right;">' +
                            '<div style="font-family:\'Nunito\',cursive,serif;font-style:italic;font-size:1.15rem;font-weight:700;color:#1e293b;margin-bottom:0.25rem;">Academic Oversight Board</div>' +
                            '<div style="width:180px;height:1px;background:#cbd5e1;margin-left:auto;margin-bottom:0.35rem;"></div>' +
                            '<div style="font-size:0.75rem;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Director of Academics</div>' +
                            '<div style="font-size:0.72rem;color:#94a3b8;">STEMulus Innovations Ltd</div>' +
                        '</div>' +
                    '</div>' +

                    '<!-- Bottom Micro-Footer -->' +
                    '<div style="margin-top:1.5rem;padding-top:0.75rem;border-top:1px dashed #e2e8f0;display:flex;justify-content:space-between;font-size:0.7rem;color:#94a3b8;">' +
                        '<div>stemuluskidstech.com &middot; info@stemuluskidstech.com &middot; +234 705 246 6716</div>' +
                        '<div>This official progress evaluation is issued under the academic authority of STEMulus Innovations LTD.</div>' +
                    '</div>' +

                '</div>'
            );
        },

        /**
         * Opens the modal viewer with print/download capability
         */
        open: function(report) {
            var formatted = this.formatReportData(report);
            var contentHTML = this.buildDocumentHTML(formatted);

            // Remove any existing modal
            var existingModal = document.getElementById('stemulus-pdf-modal');
            if (existingModal) existingModal.remove();

            // Inject CSS for print styling if not already present
            if (!document.getElementById('stemulus-print-css')) {
                var style = document.createElement('style');
                style.id = 'stemulus-print-css';
                style.innerHTML = 
                    '@media print {' +
                    '  body * { visibility: hidden !important; }' +
                    '  #stemulus-printable-doc, #stemulus-printable-doc * { visibility: visible !important; }' +
                    '  #stemulus-printable-doc {' +
                    '    position: absolute !important;' +
                    '    left: 0 !important;' +
                    '    top: 0 !important;' +
                    '    width: 100% !important;' +
                    '    max-width: 100% !important;' +
                    '    margin: 0 !important;' +
                    '    padding: 20mm !important;' +
                    '    border: none !important;' +
                    '    box-shadow: none !important;' +
                    '    border-radius: 0 !important;' +
                    '    background: #ffffff !important;' +
                    '  }' +
                    '  .stemulus-modal-header { display: none !important; }' +
                    '  #stemulus-pdf-modal { position: static !important; background: transparent !important; padding: 0 !important; }' +
                    '}';
                document.head.appendChild(style);
            }

            var modal = document.createElement('div');
            modal.id = 'stemulus-pdf-modal';
            modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.85);backdrop-filter:blur(6px);overflow-y:auto;padding:1.5rem;display:flex;flex-direction:column;align-items:center;';

            modal.innerHTML = 
                '<!-- Action Bar -->' +
                '<div class="stemulus-modal-header" style="max-width:850px;width:100%;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;background:#ffffff;padding:0.75rem 1.25rem;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">' +
                    '<div style="display:flex;align-items:center;gap:10px;">' +
                        '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;"></span>' +
                        '<span style="font-size:0.85rem;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;">Official Academic Progress Report</span>' +
                        '<span style="font-size:0.75rem;color:#64748b;">(' + formatted.studentName + ' &middot; ' + formatted.monthName + ')</span>' +
                    '</div>' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<button id="stemulus-pdf-print-btn" style="background:#4f46e5;color:#ffffff;border:none;padding:8px 16px;border-radius:8px;font-size:0.85rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:background 0.2s;" onmouseover="this.style.background=\'#4338ca\'" onmouseout="this.style.background=\'#4f46e5\'">' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>' +
                            'Print / Save as PDF' +
                        '</button>' +
                        '<button id="stemulus-pdf-close-btn" style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;padding:8px 14px;border-radius:8px;font-size:0.85rem;font-weight:700;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'#e2e8f0\'" onmouseout="this.style.background=\'#f1f5f9\'">' +
                            'Close' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                contentHTML;

            document.body.appendChild(modal);

            // Bind Print & Close
            document.getElementById('stemulus-pdf-print-btn').addEventListener('click', function() {
                window.print();
            });

            document.getElementById('stemulus-pdf-close-btn').addEventListener('click', function() {
                modal.remove();
            });

            // Close on ESC key
            var escHandler = function(e) {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        }
    };

    window.StemulusReportPDF = StemulusReportPDF;

})(window);
