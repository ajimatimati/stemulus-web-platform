/**
 * STEMulus Success Feedback
 * Celebratory animations for form submissions
 */

const SuccessFeedback = (function() {
    'use strict';

    // CSS for success animations
    const successStyles = `
        /* Confetti animation */
        .confetti-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        }
        
        .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            opacity: 0;
            animation: confetti-fall 3s ease-out forwards;
        }
        
        @keyframes confetti-fall {
            0% {
                opacity: 1;
                transform: translateY(-100px) rotate(0deg);
            }
            100% {
                opacity: 0;
                transform: translateY(100vh) rotate(720deg);
            }
        }
        
        /* Success checkmark */
        .success-checkmark {
            width: 80px;
            height: 80px;
            margin: 0 auto;
        }
        
        .success-checkmark .check-icon {
            width: 80px;
            height: 80px;
            position: relative;
            border-radius: 50%;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            animation: checkmark-scale 0.3s ease-out;
        }
        
        .success-checkmark .check-icon::before {
            content: '';
            position: absolute;
            width: 35px;
            height: 18px;
            border-left: 4px solid white;
            border-bottom: 4px solid white;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -60%) rotate(-45deg);
            animation: checkmark-draw 0.3s ease-out 0.3s forwards;
            opacity: 0;
        }
        
        @keyframes checkmark-scale {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        @keyframes checkmark-draw {
            to { opacity: 1; }
        }
        
        /* Success toast notification */
        .success-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: white;
            border-radius: 12px;
            padding: 16px 24px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            transform: translateY(100px);
            opacity: 0;
            animation: toast-slide-in 0.5s ease forwards;
        }
        
        .dark .success-toast {
            background: #1f2937;
            color: white;
        }
        
        @keyframes toast-slide-in {
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        .success-toast.hiding {
            animation: toast-slide-out 0.3s ease forwards;
        }
        
        @keyframes toast-slide-out {
            to {
                transform: translateY(100px);
                opacity: 0;
            }
        }
        
        .success-toast-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #10b981;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .success-toast-icon svg {
            width: 18px;
            height: 18px;
            color: white;
        }
        
        .success-toast-content h4 {
            font-weight: 600;
            font-size: 14px;
            color: #111827;
            margin: 0;
        }
        
        .dark .success-toast-content h4 {
            color: white;
        }
        
        .success-toast-content p {
            font-size: 13px;
            color: #6b7280;
            margin: 4px 0 0;
        }
        
        .success-toast-close {
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            padding: 4px;
            margin-left: 8px;
        }
        
        .success-toast-close:hover {
            color: #6b7280;
        }
        
        /* Success modal */
        .success-modal {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            animation: modal-fade-in 0.3s ease forwards;
        }
        
        @keyframes modal-fade-in {
            to { opacity: 1; }
        }
        
        .success-modal-content {
            background: white;
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            transform: scale(0.9);
            animation: modal-scale-in 0.3s ease forwards;
        }
        
        .dark .success-modal-content {
            background: #1f2937;
        }
        
        @keyframes modal-scale-in {
            to { transform: scale(1); }
        }
        
        .success-modal h2 {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin: 24px 0 8px;
        }
        
        .dark .success-modal h2 {
            color: white;
        }
        
        .success-modal p {
            color: #6b7280;
            margin: 0 0 24px;
        }
        
        .success-modal-btn {
            background: linear-gradient(135deg, #FF6D00 0%, #FF8F00 100%);
            color: white;
            font-weight: 600;
            padding: 12px 32px;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .success-modal-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(255, 109, 0, 0.3);
        }
    `;

    // Confetti colors
    const confettiColors = ['#FF6D00', '#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'];

    // Inject styles
    function injectStyles() {
        if (document.getElementById('success-feedback-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'success-feedback-styles';
        style.textContent = successStyles;
        document.head.appendChild(style);
    }

    // Create confetti effect
    function showConfetti(duration = 3000) {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);
        
        const confettiCount = 100;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
            
            // Random shapes
            const shapes = ['circle', 'square', 'triangle'];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            
            if (shape === 'circle') {
                confetti.style.borderRadius = '50%';
            } else if (shape === 'triangle') {
                confetti.style.width = '0';
                confetti.style.height = '0';
                confetti.style.backgroundColor = 'transparent';
                confetti.style.borderLeft = '5px solid transparent';
                confetti.style.borderRight = '5px solid transparent';
                confetti.style.borderBottom = `10px solid ${confettiColors[Math.floor(Math.random() * confettiColors.length)]}`;
            }
            
            container.appendChild(confetti);
        }
        
        setTimeout(() => container.remove(), duration);
    }

    // Show success toast
    function showToast(title, message, duration = 5000) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <div class="success-toast-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <div class="success-toast-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="success-toast-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        const closeBtn = toast.querySelector('.success-toast-close');
        closeBtn.addEventListener('click', () => hideToast(toast));
        
        if (duration > 0) {
            setTimeout(() => hideToast(toast), duration);
        }
        
        return toast;
    }

    // Hide toast
    function hideToast(toast) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }

    // Show success modal
    function showModal(title, message, buttonText = 'Got it!', onClose = null) {
        const modal = document.createElement('div');
        modal.className = 'success-modal';
        modal.innerHTML = `
            <div class="success-modal-content">
                <div class="success-checkmark">
                    <div class="check-icon"></div>
                </div>
                <h2>${title}</h2>
                <p>${message}</p>
                <button class="success-modal-btn">${buttonText}</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        showConfetti();
        
        const btn = modal.querySelector('.success-modal-btn');
        btn.addEventListener('click', () => {
            modal.remove();
            if (onClose) onClose();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                if (onClose) onClose();
            }
        });
        
        return modal;
    }

    // Quick success feedback
    function celebrate(type = 'confetti') {
        switch (type) {
            case 'confetti':
                showConfetti();
                break;
            case 'toast':
                showToast('Success!', 'Your action was completed successfully.');
                break;
            case 'modal':
                showModal('Success!', 'Your action was completed successfully.');
                break;
            case 'all':
                showConfetti();
                showToast('Success!', 'Your action was completed successfully.');
                break;
        }
    }

    // Initialize
    function init() {
        injectStyles();
    }

    // Public API
    return {
        init,
        confetti: showConfetti,
        toast: showToast,
        modal: showModal,
        celebrate
    };
})();

// Auto-initialize
SuccessFeedback.init();
console.log('Success: Feedback animations loaded');
