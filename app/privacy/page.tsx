'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, User, File, List, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function PrivacyPolicy() {
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
            <Badge className="text-sm px-3">PRIVACY</Badge>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold gradient-text mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Privacy Policy
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            How we handle and protect your data
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
                <Lock className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Introduction</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                At AI Brand Creator, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website 
                and services.
              </p>
              <p className="text-muted-foreground">
                By accessing or using our services, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <List className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold">Information We Collect</h2>
            </div>
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-3">Personal Information</h3>
              <p className="text-muted-foreground mb-4">
                We may collect the following types of personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                <li>Contact information (name, email address, phone number)</li>
                <li>Account credentials</li>
                <li>Billing and payment information</li>
                <li>Business information</li>
                <li>User preferences and settings</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-3">Usage Information</h3>
              <p className="text-muted-foreground mb-4">
                We also collect information about how you use our services:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Log data (IP address, browser type, pages visited)</li>
                <li>Device information</li>
                <li>Content information (brand assets, generated content)</li>
                <li>Communication history</li>
              </ul>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <File className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">How We Use Your Information</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Providing and improving our services</li>
                <li>Processing transactions and managing your account</li>
                <li>Personalizing your experience</li>
                <li>Communicating with you about our services</li>
                <li>Analyzing usage patterns to improve our website and services</li>
                <li>Complying with legal obligations</li>
                <li>Protecting our rights, property, and safety</li>
              </ul>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold">Data Security</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Encryption of sensitive data</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication measures</li>
                <li>Secure data storage practices</li>
                <li>Employee training on data security</li>
              </ul>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Your Rights</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate information</li>
                <li>Deletion of your personal information</li>
                <li>Objection to or restriction of processing</li>
                <li>Data portability</li>
                <li>Withdrawal of consent</li>
              </ul>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Contact Us</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                If you have any questions or concerns about our Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-accent/5 p-4 rounded-lg mb-6">
                <p className="font-medium">Email: privacy@aibrandcreator.com</p>
                <p className="font-medium">Address: 123 AI Street, San Francisco, CA 94103</p>
              </div>
              <p className="text-muted-foreground">
                We will respond to your inquiry as soon as possible and work with you to address any concerns.
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
            <Link href="/terms">
              <Button variant="outline">
                Terms of Service
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline">
                Contact Us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}