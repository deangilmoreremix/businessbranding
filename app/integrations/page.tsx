'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Database,
  Cloud,
  Link as LinkIcon,
  ArrowRight,
  CheckCircle,
  Settings,
  Shield,
  Lock,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const integrations = [
  {
    title: 'Supabase',
    description: 'Secure database and authentication',
    icon: Database,
    status: 'Connected',
    color: 'emerald'
  },
  {
    title: 'ElevenLabs',
    description: 'AI voice generation',
    icon: Cloud,
    status: 'Connected',
    color: 'blue'
  },
  {
    title: 'Gemini',
    description: 'AI content generation',
    icon: Zap,
    status: 'Connected',
    color: 'purple'
  },
  {
    title: 'Recraft',
    description: 'AI image generation',
    icon: Settings,
    status: 'Connected',
    color: 'indigo'
  }
];

const securityFeatures = [
  {
    title: 'End-to-End Encryption',
    description: 'All data is encrypted in transit and at rest',
    icon: Lock
  },
  {
    title: 'Regular Backups',
    description: 'Automated daily backups of all your data',
    icon: RefreshCw
  },
  {
    title: 'Access Control',
    description: 'Fine-grained permissions and role-based access',
    icon: Shield
  }
];

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto px-4 py-16 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-2"
          >
            <Badge className="text-sm px-3">INTEGRATIONS</Badge>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold gradient-text mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Connected Services
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Manage your integrations and connected services
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
            >
              <Card className={`p-6 bg-${integration.color}-500/5 border-${integration.color}-500/20`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg bg-${integration.color}-500/20 flex items-center justify-center`}>
                      <integration.icon className={`h-6 w-6 text-${integration.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{integration.title}</h3>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {integration.status}
                  </Badge>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    Configure
                    <Settings className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Security & Privacy</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your data is protected with enterprise-grade security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + (index * 0.1) }}
              >
                <Card className="p-6 bg-accent/5 border-accent/20">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-12"
        >
          <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Our support team is here to help you with integration setup and configuration
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              Contact Support
            </Button>
            <Link href="/docs">
              <Button size="lg" variant="outline">
                View Documentation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}