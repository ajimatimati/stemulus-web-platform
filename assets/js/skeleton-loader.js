/**
 * STEMulus Skeleton Loader
 * Creates loading skeleton states for better perceived performance
 */

const SkeletonLoader = (function() {
    'use strict';

    // Skeleton CSS styles
    const skeletonStyles = `
        .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.5s infinite;
            border-radius: 8px;
        }
        
        .dark .skeleton {
            background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
            background-size: 200% 100%;
        }
        
        @keyframes skeleton-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        .skeleton-text {
            height: 1em;
            margin-bottom: 0.5em;
        }
        
        .skeleton-text-sm { height: 0.875em; }
        .skeleton-text-lg { height: 1.25em; }
        .skeleton-text-xl { height: 1.5em; }
        
        .skeleton-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
        }
        
        .skeleton-card {
            padding: 1.5rem;
            border-radius: 1rem;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        
        .dark .skeleton-card {
            background: #1f2937;
        }
        
        .skeleton-image {
            width: 100%;
            height: 200px;
            border-radius: 8px;
        }
        
        .skeleton-button {
            height: 44px;
            width: 120px;
            border-radius: 12px;
        }
        
        /* Hide skeleton when content is loaded */
        .skeleton-container.loaded .skeleton {
            display: none;
        }
        
        .skeleton-container .skeleton-content {
            display: none;
        }
        
        .skeleton-container.loaded .skeleton-content {
            display: block;
        }
    `;

    // Inject skeleton styles
    function injectStyles() {
        if (document.getElementById('skeleton-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'skeleton-styles';
        style.textContent = skeletonStyles;
        document.head.appendChild(style);
    }

    // Create skeleton element
    function createSkeleton(type, options = {}) {
        const el = document.createElement('div');
        el.className = `skeleton skeleton-${type}`;
        
        if (options.width) el.style.width = options.width;
        if (options.height) el.style.height = options.height;
        
        return el;
    }

    // Create skeleton card
    function createSkeletonCard() {
        const card = document.createElement('div');
        card.className = 'skeleton-card';
        card.innerHTML = `
            <div class="skeleton skeleton-image" style="margin-bottom: 1rem;"></div>
            <div class="skeleton skeleton-text skeleton-text-lg" style="width: 70%;"></div>
            <div class="skeleton skeleton-text" style="width: 100%;"></div>
            <div class="skeleton skeleton-text" style="width: 85%;"></div>
            <div class="skeleton skeleton-button" style="margin-top: 1rem;"></div>
        `;
        return card;
    }

    // Create skeleton testimonial
    function createSkeletonTestimonial() {
        const testimonial = document.createElement('div');
        testimonial.className = 'skeleton-card';
        testimonial.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div class="skeleton skeleton-avatar"></div>
                <div style="flex: 1;">
                    <div class="skeleton skeleton-text" style="width: 60%;"></div>
                    <div class="skeleton skeleton-text-sm" style="width: 40%;"></div>
                </div>
            </div>
            <div class="skeleton skeleton-text" style="width: 100%;"></div>
            <div class="skeleton skeleton-text" style="width: 90%;"></div>
            <div class="skeleton skeleton-text" style="width: 75%;"></div>
        `;
        return testimonial;
    }

    // Replace element with skeleton while loading
    function showSkeleton(container, type = 'card', count = 1) {
        container.classList.add('skeleton-container');
        
        const skeletonWrapper = document.createElement('div');
        skeletonWrapper.className = 'skeleton-wrapper';
        
        for (let i = 0; i < count; i++) {
            if (type === 'card') {
                skeletonWrapper.appendChild(createSkeletonCard());
            } else if (type === 'testimonial') {
                skeletonWrapper.appendChild(createSkeletonTestimonial());
            } else {
                skeletonWrapper.appendChild(createSkeleton(type));
            }
        }
        
        container.insertBefore(skeletonWrapper, container.firstChild);
        
        return skeletonWrapper;
    }

    // Hide skeleton and show content
    function hideSkeleton(container) {
        container.classList.add('loaded');
        const wrapper = container.querySelector('.skeleton-wrapper');
        if (wrapper) {
            wrapper.remove();
        }
    }

    // Auto-apply skeletons to lazy-loaded images
    function initImageSkeletons() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        images.forEach((img) => {
            if (img.complete) return;
            
            // Create skeleton placeholder
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton';
            skeleton.style.width = img.width ? `${img.width}px` : '100%';
            skeleton.style.height = img.height ? `${img.height}px` : '200px';
            skeleton.style.position = 'absolute';
            skeleton.style.top = '0';
            skeleton.style.left = '0';
            
            // Wrap image
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(skeleton);
            wrapper.appendChild(img);
            
            // Remove skeleton when image loads
            img.addEventListener('load', () => {
                skeleton.remove();
            });
            
            img.addEventListener('error', () => {
                skeleton.remove();
            });
        });
    }

    // Initialize
    function init() {
        injectStyles();
        
        // Apply image skeletons after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initImageSkeletons);
        } else {
            initImageSkeletons();
        }
    }

    // Public API
    return {
        init,
        show: showSkeleton,
        hide: hideSkeleton,
        create: createSkeleton,
        createCard: createSkeletonCard,
        createTestimonial: createSkeletonTestimonial
    };
})();

// Auto-initialize
SkeletonLoader.init();
console.log('Skeleton: Loader initialized');
