/**
 * STEMulus Form Validation
 * Real-time inline validation with animated error messages
 */

const FormValidation = (function() {
    'use strict';

    // Validation CSS
    const validationStyles = `
        /* Input states */
        .form-input {
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        
        .form-input.is-valid {
            border-color: #10b981 !important;
        }
        
        .form-input.is-invalid {
            border-color: #ef4444 !important;
        }
        
        .form-input.is-invalid:focus {
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
        }
        
        /* Error message */
        .form-error {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            color: #ef4444;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            opacity: 0;
            transform: translateY(-5px);
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        
        .form-error.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .form-error svg {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
        }
        
        /* Success checkmark */
        .form-success-icon {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #10b981;
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        
        .form-input.is-valid ~ .form-success-icon {
            opacity: 1;
        }
        
        /* Input wrapper */
        .form-field {
            position: relative;
        }
        
        /* Character counter */
        .char-counter {
            font-size: 0.75rem;
            color: #9ca3af;
            text-align: right;
            margin-top: 0.25rem;
        }
        
        .char-counter.limit-near {
            color: #f59e0b;
        }
        
        .char-counter.limit-reached {
            color: #ef4444;
        }
        
        /* Password strength */
        .password-strength {
            margin-top: 0.5rem;
        }
        
        .password-strength-bar {
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            overflow: hidden;
        }
        
        .password-strength-fill {
            height: 100%;
            transition: width 0.3s ease, background-color 0.3s ease;
        }
        
        .password-strength-text {
            font-size: 0.75rem;
            margin-top: 0.25rem;
        }
        
        /* Email suggestions */
        .email-suggestion {
            font-size: 0.75rem;
            color: #6b7280;
            margin-top: 0.25rem;
        }
        
        .email-suggestion button {
            color: #3b82f6;
            text-decoration: underline;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
        }
    `;

    // Common email domains for suggestions
    const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

    // Validation rules
    const validators = {
        required: (value) => {
            if (!value || value.trim() === '') {
                return 'This field is required';
            }
            return null;
        },
        
        email: (value) => {
            if (!value) return null;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
            }
            return null;
        },
        
        phone: (value) => {
            if (!value) return null;
            const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                return 'Please enter a valid phone number';
            }
            return null;
        },
        
        minLength: (min) => (value) => {
            if (!value) return null;
            if (value.length < min) {
                return `Must be at least ${min} characters`;
            }
            return null;
        },
        
        maxLength: (max) => (value) => {
            if (!value) return null;
            if (value.length > max) {
                return `Must be no more than ${max} characters`;
            }
            return null;
        },
        
        name: (value) => {
            if (!value) return null;
            if (value.trim().split(' ').length < 2) {
                return 'Please enter your full name';
            }
            return null;
        },
        
        age: (min, max) => (value) => {
            if (!value) return null;
            const age = parseInt(value);
            if (isNaN(age) || age < min || age > max) {
                return `Age must be between ${min} and ${max}`;
            }
            return null;
        }
    };

    // Inject styles
    function injectStyles() {
        if (document.getElementById('form-validation-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'form-validation-styles';
        style.textContent = validationStyles;
        document.head.appendChild(style);
    }

    // Create error message element
    function createErrorElement() {
        const error = document.createElement('div');
        error.className = 'form-error';
        error.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span></span>
        `;
        return error;
    }

    // Show error
    function showError(input, message) {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        
        let errorEl = input.parentElement.querySelector('.form-error');
        if (!errorEl) {
            errorEl = createErrorElement();
            input.parentElement.appendChild(errorEl);
        }
        
        errorEl.querySelector('span').textContent = message;
        requestAnimationFrame(() => errorEl.classList.add('show'));
        
        // Shake effect
        if (typeof MicroInteractions !== 'undefined') {
            MicroInteractions.shake(input);
        }
    }

    // Hide error
    function hideError(input) {
        input.classList.remove('is-invalid');
        
        const errorEl = input.parentElement.querySelector('.form-error');
        if (errorEl) {
            errorEl.classList.remove('show');
        }
    }

    // Mark as valid
    function markValid(input) {
        hideError(input);
        input.classList.add('is-valid');
    }

    // Validate single input
    function validateInput(input) {
        const rules = (input.dataset.validate || '').split('|').filter(Boolean);
        const value = input.value;
        
        for (const rule of rules) {
            let validator;
            let error;
            
            if (rule === 'required') {
                error = validators.required(value);
            } else if (rule === 'email') {
                error = validators.email(value);
            } else if (rule === 'phone') {
                error = validators.phone(value);
            } else if (rule === 'name') {
                error = validators.name(value);
            } else if (rule.startsWith('min:')) {
                const min = parseInt(rule.split(':')[1]);
                error = validators.minLength(min)(value);
            } else if (rule.startsWith('max:')) {
                const max = parseInt(rule.split(':')[1]);
                error = validators.maxLength(max)(value);
            } else if (rule.startsWith('age:')) {
                const [min, max] = rule.split(':')[1].split('-').map(Number);
                error = validators.age(min, max)(value);
            }
            
            if (error) {
                showError(input, error);
                return false;
            }
        }
        
        if (value) {
            markValid(input);
        } else {
            hideError(input);
            input.classList.remove('is-valid');
        }
        
        return true;
    }

    // Email domain suggestion
    function checkEmailSuggestion(input) {
        const value = input.value;
        if (!value.includes('@')) return;
        
        const [localPart, domain] = value.split('@');
        if (!domain) return;
        
        // Find similar domain
        for (const correctDomain of emailDomains) {
            const distance = levenshteinDistance(domain.toLowerCase(), correctDomain);
            if (distance > 0 && distance <= 2) {
                showEmailSuggestion(input, localPart, correctDomain);
                return;
            }
        }
        
        // Remove suggestion if exists
        const suggestionEl = input.parentElement.querySelector('.email-suggestion');
        if (suggestionEl) suggestionEl.remove();
    }

    // Show email suggestion
    function showEmailSuggestion(input, localPart, correctDomain) {
        let suggestionEl = input.parentElement.querySelector('.email-suggestion');
        if (!suggestionEl) {
            suggestionEl = document.createElement('div');
            suggestionEl.className = 'email-suggestion';
            input.parentElement.appendChild(suggestionEl);
        }
        
        const suggestion = `${localPart}@${correctDomain}`;
        suggestionEl.innerHTML = `Did you mean <button type="button">${suggestion}</button>?`;
        
        suggestionEl.querySelector('button').addEventListener('click', () => {
            input.value = suggestion;
            validateInput(input);
            suggestionEl.remove();
        });
    }

    // Levenshtein distance for typo detection
    function levenshteinDistance(a, b) {
        const matrix = [];
        
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[b.length][a.length];
    }

    // Initialize form validation
    function initForm(formSelector) {
        const form = document.querySelector(formSelector);
        if (!form) return;
        
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach((input) => {
            // Skip wrapping for radios, checkboxes, and hidden inputs to preserve DOM structure for custom UIs
            if (input.type === 'radio' || input.type === 'checkbox' || input.type === 'hidden' || input.classList.contains('sr-only')) {
                return;
            }

            // Wrap in form-field if not already
            if (!input.parentElement.classList.contains('form-field')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'form-field';
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);
            }
            
            input.classList.add('form-input');
            
            // Validate on blur
            input.addEventListener('blur', () => validateInput(input));
            
            // Clear error on input
            input.addEventListener('input', () => {
                if (input.classList.contains('is-invalid')) {
                    hideError(input);
                }
                
                // Email suggestion
                if (input.type === 'email') {
                    checkEmailSuggestion(input);
                }
            });
        });
        
        // Validate on submit
        form.addEventListener('submit', (e) => {
            let isValid = true;
            
            inputs.forEach((input) => {
                if (!validateInput(input)) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                
                // Focus first invalid input
                const firstInvalid = form.querySelector('.is-invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                }
            }
        });
    }

    // Auto-init all forms with data-validate attribute
    function init() {
        injectStyles();
        
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
            if (!form.id) form.id = `form-${index}`;
            initForm(`#${form.id}`);
        });
    }

    // Public API
    return {
        init,
        initForm,
        validate: validateInput,
        showError,
        hideError,
        validators
    };
})();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', FormValidation.init);
} else {
    FormValidation.init();
}
console.log('Forms: Validation initialized');
