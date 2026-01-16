import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
}

const BASE_URL = 'https://agroci.lovable.app';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'AgroCI';

export const SEOHead = ({
  title,
  description,
  keywords = 'produits vivriers, agriculture, Côte d\'Ivoire, maïs, riz, manioc, igname, producteurs, acheteurs, gros, WhatsApp',
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false
}: SEOHeadProps) => {
  
  useEffect(() => {
    // Update document title
    document.title = `${title} | ${SITE_NAME}`;
    
    // Helper function to update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', SITE_NAME);
    
    // Robots meta
    if (noIndex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }
    
    // OpenGraph tags
    updateMetaTag('og:title', `${title} | ${SITE_NAME}`, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:url', canonicalUrl || window.location.href, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:site_name', SITE_NAME, true);
    updateMetaTag('og:locale', 'fr_FR', true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', `${title} | ${SITE_NAME}`);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl || window.location.href);
    
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, noIndex]);
  
  return null;
};

export default SEOHead;
