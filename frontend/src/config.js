/**
 * Central runtime configuration for the AetherFlood frontend.
 *
 * The API base URL comes from Vite's build-time environment so the same bundle
 * can run against a local backend during development and a deployed backend in
 * production. Secrets (for example SARVAM_API_KEY) are never read here - they
 * live only in backend environment variables.
 */

const rawBase = import.meta.env.VITE_API_BASE_URL;

// In Vercel multi-service deployment, frontend and backend share the same project domain.
// When VITE_API_BASE_URL is unset or empty in production, use relative paths ('').
// In local development, default to 'http://127.0.0.1:8000'.
export const API_BASE_URL = (
  rawBase !== undefined && rawBase !== ''
    ? rawBase
    : (import.meta.env.PROD ? '' : 'http://127.0.0.1:8000')
).replace(/\/+$/, '');

export const IS_PRODUCTION_API = API_BASE_URL === '' || !/localhost|127\.0\.0\.1/.test(API_BASE_URL);

/** Build a backend URL from a path, preserving any leading slash. */
export function apiUrl(path) {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}