import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Add protocol if missing
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    console.log('Scraping URL:', fullUrl);

    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract social media links
    const socialLinks: Record<string, string> = {};
    
    Object.entries(SOCIAL_SELECTORS).forEach(([platform, selectors]) => {
      for (const selector of selectors) {
        if (socialLinks[platform]) break; // Skip if we already found a link
        
        const elements = $(selector);
        elements.each((_, el) => {
          if (socialLinks[platform]) return; // Skip if we already found a link
          
          // Try href attribute first
          let href = $(el).attr('href');
          
          // If no href, try data attributes that might contain links
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
            // Clean and validate the URL
            let cleanUrl = href.trim();
            if (!cleanUrl.startsWith('http')) {
              cleanUrl = new URL(cleanUrl, fullUrl).href;
            }
            
            // Validate URL format
            new URL(cleanUrl);
            
            // Check if URL matches platform pattern
            const urlObj = new URL(cleanUrl);
            const domain = urlObj.hostname.toLowerCase();
            
            if (
              (platform === 'facebook' && /facebook\.com|fb\.com|fb\.me/i.test(domain)) ||
              (platform === 'twitter' && /twitter\.com|x\.com|t\.co/i.test(domain)) ||
              (platform === 'instagram' && /instagram\.com|instagr\.am/i.test(domain)) ||
              (platform === 'linkedin' && /linkedin\.com|lnkd\.in/i.test(domain))
            ) {
              // Clean up the URL by removing tracking parameters
              urlObj.search = '';
              socialLinks[platform] = urlObj.toString();
            }
          } catch (e) {
            console.warn(`Invalid URL found for ${platform}:`, href);
          }
        });
      }
    });

    // Also check meta tags and link elements
    $('meta[property^="og:"], meta[name^="og:"], meta[property^="al:"], link[rel="alternate"]').each((_, el) => {
      const content = $(el).attr('content') || $(el).attr('href');
      if (!content) return;
      
      try {
        const urlObj = new URL(content);
        const domain = urlObj.hostname.toLowerCase();
        
        Object.entries(SOCIAL_SELECTORS).forEach(([platform, _]) => {
          if (socialLinks[platform]) return; // Skip if we already found a link
          
          if (
            (platform === 'facebook' && /facebook\.com|fb\.com|fb\.me/i.test(domain)) ||
            (platform === 'twitter' && /twitter\.com|x\.com|t\.co/i.test(domain)) ||
            (platform === 'instagram' && /instagram\.com|instagr\.am/i.test(domain)) ||
            (platform === 'linkedin' && /linkedin\.com|lnkd\.in/i.test(domain))
          ) {
            socialLinks[platform] = content;
          }
        });
      } catch (e) {
        // Ignore invalid URLs in meta tags
      }
    });

    console.log('Found social links:', socialLinks);

    // Extract meta information
    const meta = {
      title: $('title').text(),
      description: $('meta[name="description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content'),
      author: $('meta[name="author"]').attr('content'),
      robots: $('meta[name="robots"]').attr('content'),
      ogTitle: $('meta[property="og:title"]').attr('content'),
      ogDescription: $('meta[property="og:description"]').attr('content'),
      ogImage: $('meta[property="og:image"]').attr('content')
    };

    // Return scraped data
    return NextResponse.json({
      title: $('title').text(),
      description: $('meta[name="description"]').attr('content'),
      socialLinks,
      html, // Include HTML for client-side processing
      meta
    });
  } catch (error) {
    console.error('Error scraping website:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to scrape website',
      details: error
    }, { status: 500 });
  }
}