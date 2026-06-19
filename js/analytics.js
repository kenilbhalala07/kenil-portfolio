/**
 * Vercel Web Analytics initialization
 * Dynamically imports and initializes Vercel Analytics for tracking page views
 */
(function() {
  // Load analytics from CDN
  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
    import { inject } from 'https://cdn.jsdelivr.net/npm/@vercel/analytics@1/dist/index.mjs';
    inject({ mode: 'auto' });
  `;
  document.head.appendChild(script);
})();
