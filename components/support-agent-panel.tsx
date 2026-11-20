'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssistantChat } from '@/components/brand-analysis/assistant-chat';
import { LiveVoice } from '@/components/voice-interface/live-voice';

/** Chat + live voice content of the support assistant. Loaded only when the assistant is opened. */
export default function SupportAgentPanel() {
  return (
    <Tabs defaultValue="chat">
      <TabsContent value="chat">
        <AssistantChat mode="support" analysis={null} />
      </TabsContent>
      <TabsContent value="voice">
        <LiveVoice instructions="You are the support voice assistant for an AI brand-building platform. Answer questions about brand analysis, visual identity and voice content. Keep replies short and friendly." />
      </TabsContent>
      <TabsList className="mt-3">
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="voice">Voice</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
