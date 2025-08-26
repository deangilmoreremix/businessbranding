'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Globe, 
  Database, 
  Cloud,
  Save,
  Loader2,
  Sparkles
} from 'lucide-react';

export function VoiceSettings() {
  const [settings, setSettings] = useState({
    audioQuality: 'high',
    language: 'en',
    storageLocation: 'cloud',
    defaultFormat: 'mp3',
    autoBackup: true,
    compressionLevel: 'medium'
  });
  const [saving, setSaving] = useState(false);

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Settings className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium">Voice Settings</h3>
            <p className="text-sm text-muted-foreground">
              Configure voice generation preferences
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Audio Quality</Label>
              <Select 
                value={settings.audioQuality}
                onValueChange={(value) => setSettings(prev => ({ ...prev, audioQuality: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="low">Low (64kbps)</SelectItem>
                    <SelectItem value="medium">Medium (128kbps)</SelectItem>
                    <SelectItem value="high">High (256kbps)</SelectItem>
                    <SelectItem value="ultra">Ultra (320kbps)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Language</Label>
              <Select 
                value={settings.language}
                onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Storage Location</Label>
              <Select 
                value={settings.storageLocation}
                onValueChange={(value) => setSettings(prev => ({ ...prev, storageLocation: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select storage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="local">Local Storage</SelectItem>
                    <SelectItem value="cloud">Cloud Storage</SelectItem>
                    <SelectItem value="hybrid">Hybrid Storage</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Default Export Format</Label>
              <Select 
                value={settings.defaultFormat}
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="mp3">MP3</SelectItem>
                    <SelectItem value="wav">WAV</SelectItem>
                    <SelectItem value="ogg">OGG</SelectItem>
                    <SelectItem value="m4a">M4A</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Compression Level</Label>
              <Select 
                value={settings.compressionLevel}
                onValueChange={(value) => setSettings(prev => ({ ...prev, compressionLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select compression" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">No Compression</SelectItem>
                    <SelectItem value="low">Low Compression</SelectItem>
                    <SelectItem value="medium">Medium Compression</SelectItem>
                    <SelectItem value="high">High Compression</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable Cloud Backup</Label>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
              />
            </div>
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <h4 className="font-medium">API Usage</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly Usage</span>
              <span>25%</span>
            </div>
            <Progress value={25} className="h-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Characters Used</p>
              <p className="font-medium">25,000 / 100,000</p>
            </div>
            <div>
              <p className="text-muted-foreground">API Calls</p>
              <p className="font-medium">120 / 500</p>
            </div>
            <div>
              <p className="text-muted-foreground">Reset Date</p>
              <p className="font-medium">May 1, 2025</p>
            </div>
          </div>
        </Card>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => {
            // Reset settings to defaults
            setSettings({
              audioQuality: 'high',
              language: 'en',
              storageLocation: 'cloud',
              defaultFormat: 'mp3',
              autoBackup: true,
              compressionLevel: 'medium'
            });
          }}>
            Reset to Defaults
          </Button>
          
          <Button 
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-grow">
              <h4 className="font-medium">Upgrade for More Features</h4>
              <p className="text-sm text-muted-foreground">Get access to premium voices, higher quality, and more.</p>
            </div>
            <Button>Upgrade</Button>
          </div>
        </Card>
      </div>
    </Card>
  );
}