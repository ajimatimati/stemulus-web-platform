const WhatsAppNotify = {
  // Production bot URL must be set via window.STEMULUS_BOT_URL before use
  get API_URL() { return window.STEMULUS_BOT_URL || null; },
  get API_KEY() { return (window.STEMULUS_CONFIG && window.STEMULUS_CONFIG.notifyKey) || null; },

  get isConfigured() {
    return Boolean(this.API_URL);
  },

  async sendBookingNotification(data) {
    return this.post('booking', data);
  },

  async sendEnrollmentNotification(data) {
    return this.post('enrollment', data);
  },

  async sendContactNotification(data) {
    return this.post('contact', data);
  },

  async post(type, data) {
    if (!this.isConfigured) {
      return { success: false, error: 'WhatsApp notification service not configured' };
    }
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.API_KEY) { headers['x-api-key'] = this.API_KEY; }
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type, ...data })
      });
      return await response.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
