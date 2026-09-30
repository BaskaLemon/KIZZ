/** Public origin of the deployed site (used for canonical/OG URLs and the
 * sitemap). Set NEXT_PUBLIC_SITE_URL in production, e.g. https://kizz.mn. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
