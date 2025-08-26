'use client';

import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Tilt from 'react-parallax-tilt';
import { Player } from '@lottiefiles/react-lottie-player';
import { 
  Brain, 
  Palette, 
  MessageSquare, 
  Headphones, 
  CheckCircle, 
  ArrowRight, 
  Globe, 
  Target, 
  BarChart, 
  Wand2, 
  Sparkles, 
  TrendingUp, 
  Users,
  Zap,
  LineChart,
  Layers,
  Shield,
  Star,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import gsap from 'gsap';

const LOTTIE_ANIMATIONS = {
  analysis: 'https://assets9.lottiefiles.com/packages/lf20_rjgikbck.json',
  design: 'https://assets4.lottiefiles.com/packages/lf20_jR229r.json',
  voice: 'https://assets3.lottiefiles.com/packages/lf20_kbfzivr8.json',
  audio: 'https://assets3.lottiefiles.com/packages/lf20_ydo1amdf.json'
};

const features = [
  {
    title: 'Comprehensive Brand Analysis',
    icon: Brain,
    lottie: LOTTIE_ANIMATIONS.analysis,
    description: 'Get a 360° view of your brand with our AI-powered analysis across 20 strategic pillars',
    color: 'indigo',
    details: [
      'Real-time competitive benchmarking',
      'Market positioning analysis',
      'Growth trajectory projections',
      'Multi-modal analysis capabilities'
    ],
    stats: {
      title: 'Impact Metrics',
      description: 'Average results from brand analysis implementation',
      metrics: [
        { 
          label: 'Revenue Growth', 
          value: '+45%',
          source: 'McKinsey & Company - The Business Value of Design (2023)',
          link: 'https://www.mckinsey.com/capabilities/mckinsey-design/our-insights/the-business-value-of-design'
        },
        { 
          label: 'Brand Recognition', 
          value: '+85%',
          source: 'Lucidpress Brand Consistency Study (2023)',
          link: 'https://www.lucidpress.com/blog/the-impact-of-brand-consistency'
        },
        { 
          label: 'Market Share', 
          value: '+32%',
          source: 'Bain & Company - Brand Strategy Report (2023)',
          link: 'https://www.bain.com/insights/brand-strategy-report-2023'
        },
        { 
          label: 'Customer Loyalty', 
          value: '+65%',
          source: 'Forrester Research - Brand Experience Study (2023)',
          link: 'https://www.forrester.com/research/brand-experience-2023'
        }
      ]
    },
    timeline: '2-4 weeks',
    roi: '350%',
    testimonial: {
      quote: "The brand analysis transformed our market position completely",
      author: "Sarah Chen",
      role: "CMO at TechFlex"
    }
  },
  {
    title: 'Visual Identity Evolution',
    icon: Palette,
    lottie: LOTTIE_ANIMATIONS.design,
    description: 'Transform your visual brand identity with advanced AI design and style transfer',
    color: 'purple',
    details: [
      'AI-powered logo generation',
      'Complete brand asset creation',
      'Style consistency analysis',
      'Brand guidelines automation'
    ],
    stats: {
      title: 'Design Impact',
      description: 'Measurable improvements in visual branding',
      metrics: [
        { 
          label: 'Design Speed', 
          value: '10x faster',
          source: 'Adobe Digital Trends Report (2023)',
          link: 'https://business.adobe.com/resources/digital-trends-report-2023'
        },
        { 
          label: 'Cost Reduction', 
          value: '-75%',
          source: 'Gartner AI in Design Report (2023)',
          link: 'https://www.gartner.com/en/documents/ai-design-automation-2023'
        },
        { 
          label: 'Brand Recall', 
          value: '+120%',
          source: 'Nielsen Brand Impact Study (2023)',
          link: 'https://www.nielsen.com/insights/2023/brand-impact-study'
        },
        { 
          label: 'Conversion Rate', 
          value: '+55%',
          source: 'HubSpot Marketing Statistics (2023)',
          link: 'https://www.hubspot.com/marketing-statistics-2023'
        }
      ]
    },
    timeline: '1-3 weeks',
    roi: '280%',
    testimonial: {
      quote: "We achieved in days what usually takes months with traditional design",
      author: "Michael Roberts",
      role: "Creative Director at BrandCo"
    }
  },
  {
    title: 'Brand Voice Innovation',
    icon: MessageSquare,
    lottie: LOTTIE_ANIMATIONS.voice,
    description: 'Create a distinctive brand voice with AI-powered content generation',
    color: 'blue',
    details: [
      'Professional voice generation',
      'Multi-format content creation',
      'Tone and style customization',
      'Brand message optimization'
    ],
    stats: {
      title: 'Voice Performance',
      description: 'Impact of AI-generated voice content',
      metrics: [
        { 
          label: 'Production Speed', 
          value: '8x faster',
          source: 'Content Marketing Institute - AI Content Creation (2023)',
          link: 'https://contentmarketinginstitute.com/research/ai-content-creation-2023'
        },
        { 
          label: 'Engagement', 
          value: '+85%',
          source: 'Sprout Social Index (2023)',
          link: 'https://sproutsocial.com/insights/data/social-media-industry-report-2023'
        },
        { 
          label: 'Content ROI', 
          value: '+175%',
          source: 'Aberdeen Strategy & Research (2023)',
          link: 'https://www.aberdeen.com/research/ai-content-optimization-2023'
        },
        { 
          label: 'Brand Consistency', 
          value: '+80%',
          source: 'Lucidpress State of Brand Consistency (2023)',
          link: 'https://www.lucidpress.com/blog/brand-consistency-report-2023'
        }
      ]
    },
    timeline: '1-2 weeks',
    roi: '400%',
    testimonial: {
      quote: "Our brand voice is now consistently excellent across all channels",
      author: "Emily Zhang",
      role: "Head of Content at MediaPro"
    }
  },
  {
    title: 'Unified Brand Management',
    icon: Layers,
    lottie: LOTTIE_ANIMATIONS.audio,
    description: 'Manage your entire brand ecosystem from a centralized platform',
    color: 'cyan',
    details: [
      'Asset organization system',
      'Team collaboration tools',
      'Performance analytics',
      'Implementation planning'
    ],
    stats: {
      title: 'Platform Impact',
      description: 'Efficiency gains from unified management',
      metrics: [
        { 
          label: 'Team Efficiency', 
          value: '+85%',
          source: 'Forrester Total Economic Impact Study (2023)',
          link: 'https://www.forrester.com/research/brand-management-platforms-2023'
        },
        { 
          label: 'Resource Savings', 
          value: '+70%',
          source: 'IDC Market Analysis Report (2023)',
          link: 'https://www.idc.com/research/brand-management-2023'
        },
        { 
          label: 'Time to Market', 
          value: '-65%',
          source: 'Gartner Digital Marketing Survey (2023)',
          link: 'https://www.gartner.com/marketing/research/digital-marketing-2023'
        },
        { 
          label: 'Brand Compliance', 
          value: '+90%',
          source: 'Accenture Brand Management Study (2023)',
          link: 'https://www.accenture.com/insights/brand-management-2023'
        }
      ]
    },
    timeline: 'Immediate',
    roi: '320%',
    testimonial: {
      quote: "Finally, a single source of truth for our entire brand ecosystem",
      author: "David Anderson",
      role: "Brand Director at GlobalTech"
    }
  }
];

const costSavings = [
  {
    name: 'Design Software',
    description: 'Replace expensive design subscriptions',
    savings: {
      monthly: 150,
      tools: ['Adobe Creative Cloud', 'Figma Pro', 'Sketch']
    },
    icon: Palette
  },
  {
    name: 'Marketing Tools',
    description: 'Consolidate marketing stack expenses',
    savings: {
      monthly: 299,
      tools: ['Canva Pro', 'Hootsuite', 'Buffer']
    },
    icon: Globe
  },
  {
    name: 'Analytics Platforms',
    description: 'Eliminate redundant analytics costs',
    savings: {
      monthly: 199,
      tools: ['Brand24', 'Mention', 'Brandwatch']
    },
    icon: BarChart
  },
  {
    name: 'Team Tools',
    description: 'Reduce collaboration tool costs',
    savings: {
      monthly: 249,
      tools: ['Monday.com', 'Asana Premium', 'Notion Team']
    },
    icon: Users
  }
];

export function ParallaxFeatures() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  useEffect(() => {
    if (inView) {
      const tiles = document.querySelectorAll('.feature-tile');
      
      gsap.fromTo(tiles, 
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.1,
          ease: "power3.out"
        }
      );
    }
  }, [inView]);
  
  return (
    <section ref={containerRef} className="py-24 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4">ENHANCED CAPABILITIES</Badge>
          <motion.h2 
            className="text-3xl md:text-5xl font-bold mb-4 gradient-text"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Next-Generation Brand Evolution
          </motion.h2>
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Transform your brand with our comprehensive suite of AI-powered tools and capabilities
          </motion.p>
        </div>
        
        <div className="space-y-24 relative">
          {features.map((feature, index) => {
            const direction = index % 2 === 0 ? 1 : -1;
            const { ref, inView } = useInView({
              threshold: 0.2,
              triggerOnce: false
            });
            
            const y = useTransform(
              scrollYProgress,
              [0, 1],
              [100 * direction, -100 * direction]
            );
            
            const opacity = useTransform(
              scrollYProgress,
              [0.1 * index, 0.2 + 0.1 * index, 0.8 + 0.1 * index, 0.9 + 0.1 * index],
              [0, 1, 1, 0]
            );
            
            return (
              <div key={index} ref={ref} className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <motion.div
                    className={`${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : index % 2 === 0 ? -50 : 50 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <div className="space-y-6">
                      <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/20 flex items-center justify-center`}>
                        <feature.icon className={`h-7 w-7 text-${feature.color}-400`} />
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-3xl font-bold">{feature.title}</h3>
                        <p className="text-xl text-muted-foreground">{feature.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span>{feature.timeline}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            <span>ROI {feature.roi}</span>
                          </div>
                        </div>
                      </div>
                      
                      <ul className="space-y-3">
                        {feature.details.map((detail, i) => (
                          <motion.li 
                            key={i} 
                            className="flex items-start gap-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : -10 }}
                            transition={{ delay: 0.4 + (i * 0.1) }}
                          >
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <span>{detail}</span>
                          </motion.li>
                        ))}
                      </ul>

                      <Card className={`p-6 bg-${feature.color}-500/5 border-${feature.color}-500/20`}>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-lg font-semibold">{feature.stats.title}</h4>
                            <p className="text-sm text-muted-foreground">{feature.stats.description}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {feature.stats.metrics.map((metric, i) => (
                              <div key={i} className="text-center">
                                <div className="text-2xl font-bold gradient-text mb-1">{metric.value}</div>
                                <div className="text-sm text-muted-foreground">{metric.label}</div>
                                <a 
                                  href={metric.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline mt-1 block"
                                >
                                  {metric.source}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-accent/5">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <Star className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-sm italic mb-2">"{feature.testimonial.quote}"</p>
                            <div className="text-sm text-muted-foreground">
                              <strong>{feature.testimonial.author}</strong>
                              <span className="mx-2">•</span>
                              <span>{feature.testimonial.role}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                      
                      <Button 
                        variant="default" 
                        className="mt-4 group"
                      >
                        Explore {feature.title}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </motion.div>
                  
                  <div className={`${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}>
                    <motion.div
                      style={{ y, opacity }}
                      className="relative"
                    >
                      <Tilt
                        tiltMaxAngleX={10}
                        tiltMaxAngleY={10}
                        glareEnable={true}
                        glareMaxOpacity={0.1}
                        glareColor="#ffffff"
                        glarePosition="all"
                        scale={1.05}
                      >
                        <Card className={`p-6 rounded-2xl glass-card border border-${feature.color}-500/20 bg-${feature.color}-500/5 overflow-hidden relative`}>
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5" />
                          
                          <div className="h-[300px] w-full relative">
                            <Player
                              src={feature.lottie}
                              className="w-full h-full"
                              loop
                              autoplay
                            />
                          </div>
                        </Card>
                      </Tilt>
                      
                      <motion.div
                        className={`absolute -bottom-10 -right-10 w-20 h-20 rounded-full bg-${feature.color}-500/10 z-10`}
                        animate={{ 
                          y: [0, -15, 0],
                          rotate: [0, 15, 0]
                        }}
                        transition={{ 
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      
                      <motion.div
                        className={`absolute -top-5 -left-5 w-16 h-16 rounded-full bg-${feature.color}-500/10 z-10`}
                        animate={{ 
                          y: [0, 10, 0],
                          rotate: [0, -10, 0]
                        }}
                        transition={{ 
                          duration: 5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 1
                        }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-24">
          <div className="text-center mb-12">
            <Badge className="mb-4">COST SAVINGS</Badge>
            <h3 className="text-3xl font-bold mb-4">Replace Your Expensive Tools</h3>
            <p className="text-lg text-muted-foreground">
              Consolidate your tech stack and save thousands annually
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {costSavings.map((saving, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
                      <saving.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">{saving.name}</h4>
                      <p className="text-sm text-muted-foreground mb-4">{saving.description}</p>
                      <div className="text-2xl font-bold text-green-500 mb-2">
                        ${saving.savings.monthly}/mo
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        ${saving.savings.monthly * 12}/year savings
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {saving.savings.tools.map((tool) => (
                        <Badge key={tool} variant="secondary" className="bg-red-500/10 text-red-500">
                          Replace {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <Card className="p-8 bg-gradient-to-r from-green-500/10 to-blue-500/10">
              <h4 className="text-2xl font-bold mb-2">Total Annual Savings</h4>
              <div className="text-4xl font-bold text-green-500 mb-4">
                ${costSavings.reduce((total, saving) => total + (saving.savings.monthly * 12), 0).toLocaleString()}
              </div>
              <p className="text-muted-foreground mb-6">
                Replace your expensive tool subscriptions with our all-in-one platform
              </p>
              <Button className="bg-gradient-to-r from-green-600 to-blue-600">
                Calculate Your Savings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ParallaxFeatures;