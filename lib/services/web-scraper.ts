import { extractSocialLinks } from './social-extractor';
import * as cheerio from 'cheerio';

const SOCIAL_SELECTORS = {
  facebook: [
    'a[href*="facebook.com"]',
    'a[href*="fb.com"]',
    'a[href*="fb.me"]',
    '.social-facebook',
    '[aria-label*="Facebook" i]',
    '[title*="Facebook" i]',
    'a[href*="facebook" i]',
    'a[class*="facebook" i]',
    'a[id*="facebook" i]',
    'link[href*="facebook.com"]'
  ],
  twitter: [
    'a[href*="twitter.com"]',
    'a[href*="x.com"]',
    'a[href*="t.co"]',
    '.social-twitter',
    '[aria-label*="Twitter" i]',
    '[aria-label*="X" i]',
    '[title*="Twitter" i]',
    '[title*="X" i]',
    'a[href*="twitter" i]',
    'a[class*="twitter" i]',
    'a[id*="twitter" i]',
    'link[href*="twitter.com"]'
  ],
  instagram: [
    'a[href*="instagram.com"]',
    'a[href*="instagr.am"]',
    '.social-instagram',
    '[aria-label*="Instagram" i]',
    '[title*="Instagram" i]',
    'a[href*="instagram" i]',
    'a[class*="instagram" i]',
    'a[id*="instagram" i]',
    'link[href*="instagram.com"]'
  ],
  linkedin: [
    'a[href*="linkedin.com"]',
    'a[href*="lnkd.in"]',
    '.social-linkedin',
    '[aria-label*="LinkedIn" i]',
    '[title*="LinkedIn" i]',
    'a[href*="linkedin" i]',
    'a[class*="linkedin" i]',
    'a[id*="linkedin" i]',
    'link[href*="linkedin.com"]'
  ]
};

const IMAGE_SELECTORS = {
  logos: [
    'img[alt*="logo" i]',
    'img[src*="logo" i]',
    'img[class*="logo" i]',
    'img[id*="logo" i]',
    '.logo img',
    '#logo img',
    '[aria-label*="logo" i] img'
  ],
  banners: [
    '.banner img',
    '.hero img',
    '.header img',
    'img[class*="banner" i]',
    'img[class*="hero" i]',
    'img[alt*="banner" i]',
    'img[alt*="hero" i]'
  ],
  products: [
    '.product img',
    '.products img',
    'img[class*="product" i]',
    'img[alt*="product" i]'
  ],
  team: [
    '.team img',
    '.about img',
    'img[class*="team" i]',
    'img[alt*="team" i]',
    'img[alt*="employee" i]',
    'img[alt*="staff" i]'
  ]
};

export async function scrapeWebsite(url: string) {
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    console.log('Scraping website:', url);

    // First try direct fetch with CORS proxy
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Direct fetch failed: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract social links
      const socialLinks = extractSocialLinksFromPage($, url);
      
      // Extract meta info
      const meta = extractMetaInfo($);
      
      // Extract images by category
      const images = {
        logos: extractImagesByCategory($, 'logos', url),
        banners: extractImagesByCategory($, 'banners', url),
        products: extractImagesByCategory($, 'products', url),
        team: extractImagesByCategory($, 'team', url),
        all: extractAllImages($, url)
      };

      // Extract background images
      const backgroundImages = extractBackgroundImages($, url);
      images.all.push(...backgroundImages);

      return {
        url,
        title: $('title').text(),
        description: meta.description,
        socialLinks,
        images,
        meta
      };
    } catch (directError) {
      console.warn('Direct fetch failed, trying API endpoint:', directError);
      
      // Fallback to API endpoint
      try {
        const response = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`API endpoint failed: ${response.status}`);
        }

        const data = await response.json();
        return {
          url,
          title: data.title || '',
          description: data.description || '',
          socialLinks: data.socialLinks || {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: ''
          },
          images: data.images || {
            logos: [],
            banners: [],
            products: [],
            team: [],
            all: []
          },
          meta: data.meta || {}
        };
      } catch (apiError) {
        console.error('API endpoint fetch failed:', apiError);
        throw new Error(`Failed to fetch website data: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
    }
  } catch (error) {
    console.error('Error scraping website:', error);
    // Return empty data structure on error
    return {
      url,
      title: '',
      description: '',
      socialLinks: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: ''
      },
      images: {
        logos: [],
        banners: [],
        products: [],
        team: [],
        all: []
      },
      meta: {}
    };
  }
}

function extractSocialLinksFromPage($: cheerio.CheerioAPI, baseUrl: string): Record<string, string> {
  const socialLinks: Record<string, string> = {};
  
  Object.entries(SOCIAL_SELECTORS).forEach(([platform, selectors]) => {
    for (const selector of selectors) {
      if (socialLinks[platform]) break;
      
      const elements = $(selector);
      elements.each((_, el) => {
        if (socialLinks[platform]) return;
        
        // Try href attribute first
        let href = $(el).attr('href');
        
        // If no href, try data attributes
        if (!href) {
          const dataAttrs = Object.keys($(el).data());
          for (const attr of dataAttrs) {
            if (attr.toLowerCase().includes('href') || attr.toLowerCase().includes('url')) {
              href = $(el).data(attr);
              break;
            }
          }
        }
        
        if (!href) return;
        
        try {
          // Clean and validate URL
          let cleanUrl = href.trim();
          if (!cleanUrl.startsWith('http')) {
            cleanUrl = new URL(cleanUrl, baseUrl).href;
          }
          
          const urlObj = new URL(cleanUrl);
          const domain = urlObj.hostname.toLowerCase();
          
          if (
            (platform === 'facebook' && /facebook\.com|fb\.com|fb\.me/i.test(domain)) ||
            (platform === 'twitter' && /twitter\.com|x\.com|t\.co/i.test(domain)) ||
            (platform === 'instagram' && /instagram\.com|instagr\.am/i.test(domain)) ||
            (platform === 'linkedin' && /linkedin\.com|lnkd\.in/i.test(domain))
          ) {
            // Remove tracking parameters
            urlObj.search = '';
            socialLinks[platform] = urlObj.toString();
          }
        } catch (e) {
          console.warn(`Invalid URL found for ${platform}:`, href);
        }
      });
    }
  });

  return socialLinks;
}

function extractImagesByCategory($: cheerio.CheerioAPI, category: keyof typeof IMAGE_SELECTORS, baseUrl: string): string[] {
  const images = new Set<string>();
  const selectors = IMAGE_SELECTORS[category];

  selectors.forEach(selector => {
    $(selector).each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('data:')) {
        try {
          const fullUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
          images.add(fullUrl);
        } catch (e) {
          console.warn(`Invalid image URL in ${category}:`, src);
        }
      }
    });
  });

  return Array.from(images);
}

function extractAllImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const images = new Set<string>();

  // Find all img elements
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !src.startsWith('data:')) {
      try {
        const fullUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
        images.add(fullUrl);
      } catch (e) {
        console.warn('Invalid image URL:', src);
      }
    }
  });

  return Array.from(images);
}

function extractBackgroundImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const images = new Set<string>();

  // Find elements with background-image style
  $('[style*="background-image"]').each((_, el) => {
    const style = $(el).attr('style');
    if (style) {
      const match = style.match(/url\(['"]?([^'"]+)['"]?\)/i);
      if (match && match[1] && !match[1].startsWith('data:')) {
        try {
          const fullUrl = match[1].startsWith('http') ? match[1] : new URL(match[1], baseUrl).href;
          images.add(fullUrl);
        } catch (e) {
          console.warn('Invalid background image URL:', match[1]);
        }
      }
    }
  });

  return Array.from(images);
}

function extractMetaInfo($: cheerio.CheerioAPI) {
  return {
    title: $('title').text(),
    description: $('meta[name="description"]').attr('content'),
    keywords: $('meta[name="keywords"]').attr('content'),
    author: $('meta[name="author"]').attr('content'),
    robots: $('meta[name="robots"]').attr('content'),
    ogTitle: $('meta[property="og:title"]').attr('content'),
    ogDescription: $('meta[property="og:description"]').attr('content'),
    ogImage: $('meta[property="og:image"]').attr('content')
  };
}