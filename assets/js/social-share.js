/**
 * STEMulus Social Share Component
 * Features: Floating sidebar (desktop), Bottom bar (mobile), One-click sharing
 */

document.addEventListener('DOMContentLoaded', () => {
    const shareConfig = {
        title: document.title,
        url: window.location.href,
        text: "Check out this amazing coding academy for kids!"
    };

    const sharePlatforms = [
        {
            name: 'WhatsApp',
            icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" class="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
            color: '#25D366',
            isLucide: false,
            url: `https://wa.me/?text=${encodeURIComponent(shareConfig.text + ' ' + shareConfig.url)}`
        },
        {
            name: 'X',
            icon: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M4 4l11.733 16h4.267l-11.733 -16z" style="fill: currentColor; stroke: none;"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>`,
            color: '#000000',
            isLucide: false,
            url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareConfig.url)}&text=${encodeURIComponent(shareConfig.text)}`
        },
        {
            name: 'Facebook',
            icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" class="w-5 h-5"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.956-2.971 3.594v.496h3.8l-.543 3.667h-3.257v7.98h-4.845z"/></svg>`,
            color: '#1877F2',
            isLucide: false,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareConfig.url)}`
        }
    ];

    const shareContainerHTML = `
        <!-- Desktop Sidebar -->
        <div class="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 z-[90] flex-col space-y-4">
            ${sharePlatforms.map(p => `
                <a href="${p.url}" target="_blank" title="Share on ${p.name}"
                    class="group relative w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-100 transition-all hover:scale-110 hover:-translate-y-1">
                    ${p.isLucide 
                        ? `<i data-lucide="${p.icon}" class="w-5 h-5" style="color: ${p.color}"></i>`
                        : `<div style="color: ${p.color}" class="flex items-center justify-center">${p.icon}</div>`
                    }
                    <span class="absolute left-16 bg-cosmic-blue text-white text-xs py-1 px-3 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                        Share on ${p.name}
                    </span>
                </a>
            `).join('')}
        </div>

        <!-- Mobile Bottom Bar -->
        <div class="lg:hidden fixed bottom-32 right-6 z-[90] flex flex-col space-y-3 items-end">
             <button id="mobile-share-toggle" class="w-14 h-14 bg-supernova-orange text-white rounded-full shadow-2xl flex items-center justify-center transform active:scale-95 transition-all">
                <i data-lucide="share-2" class="w-6 h-6"></i>
             </button>
             <div id="mobile-share-menu" class="hidden flex flex-col space-y-3 mb-2">
                ${sharePlatforms.map(p => `
                    <a href="${p.url}" target="_blank" 
                        class="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center border border-gray-100 transform translate-y-10 opacity-0 transition-all">
                        ${p.isLucide 
                            ? `<i data-lucide="${p.icon}" class="w-5 h-5" style="color: ${p.color}"></i>`
                            : `<div style="color: ${p.color}" class="flex items-center justify-center">${p.icon}</div>`
                        }
                    </a>
                `).reverse().join('')}
             </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', shareContainerHTML);
    lucide.createIcons();

    const mobileToggle = document.getElementById('mobile-share-toggle');
    const mobileMenu = document.getElementById('mobile-share-menu');
    const mobileLinks = mobileMenu.querySelectorAll('a');

    let isMenuOpen = false;

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                mobileMenu.classList.remove('hidden');
                mobileToggle.classList.add('rotate-45');
                mobileLinks.forEach((link, i) => {
                    setTimeout(() => {
                        link.classList.remove('translate-y-10', 'opacity-0');
                        link.classList.add('translate-y-0', 'opacity-100');
                    }, i * 100);
                });
            } else {
                mobileToggle.classList.remove('rotate-45');
                mobileLinks.forEach((link, i) => {
                    link.classList.add('translate-y-10', 'opacity-0');
                    link.classList.remove('translate-y-0', 'opacity-100');
                });
                setTimeout(() => mobileMenu.classList.add('hidden'), 300);
            }
        });
    }
});
