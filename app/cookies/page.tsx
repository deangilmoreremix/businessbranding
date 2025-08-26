'use client';

import { motion } from 'framer-motion';
import { Cookie, Info, Settings, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-16 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-2"
          >
            <Badge className="text-sm px-3">COOKIES</Badge>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold gradient-text mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Cookie Policy
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            How we use cookies and similar technologies on our website
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-8"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Cookie className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">What Are Cookies?</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                Cookies are small text files that are placed on your device when you visit a website. They help the website 
                remember information about your visit, such as your preferred language and other settings. Cookies can make 
                your next visit easier and the site more useful to you.
              </p>
              <p className="text-muted-foreground">
                We also use similar technologies such as pixel tags, web beacons, and local storage, which function 
                similarly to cookies.
              </p>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold">Types of Cookies We Use</h2>
            </div>
            <Card className="p-6">
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-medium mb-2">Essential Cookies</h3>
                  <p className="text-muted-foreground">
                    These cookies are necessary for the website to function properly. They enable basic functions 
                    like page navigation, access to secure areas, and authentication. The website cannot function 
                    properly without these cookies.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Performance Cookies</h3>
                  <p className="text-muted-foreground">
                    These cookies collect information about how visitors use our website, such as which pages they 
                    visit most often and if they receive error messages. They help us improve our website's performance.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Functionality Cookies</h3>
                  <p className="text-muted-foreground">
                    These cookies allow the website to remember choices you make (such as your preferred language 
                    or region) and provide enhanced, personalized features.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Analytics Cookies</h3>
                  <p className="text-muted-foreground">
                    We use analytics tools that place cookies to help us understand how visitors interact with our 
                    website. This helps us improve our services and user experience.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Marketing Cookies</h3>
                  <p className="text-muted-foreground">
                    These cookies are used to track visitors across websites. The intention is to display ads that 
                    are relevant and engaging for the individual user.
                  </p>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Settings className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">Managing Cookies</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                You can control and manage cookies in various ways. You can:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li>Configure your browser settings to accept or reject all cookies, or to notify you when a cookie is set</li>
                <li>Delete cookies that have already been stored</li>
                <li>Use our cookie preference tool to select which types of cookies you accept</li>
              </ul>
              <p className="text-muted-foreground">
                Please note that blocking certain cookies may affect your experience on our website and limit the functionality 
                we can provide.
              </p>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold">Third-Party Cookies</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                We also use cookies provided by trusted third parties. The following section details which third-party 
                cookies you might encounter through our website:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <span className="font-medium">Google Analytics:</span> We use Google Analytics to understand how visitors 
                  interact with our website. These cookies help us track things like how long you spend on the site and the 
                  pages you visit.
                </li>
                <li>
                  <span className="font-medium">Social Media:</span> We use social media features that may set cookies. 
                  These features include sharing content on social media platforms and using social media logins.
                </li>
                <li>
                  <span className="font-medium">Payment Processors:</span> Our payment processor partners may set cookies 
                  to help secure transactions and for anti-fraud measures.
                </li>
              </ul>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Your Consent</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                When you first visit our website, we ask for your consent to use cookies. You can choose to accept all 
                cookies or customize your preferences.
              </p>
              <p className="text-muted-foreground mb-4">
                You can change your cookie preferences at any time by clicking on the "Cookie Settings" link in the footer 
                of our website.
              </p>
              <p className="text-muted-foreground">
                By continuing to use our website without changing your cookie settings, you consent to our use of cookies 
                as described in this policy.
              </p>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Updates to This Policy</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our 
                business practices. Any changes will be posted on this page with an updated revision date.
              </p>
              <p className="text-muted-foreground">
                We encourage you to periodically review this policy to stay informed about how we use cookies.
              </p>
            </Card>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-6">
            Last updated: April 1, 2025
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              Manage Cookie Preferences
            </Button>
            <Link href="/privacy">
              <Button variant="outline">
                Privacy Policy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}