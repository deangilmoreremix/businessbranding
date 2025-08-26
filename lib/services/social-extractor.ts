interface SocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
}

export function extractSocialLinks(links: string[]): SocialLinks {
  const socialLinks: SocialLinks = {
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: ''
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const cleanUrl = (url: string): string => {
    // Remove tracking parameters and clean up URL
    try {
      const urlObj = new URL(url);
      // Remove common tracking parameters
      [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'fbclid',
        'ref',
        'source',
        'ref_src',
        '_ga'
      ].forEach(param => {
        urlObj.searchParams.delete(param);
      });
      return urlObj.toString().replace(/\/$/, ''); // Remove trailing slash
    } catch {
      return url;
    }
  };

  const matchesDomain = (url: string, patterns: RegExp[]): boolean => {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      return patterns.some(pattern => pattern.test(domain));
    } catch {
      return false;
    }
  };

  const domainPatterns = {
    facebook: [
      /facebook\.com$/i,
      /fb\.com$/i,
      /fb\.me$/i
    ],
    instagram: [
      /instagram\.com$/i,
      /instagr\.am$/i
    ],
    twitter: [
      /twitter\.com$/i,
      /x\.com$/i,
      /t\.co$/i
    ],
    linkedin: [
      /linkedin\.com$/i,
      /lnkd\.in$/i
    ]
  };

  // Process each link
  links.forEach(link => {
    if (!validateUrl(link)) return;
    
    const cleanedUrl = cleanUrl(link);
    
    // Check each platform
    if (matchesDomain(cleanedUrl, domainPatterns.facebook) && !socialLinks.facebook) {
      socialLinks.facebook = cleanedUrl;
    }
    else if (matchesDomain(cleanedUrl, domainPatterns.instagram) && !socialLinks.instagram) {
      socialLinks.instagram = cleanedUrl;
    }
    else if (matchesDomain(cleanedUrl, domainPatterns.twitter) && !socialLinks.twitter) {
      socialLinks.twitter = cleanedUrl;
    }
    else if (matchesDomain(cleanedUrl, domainPatterns.linkedin) && !socialLinks.linkedin) {
      socialLinks.linkedin = cleanedUrl;
    }
  });

  return socialLinks;
}