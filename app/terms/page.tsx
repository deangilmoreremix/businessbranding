'use client';

import { motion } from 'framer-motion';
import { FileText, ScrollText, Shield, Clock, Filter, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsOfService() {
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
            <Badge className="text-sm px-3">TERMS</Badge>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold gradient-text mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Terms of Service
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            The rules and guidelines for using our services
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
                <ScrollText className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Agreement to Terms</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                By accessing or using AI Brand Creator's website and services, you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use our services.
              </p>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Your continued use of our services following any changes
                constitutes your acceptance of the modified terms.
              </p>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold">Services Description</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                AI Brand Creator provides AI-powered brand creation and management services, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                <li>Brand analysis and strategy development</li>
                <li>Visual identity creation (logos, color schemes, etc.)</li>
                <li>Voice content generation</li>
                <li>Content management and organization</li>
                <li>Brand asset storage and deployment</li>
              </ul>
              
              <p className="text-muted-foreground">
                We are constantly improving our services and may add, modify, or remove features at any time without prior notice.
              </p>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">User Accounts</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                To access certain features of our services, you may need to create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Providing accurate and complete information</li>
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Filter className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold">Content and Ownership</h2>
            </div>
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-3">Your Content</h3>
              <p className="text-muted-foreground mb-4">
                You retain ownership of any content you provide to our services, including business information,
                uploaded assets, and instructions.
              </p>
              
              <h3 className="text-lg font-medium mb-3">Generated Content</h3>
              <p className="text-muted-foreground mb-4">
                When you use our services to generate content (logos, voice content, etc.), you receive a license to use
                the generated content for your business purposes, subject to payment of applicable fees.
              </p>
              
              <h3 className="text-lg font-medium mb-3">Content Restrictions</h3>
              <p className="text-muted-foreground mb-4">
                You agree not to use our services to create content that is:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Illegal or promotes illegal activities</li>
                <li>Infringing on third-party intellectual property rights</li>
                <li>Harmful, threatening, or harassing</li>
                <li>Deceptive, fraudulent, or misleading</li>
                <li>Obscene, pornographic, or otherwise inappropriate</li>
              </ul>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Payment Terms</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                Our pricing and payment terms are as follows:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>We offer various subscription plans with different features and pricing</li>
                <li>Payment is required in advance for subscription services</li>
                <li>All fees are exclusive of taxes unless stated otherwise</li>
                <li>We may change our pricing with 30 days' notice</li>
                <li>Refunds are processed according to our refund policy</li>
              </ul>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Limitation of Liability</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                <li>We provide our services "as is" without warranties of any kind</li>
                <li>We are not liable for any indirect, consequential, or incidental damages</li>
                <li>Our total liability is limited to the amount you have paid us in the past 12 months</li>
              </ul>
              <p className="text-muted-foreground">
                Some jurisdictions do not allow the exclusion of certain warranties or limitations on liability,
                so some of the above limitations may not apply to you.
              </p>
            </Card>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Contact Us</h2>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-accent/5 p-4 rounded-lg mb-6">
                <p className="font-medium">Email: legal@aibrandcreator.com</p>
                <p className="font-medium">Address: 123 AI Street, San Francisco, CA 94103</p>
              </div>
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
            <Link href="/privacy">
              <Button variant="outline">
                Privacy Policy
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