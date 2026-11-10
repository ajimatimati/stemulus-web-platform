/**
 * STEMulus Certificates & Milestones Feature Service (ES Module)
 * Authoritative business logic for graduation certificates issuance,
 * credential verification, and student milestone badges tracking.
 */

/**
 * Retrieve issued certificates, optionally filtered by student name.
 * @param {string|null} studentName
 * @param {object} db
 * @returns {Array}
 */
export function getCertificates(studentName = null, db = {}) {
  const certs = Array.isArray(db.certificates) ? db.certificates : [];
  if (studentName) {
    const filterLower = String(studentName).toLowerCase().trim();
    return certs.filter(c => {
      if (!c) return false;
      const sName = String(c.student_name || c.studentName || '').toLowerCase().trim();
      return sName.includes(filterLower);
    });
  }
  return certs;
}

/**
 * Issue and register a graduation certificate.
 * @param {object} rawCert
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object}
 */
export function addCertificate(rawCert, db = {}, storageService = null) {
  if (!Array.isArray(db.certificates)) db.certificates = [];
  const cert = Object.assign({}, rawCert);

  cert.id = cert.id || (`cert-${Date.now()}`);
  db.certificates.push(cert);

  const students = Array.isArray(db.students) ? db.students : [];
  const certStudent = students.find(s => {
    if (!s) return false;
    const full = `${s.firstName || ''} ${s.lastName || ''}`.trim();
    return full === cert.student_name || s.firstName === cert.student_name;
  });

  if (certStudent && certStudent.parentEmail) {
    if (!Array.isArray(db.notifications)) db.notifications = [];
    db.notifications.push({
      id: `notif-cert-${Date.now()}`,
      userEmail: certStudent.parentEmail.toLowerCase().trim(),
      title: 'Certificate Issued',
      message: `${cert.student_name} has been awarded: ${cert.program_name || cert.program || 'STEM Program Certification'}. Credential ID: ${cert.credential_id}`,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'certificates', action: 'add', item: cert } }));
  }

  return cert;
}

/**
 * Delete / revoke a certificate by ID or credential ID.
 * @param {string} id
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function deleteCertificate(id, db = {}, storageService = null) {
  if (!Array.isArray(db.certificates)) return false;
  const initialLen = db.certificates.length;
  db.certificates = db.certificates.filter(c => c && c.id !== id && c.credential_id !== id);

  if (db.certificates.length !== initialLen) {
    if (storageService && typeof storageService.save === 'function') {
      storageService.save(db);
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'certificates', action: 'delete', id: id } }));
    }
    return true;
  }

  return false;
}

/**
 * Update certificate details.
 * @param {string} id
 * @param {object} updates
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object|null}
 */
export function updateCertificate(id, updates, db = {}, storageService = null) {
  if (!Array.isArray(db.certificates)) return null;
  const idx = db.certificates.findIndex(c => c && (c.id === id || c.credential_id === id));
  if (idx === -1) return null;

  db.certificates[idx] = Object.assign({}, db.certificates[idx], updates);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'certificates', action: 'update', item: db.certificates[idx] } }));
  }

  return db.certificates[idx];
}

/**
 * Verify certificate authenticity by credential ID or record ID.
 * @param {string} id
 * @param {object} db
 * @returns {object|null}
 */
export function verifyCertificate(id, db = {}) {
  if (!id) return null;
  const cleanId = String(id).trim().toUpperCase();
  const certs = Array.isArray(db.certificates) ? db.certificates : [];

  return certs.find(c => {
    if (!c) return false;
    const matchCred = c.credential_id && String(c.credential_id).trim().toUpperCase() === cleanId;
    const matchId = c.id && String(c.id).trim().toUpperCase() === cleanId;
    return matchCred || matchId;
  }) || null;
}

/**
 * Retrieve milestones for students.
 * @param {object} db
 * @returns {Array}
 */
export function getMilestones(db = {}) {
  return Array.isArray(db.milestones) ? db.milestones : [];
}

/**
 * Record a student milestone.
 * @param {object} rawMilestone
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object}
 */
export function addMilestone(rawMilestone, db = {}, storageService = null) {
  if (!Array.isArray(db.milestones)) db.milestones = [];
  const m = Object.assign({}, rawMilestone);

  m.id = m.id || (`mil-${Date.now()}`);
  db.milestones.push(m);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'milestones', action: 'add', item: m } }));
  }

  return m;
}

/**
 * Update an existing milestone.
 * @param {string} id
 * @param {object} updatedFields
 * @param {object} db
 * @param {object|null} storageService
 * @returns {object|null}
 */
export function updateMilestone(id, updatedFields, db = {}, storageService = null) {
  if (!Array.isArray(db.milestones)) return null;
  const idx = db.milestones.findIndex(m => m && m.id === id);
  if (idx === -1) return null;

  db.milestones[idx] = Object.assign({}, db.milestones[idx], updatedFields);

  if (storageService && typeof storageService.save === 'function') {
    storageService.save(db);
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'milestones', action: 'update', item: db.milestones[idx] } }));
  }

  return db.milestones[idx];
}

/**
 * Delete a milestone.
 * @param {string} id
 * @param {object} db
 * @param {object|null} storageService
 * @returns {boolean}
 */
export function deleteMilestone(id, db = {}, storageService = null) {
  if (!Array.isArray(db.milestones)) return false;
  const idx = db.milestones.findIndex(m => m && m.id === id);
  if (idx !== -1) {
    db.milestones.splice(idx, 1);

    if (storageService && typeof storageService.save === 'function') {
      storageService.save(db);
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('stemulusDbUpdated', { detail: { collection: 'milestones', action: 'delete', id: id } }));
    }

    return true;
  }
  return false;
}

export const CertificateService = {
  getCertificates,
  addCertificate,
  deleteCertificate,
  updateCertificate,
  verifyCertificate,
  getMilestones,
  addMilestone,
  updateMilestone,
  deleteMilestone
};
