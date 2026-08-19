/**
 * =========================================================================
 * CONFIG.example.js - Template Konfigurasi Frontend
 * =========================================================================
 * Salin file ini menjadi config.js pada production frontend Anda
 * dan isi dengan URL Google Apps Script Web App yang telah di-deploy.
 */

const APP_CONFIG = {
  // Mode: 'demo' (menggunakan local/in-memory dummy data) atau 'live' (Google Apps Script API)
  MODE: 'demo',

  // Google Apps Script Web App Deployment URL
  // Contoh: 'https://script.google.com/macros/s/AKfycbx.../exec'
  API_URL: '',

  // Identitas Aplikasi
  APP_NAME: 'Aplikasi Manajemen Guru',
  VERSION: '1.0.0',

  // Pengaturan default
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_THEME: 'light'
};

// Export untuk lingkungan modular jika diperlukan
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}
