'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, X } from 'lucide-react';
import { AssistantChat } from '@/components/brand-analysis/assistant-chat';
import { LiveVoice } from '@/components/voice-interface/live-voice';

/**
 * Floating support assistant powered by OpenAI: streaming text chat (Responses API) and live voice (Realtime API).
 */
export function SupportAgent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-96 p-4 glass-card shadow-xl">
          <Tabs defaultValue="chat">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close assistant">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <TabsContent value="chat">
              <AssistantChat mode="support" analysis={null} />
            </TabsContent>

            <TabsContent value="voice">
              <LiveVoice
                instructions="You are the support voice assistant for an AI brand-building platform. Answer questions about brand analysis, visual identity and voice content. Keep replies short and friendly."
              />
            </TabsContent>
          </Tabs>
        </Card>
      ) : (
        <Button onClick={() => setIsOpen(true)} className="rounded-full h-12 w-12 p-0 shadow-lg" aria-label="Open support assistant">
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
