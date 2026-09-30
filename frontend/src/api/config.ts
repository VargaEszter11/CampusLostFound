/** Backend base URL. In dev, Vite proxies `/api` → backend. */
export const API_BASE = ''

/** Public Google OAuth Web client ID (same value as backend GOOGLE_CLIENT_ID). */
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? ''
