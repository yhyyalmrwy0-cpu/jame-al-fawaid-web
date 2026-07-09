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

  if (baseUrl === 'RELATIVE' || baseUrl === 'self' || baseUrl === 'relative') {
    baseUrl = '';
  }

  // 2. Fallback to the permanent Shared App URL if running on a custom external production URL (like Vercel or any custom domain)
  if (!baseUrl && typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.startsWith('192.168.');
    const isStudioPreview = host.includes('run.app');

    if (!isLocal && !isStudioPreview) {
      // The app has been exported/deployed externally (e.g. Vercel, Netlify, custom domain).
      // Connect to the secure, active Cloud Run API gateway container so that the database,
      // activation keys, and cloud backup features continue working seamlessly!
      
      // CRITICAL EXCEPTION: Do NOT fallback to Cloud Run for OCR / image analysis routes!
      // This allows the OCR feature to run natively and serverlessly on Vercel itself,
      // using Vercel's own environment variables (GEMINI_API_KEY), making it highly reliable and fast.
      const isOcrRoute = path.includes('analyze-image') || path.includes('ocr');
      if (!isOcrRoute) {
        baseUrl = 'https://ais-pre-nycqmzc2bzipjgz5op6wxm-55449569636.europe-west2.run.app';
      }
    } else if (isStudioPreview) {
      // We are in the AI Studio preview environment.
      // If there is a subpath prefix (like /3000/ or /1416/), we MUST prepend it to local API requests
      // so the reverse proxy can correctly route the requests to our container!
      const match = window.location.pathname.match(/^\/([0-9]+)/);
      if (match) {
        baseUrl = `/${match[1]}`;
      }
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
