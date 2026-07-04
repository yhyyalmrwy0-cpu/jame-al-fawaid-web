/**
 * Resolves the API base URL dynamically.
 * Priority:
 * 1. VITE_API_BASE_URL environment variable if provided.
 * 2. If running on vercel.app, fallback to the permanent Cloud Run Shared App URL.
 * 3. Relative path (defaults to same origin).
 */
export const getApiUrl = (path: string): string => {
  // 1. Check if VITE_API_BASE_URL is defined
  let baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';

  // 2. If running on Vercel and no VITE_API_BASE_URL is provided, fallback to the permanent Shared App URL
  if (!baseUrl && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('vercel.app')) {
      baseUrl = 'https://ais-pre-nycqmzc2bzipjgz5op6wxm-55449569636.europe-west2.run.app';
    }
  }

  // Ensure path starts with slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Clean trailing slash of base
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  return `${baseUrl}${cleanPath}`;
};
