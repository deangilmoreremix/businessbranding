'use client';

import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { VolumeX, Volume2, Settings } from 'lucide-react';

interface VoiceControlsProps {
  onVolumeChange?: (value: number) => void;
  onStabilityChange?: (value: number) => void;
  onSimilarityBoostChange?: (value: number) => void;
  onStyleChange?: (value: number) => void;
  onSpeakerBoostChange?: (enabled: boolean) => void;
  volume?: number;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
}

export function VoiceControls({
  onVolumeChange,
  onStabilityChange,
  onSimilarityBoostChange,
  onStyleChange,
  onSpeakerBoostChange,
  volume = 0.5,
  stability = 0.5,
  similarityBoost = 0.75,
  style = 0.5,
  speakerBoost = false
}: VoiceControlsProps) {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Voice Controls
        </h3>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Volume</Label>
            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4" />
              <Slider
                value={[volume * 100]}
                onValueChange={([value]) => onVolumeChange?.(value / 100)}
                max={100}
                step={1}
                className="w-[120px]"
              />
              <Volume2 className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Stability ({Math.round(stability * 100)}%)</Label>
          <Slider
            value={[stability * 100]}
            onValueChange={([value]) => onStabilityChange?.(value / 100)}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Similarity Boost ({Math.round(similarityBoost * 100)}%)</Label>
          <Slider
            value={[similarityBoost * 100]}
            onValueChange={([value]) => onSimilarityBoostChange?.(value / 100)}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>Style Intensity ({Math.round(style * 100)}%)</Label>
          <Slider
            value={[style * 100]}
            onValueChange={([value]) => onStyleChange?.(value / 100)}
            max={100}
            step={1}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Speaker Boost</Label>
          <Switch
            checked={speakerBoost}
            onCheckedChange={onSpeakerBoostChange}
          />
        </div>
      </div>
    </Card>
  );
}