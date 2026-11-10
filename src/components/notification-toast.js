/**
 * STEMulus Accessible Toast Notification Component
 * Displays non-blocking floating alerts for feedback.
 */

let containerEl = null;

function ensureContainer() {
  if (!containerEl || !document.body.contains(containerEl)) {
    containerEl = document.createElement('div');
    containerEl.id = 'stemulus-toast-shelf';
    containerEl.setAttribute('aria-live', 'polite');
    containerEl.setAttribute('role', 'region');
    containerEl.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: 380px;
      width: 90%;
    `;
    document.body.appendChild(containerEl);
  }
  return containerEl;
}

/**
 * Shows a toast alert.
 * @param {string} message 
 * @param {'success'|'error'|'warning'|'info'} type 
 * @param {number} durationMs 
 */
export function showToast(message, type = 'info', durationMs = 4000) {
  if (typeof document === 'undefined') return;
  const container = ensureContainer();

  const toast = document.createElement('div');
  toast.style.cssText = `
    pointer-events: auto;
    padding: 14px 18px;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 0;
    transform: translateY(-10px) scale(0.96);
  `;

  if (type === 'success') {
    toast.style.background = '#065F46';
    toast.style.color = '#ECFDF5';
    toast.style.border = '1px solid #10B981';
  } else if (type === 'error') {
    toast.style.background = '#991B1B';
    toast.style.color = '#FEF2F2';
    toast.style.border = '1px solid #EF4444';
  } else if (type === 'warning') {
    toast.style.background = '#92400E';
    toast.style.color = '#FFFBEB';
    toast.style.border = '1px solid #F59E0B';
  } else {
    toast.style.background = '#1E293B';
    toast.style.color = '#F8FAFC';
    toast.style.border = '1px solid #334155';
  }

  toast.textContent = message;
  container.appendChild(toast);

  // Animate entry
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0) scale(1)';
  });

  // Auto dismiss
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px) scale(0.96)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, durationMs);
}
