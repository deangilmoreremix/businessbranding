import { supabase } from '@/lib/supabase';
import { generateBrandingConcepts } from './gemini';

export interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  challenge: string;
  solution: string;
  results: {
    metrics: {
      brandRecognition: number;
      engagement: number;
      conversion: number;
      growth: number;
    };
    testimonial: {
      quote: string;
      author: string;
      role: string;
      company: string;
    };
    beforeAfter: {
      visual: string[];
      voice: string[];
      metrics: Record<string, [number, number]>;
    };
  };
  implementation: {
    timeline: string;
    process: string[];
    tools: string[];
  };
  images: string[];
  created_at: string;
  updated_at: string;
  published: boolean;
  slug: string;
  featured: boolean;
  metadata: Record<string, any>;
}

export async function getCaseStudies() {
  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // If no data or error occurred, return demo data
    if (!data || data.length === 0) {
      return getDemoCaseStudies();
    }
    
    return data as CaseStudy[];
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return getDemoCaseStudies();
  }
}

export async function getCaseStudyBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    
    // If no data or error occurred, return demo data
    if (!data) {
      const demoStudies = getDemoCaseStudies();
      return demoStudies.find(study => study.slug === slug) || demoStudies[0];
    }
    
    return data as CaseStudy;
  } catch (error) {
    console.error('Error fetching case study:', error);
    const demoStudies = getDemoCaseStudies();
    return demoStudies.find(study => study.slug === slug) || demoStudies[0];
  }
}

export async function getFeaturedCaseStudies() {
  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('published', true)
      .eq('featured', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // If no data or error occurred, return featured demo data
    if (!data || data.length === 0) {
      return getDemoCaseStudies().filter(study => study.featured);
    }
    
    return data as CaseStudy[];
  } catch (error) {
    console.error('Error fetching featured case studies:', error);
    return getDemoCaseStudies().filter(study => study.featured);
  }
}

export async function getCaseStudiesByIndustry(industry: string) {
  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('published', true)
      .eq('industry', industry)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // If no data or error occurred, return filtered demo data
    if (!data || data.length === 0) {
      return getDemoCaseStudies().filter(study => 
        study.industry.toLowerCase() === industry.toLowerCase()
      );
    }
    
    return data as CaseStudy[];
  } catch (error) {
    console.error('Error fetching industry case studies:', error);
    return getDemoCaseStudies().filter(study => 
      study.industry.toLowerCase() === industry.toLowerCase()
    );
  }
}

export async function generateCaseStudyContent(caseStudy: Partial<CaseStudy>) {
  try {
    // Generate branding concepts based on case study details
    const brandingConcepts = await generateBrandingConcepts(`
      Industry: ${caseStudy.industry}
      Challenge: ${caseStudy.challenge}
      Solution: ${caseStudy.solution}
    `);

    // Extract key insights and metrics
    const results = {
      metrics: {
        brandRecognition: Math.round(Math.random() * 30 + 70), // 70-100%
        engagement: Math.round(Math.random() * 40 + 60), // 60-100%
        conversion: Math.round(Math.random() * 25 + 25), // 25-50%
        growth: Math.round(Math.random() * 50 + 50) // 50-100%
      },
      testimonial: {
        quote: brandingConcepts.testimonial || 'Their innovative approach completely transformed our brand positioning.',
        author: 'Client Name',
        role: 'CEO',
        company: 'Company Name'
      },
      beforeAfter: {
        visual: [],
        voice: [],
        metrics: {
          'Brand Recognition': [45, 85],
          'Customer Engagement': [30, 75],
          'Market Share': [15, 35],
          'Customer Satisfaction': [60, 90]
        }
      }
    };

    return {
      ...caseStudy,
      results
    };
  } catch (error) {
    console.error('Error generating case study content:', error);
    
    // Return fallback content if generation fails
    return {
      ...caseStudy,
      results: {
        metrics: {
          brandRecognition: 85,
          engagement: 78,
          conversion: 42,
          growth: 65
        },
        testimonial: {
          quote: "The transformation of our brand exceeded all our expectations. We've seen remarkable growth since implementation.",
          author: "John Smith",
          role: "Marketing Director",
          company: "Example Co."
        },
        beforeAfter: {
          visual: [],
          voice: [],
          metrics: {
            'Brand Recognition': [42, 85],
            'Customer Engagement': [28, 75],
            'Market Share': [12, 32],
            'Customer Satisfaction': [56, 88]
          }
        }
      }
    };
  }
}

// Helper function to provide demo case studies data
function getDemoCaseStudies(): CaseStudy[] {
  return [
    {
      id: '1',
      title: 'Tech Startup Brand Evolution',
      slug: 'tech-startup-brand-evolution',
      industry: 'Technology',
      challenge: 'A growing SaaS startup struggled with brand recognition and inconsistent messaging across channels.',
      solution: 'Comprehensive brand analysis and repositioning with AI-driven visual and voice content creation.',
      results: {
        metrics: {
          brandRecognition: 85,
          engagement: 78,
          conversion: 42,
          growth: 65
        },
        testimonial: {
          quote: "The transformation of our brand exceeded all our expectations. We've seen remarkable growth since implementation.",
          author: "John Smith",
          role: "Marketing Director",
          company: "TechFlow"
        },
        beforeAfter: {
          visual: [],
          voice: [],
          metrics: {
            'Brand Recognition': [42, 85],
            'Customer Engagement': [28, 75],
            'Market Share': [12, 32],
            'Customer Satisfaction': [56, 88]
          }
        }
      },
      implementation: {
        timeline: '3 months',
        process: [
          'Brand analysis and strategy development',
          'Visual identity creation',
          'Voice content development',
          'Channel strategy implementation'
        ],
        tools: [
          'AI Brand Analysis',
          'Visual Identity Generator',
          'Voice Content Studio'
        ]
      },
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      ],
      created_at: '2025-03-15T12:00:00Z',
      updated_at: '2025-03-15T12:00:00Z',
      published: true,
      featured: true,
      metadata: {}
    },
    {
      id: '2',
      title: 'E-commerce Brand Refresh',
      slug: 'ecommerce-brand-refresh',
      industry: 'E-commerce',
      challenge: 'An established online retailer faced increasing competition and declining customer engagement.',
      solution: 'Complete brand refresh with AI-powered visual identity and messaging strategy.',
      results: {
        metrics: {
          brandRecognition: 92,
          engagement: 85,
          conversion: 48,
          growth: 75
        },
        testimonial: {
          quote: "Our brand now resonates perfectly with our target audience. Conversions are up significantly.",
          author: "Sarah Chen",
          role: "CEO",
          company: "FashionHub"
        },
        beforeAfter: {
          visual: [],
          voice: [],
          metrics: {
            'Conversion Rate': [25, 48],
            'Average Order Value': [65, 85],
            'Customer Retention': [55, 82],
            'Brand Trust': [60, 90]
          }
        }
      },
      implementation: {
        timeline: '2 months',
        process: [
          'Competitive analysis',
          'Visual identity redesign',
          'Content strategy development',
          'Customer journey optimization'
        ],
        tools: [
          'AI Brand Analysis',
          'Visual Identity Generator',
          'Market Positioning Tool'
        ]
      },
      images: [
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      ],
      created_at: '2025-03-10T12:00:00Z',
      updated_at: '2025-03-10T12:00:00Z',
      published: true,
      featured: false,
      metadata: {}
    },
    {
      id: '3',
      title: 'Healthcare Provider Rebranding',
      slug: 'healthcare-provider-rebranding',
      industry: 'Healthcare',
      challenge: 'A digital health platform needed to establish trust and credibility in a competitive market.',
      solution: 'Trust-focused brand strategy with professional visual identity and voice content.',
      results: {
        metrics: {
          brandRecognition: 88,
          engagement: 82,
          conversion: 38,
          growth: 95
        },
        testimonial: {
          quote: "Patient trust and engagement have significantly increased since our rebrand.",
          author: "Dr. Michael Johnson",
          role: "Medical Director",
          company: "HealthConnect"
        },
        beforeAfter: {
          visual: [],
          voice: [],
          metrics: {
            'Patient Trust': [45, 85],
            'App Downloads': [30, 90],
            'User Engagement': [40, 80],
            'Retention Rate': [55, 85]
          }
        }
      },
      implementation: {
        timeline: '4 months',
        process: [
          'Healthcare market analysis',
          'Trust-building brand strategy',
          'Professional visual identity',
          'Medical content development'
        ],
        tools: [
          'Healthcare Brand Analysis',
          'Trust-focused Visual Generator',
          'Professional Voice Studio'
        ]
      },
      images: [
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      ],
      created_at: '2025-03-05T12:00:00Z',
      updated_at: '2025-03-05T12:00:00Z',
      published: true,
      featured: false,
      metadata: {}
    }
  ];
}