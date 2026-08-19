/**
 * =========================================================================
 * Code.gs - Entry Point Google Apps Script Web App
 * =========================================================================
 * Menangani HTTP GET (doGet) dan HTTP POST (doPost).
 */

/**
 * Handler untuk HTTP GET Request
 * Digunakan untuk health check, read data, query sederhana
 */
function doGet(e) {
  try {
    return Router.handleGet(e);
  } catch (error) {
    return Utils.jsonError('Terjadi kesalahan pada server (GET)', error.message || error);
  }
}

/**
 * Handler untuk HTTP POST Request
 * Digunakan untuk Create, Read, Update, Delete via payload JSON
 */
function doPost(e) {
  try {
    return Router.handlePost(e);
  } catch (error) {
    return Utils.jsonError('Terjadi kesalahan pada server (POST)', error.message || error);
  }
}
