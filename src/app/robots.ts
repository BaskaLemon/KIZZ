import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: ['/', '/privacy', '/terms'], disallow: ['/api/', '/profile', '/classroom', '/play', '/shop', '/notes'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
