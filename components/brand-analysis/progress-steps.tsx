'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Target, BarChart, FileText } from 'lucide-react';

interface ProgressStepsProps {
  currentStep: number;
  progress: number;
}

const steps = [
  { id: 'data', name: 'Data Collection', icon: Brain },
  { id: 'analysis', name: 'Brand Analysis', icon: BarChart },
  { id: 'competitive', name: 'Competitive Analysis', icon: Target },
  { id: 'report', name: 'Report Generation', icon: FileText }
];

export function ProgressSteps({ currentStep, progress }: ProgressStepsProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span>{steps[currentStep].name}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className={`flex flex-col items-center p-2 rounded-lg ${
                index === currentStep ? 'bg-accent/50' :
                index < currentStep ? 'bg-accent/20' : ''
              }`}
              animate={{
                scale: index === currentStep ? 1.05 : 1,
                opacity: index > currentStep ? 0.5 : 1
              }}
            >
              <step.icon className={`h-5 w-5 ${
                index === currentStep ? 'text-blue-400 animate-pulse' :
                index < currentStep ? 'text-green-400' : 'text-muted-foreground'
              }`} />
              <span className="text-xs mt-1">{step.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}