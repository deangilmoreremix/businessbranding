'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Key,
  Lock,
  Mail,
  Globe,
  ArrowRight,
  Save,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { safeNextPath } from '@/lib/auth-redirect';
import { OpenAIKeySettings } from '@/components/settings/openai-key-settings';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  // Controlled so a /settings#ai link (from the "Add your OpenAI key" notice) opens the OpenAI tab without a hydration mismatch.
  const [tab, setTab] = useState('profile');
  const [welcome, setWelcome] = useState<{ next: string } | null>(null);
  const [hasKey, setHasKey] = useState(false);
  useEffect(() => {
    if (window.location.hash === '#ai') setTab('ai');
    // first sign-in: /settings?welcome=1&next=<where the user was going>#ai
    const q = new URLSearchParams(window.location.search);
    if (q.get('welcome') === '1') {
      setTab('ai');
      setWelcome({ next: safeNextPath(q.get('next')) });
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

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
            <Badge className="text-sm px-3">SETTINGS</Badge>
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-bold gradient-text mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Account Settings
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Manage your account preferences and settings
          </motion.p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              OpenAI
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input placeholder="Company Name" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input type="url" placeholder="https://example.com" />
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Brand Updates</h3>
                    <p className="text-sm text-muted-foreground">Get notified about brand changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Security Alerts</h3>
                    <p className="text-sm text-muted-foreground">Important security notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Marketing Updates</h3>
                    <p className="text-sm text-muted-foreground">Receive marketing communications</p>
                  </div>
                  <Switch />
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" />
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Update Security
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            {welcome && (
              <div role="status" data-testid="welcome-key-prompt" className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm">
                <p className="font-medium">Welcome! Add your OpenAI key to turn on AI features.</p>
                <p className="text-muted-foreground mt-1">This app uses your own OpenAI API key, stored encrypted. You can also do this later in Settings.</p>
                <Link href={welcome.next} data-testid="welcome-continue" className="mt-2 inline-block font-medium underline">
                  {hasKey ? 'Continue' : 'Skip for now'}
                </Link>
              </div>
            )}
            <OpenAIKeySettings onStatus={setHasKey} />
          </TabsContent>

          <TabsContent value="billing">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Billing Information</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Card Number</Label>
                    <Input placeholder="**** **** **** ****" />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration Date</Label>
                    <Input placeholder="MM/YY" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CVV</Label>
                    <Input placeholder="***" />
                  </div>
                  <div className="space-y-2">
                    <Label>Zip Code</Label>
                    <Input placeholder="12345" />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Billing
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-16 text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-12"
        >
          <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Our support team is here to help you with any questions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              Contact Support
            </Button>
            <Button size="lg" variant="outline">
              View Documentation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}