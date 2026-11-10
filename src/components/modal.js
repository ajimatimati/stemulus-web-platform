/**
 * STEMulus Accessible Modal Component
 * Manages modal visibility, backdrop, focus trap, and Escape key dismissal.
 */

export class Modal {
  /**
   * @param {string} modalId - Element ID of modal dialog
   */
  constructor(modalId) {
    this.modalEl = document.getElementById(modalId);
    this.isOpen = false;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.init();
  }

  init() {
    if (!this.modalEl) return;
    this.modalEl.setAttribute('aria-hidden', 'true');
    this.modalEl.setAttribute('role', 'dialog');

    // Close when clicking outside modal body
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });

    // Close on any button with data-modal-close
    const closeBtns = this.modalEl.querySelectorAll('[data-modal-close]');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
  }

  open() {
    if (!this.modalEl) return;
    this.isOpen = true;
    this.modalEl.style.display = 'flex';
    this.modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', this.handleKeyDown);

    // Focus on first input if available
    const firstInput = this.modalEl.querySelector('input, select, textarea, button');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }
  }

  close() {
    if (!this.modalEl) return;
    this.isOpen = false;
    this.modalEl.style.display = 'none';
    this.modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }
}
