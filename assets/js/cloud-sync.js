/**
 * STEMulus CloudSync Utility
 * Acts as a bridge between the local app and Firebase Services.
 */

const CloudSync = (function() {
    /**
     * Submit a lead/contact form to Firestore
     * @param {string} collection - The Firestore collection name
     * @param {object} data - The form data
     */
    /**
     * Submit a lead/contact form to Supabase
     * @param {string} table - The Supabase table name
     * @param {object} data - The form data
     */
    async function submitToCloud(table, data) {
        if (typeof supabase === 'undefined') {
            console.warn("[STEMulus] Supabase not initialized. Skipping cloud sync.");
            return false;
        }

        try {
            const { error } = await supabase.from(table).insert([{
                ...data,
                timestamp: new Date().toISOString(),
                domain: window.location.hostname
            }]);

            if (error) throw error;

            console.log(`[STEMulus] Data synced to ${table} ☁️`);
            return true;
        } catch (error) {
            console.error("[STEMulus] Cloud Sync Error:", error);
            return false;
        }
    }

    /**
     * Real-time listener for content (Blogs, Announcements)
     * Note: For simplicity, this currently just fetches once. 
     * Full realtime subscription would require cleanup logic handling.
     */
    async function listenToContent(table, callback) {
        if (typeof supabase === 'undefined') return;

        // Initial fetch
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('timestamp', { ascending: false });
        
        if (!error && data) {
            callback(data);
        }

        // Optional: Subscribe to changes (simplified)
        supabase
            .channel('public:' + table)
            .on('postgres_changes', { event: '*', schema: 'public', table: table }, async () => {
                 const { data: newData } = await supabase
                    .from(table)
                    .select('*')
                    .order('timestamp', { ascending: false });
                 if(newData) callback(newData);
            })
            .subscribe();
    }

    return { submitToCloud, listenToContent };
})();
