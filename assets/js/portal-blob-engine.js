/**
 * STEMulus Portal Blob Engine
 * Handles dynamic color shifting, 3D prop morphing, and split-panel logic
 */

const PortalBlobEngine = {
    // Stage colors map (matches CSS variables)
    colors: {
        parent: ['#4FC3F7', '#66BB6A'], // Sky Blue to Mint
        tutor:  ['#AB47BC', '#5C6BC0'], // Lavender to Indigo
        admin:  ['#26A69A', '#EC407A']  // Teal to Rose
    },

    // 3D prop map for login screen
    heroes: {
        parent: 'images/portal/avatar-girl-3d.jpeg',
        tutor:  'images/portal/avatar-boy-3d.jpeg',  // Or graduation cap if we had one
        admin:  'images/portal/admin-shield-3d.jpeg'
    },

    init: function() {
        this.blobBg = document.getElementById('blob-bg');
        this.blobHeadline = document.getElementById('blob-headline');
        this.heroImage = document.getElementById('blob-hero-img');
        
        // Initial setup based on current tab if on login page
        const activeRole = document.getElementById('login-role')?.value || 'parent';
        this.switchRoleContext(activeRole, true);
    },

    switchRoleContext: function(role, immediate = false) {
        if(!this.blobBg) return;

        // 1. Update gradient colors via CSS custom properties on the blob element
        const [color1, color2] = this.colors[role];
        this.blobBg.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;

        // 2. Update Headline
        if(this.blobHeadline) {
            const roleName = role.charAt(0).toUpperCase() + role.slice(1);
            
            // Animate out
            if(!immediate) this.blobHeadline.style.opacity = '0';
            
            setTimeout(() => {
                this.blobHeadline.innerHTML = `Welcome back,<br>${roleName}`;
                if(!immediate) this.blobHeadline.style.opacity = '1';
            }, immediate ? 0 : 300);
        }

        // 3. Update Hero 3D Prop
        if(this.heroImage) {
            if(!immediate) {
                this.heroImage.style.transform = 'translateY(20px) scale(0.9)';
                this.heroImage.style.opacity = '0';
            }
            
            setTimeout(() => {
                this.heroImage.src = this.heroes[role];
                if(!immediate) {
                    this.heroImage.style.transform = 'translateY(0) scale(1)';
                    this.heroImage.style.opacity = '1';
                }
            }, immediate ? 0 : 400);
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    PortalBlobEngine.init();
});
