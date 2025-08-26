'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { createAgent, sendMessage, getWidgetCode } from '@/lib/services/eleven-labs';
import { MessageSquare, X, Loader2, Code, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SupportAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'agent'; content: string }[]>([]);
  const [widgetCode, setWidgetCode] = useState('');
  const [widgetTheme, setWidgetTheme] = useState<'light' | 'dark'>('dark');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');

  useEffect(() => {
    if (isOpen) {
      loadWidgetCode();
    }
  }, [isOpen, widgetTheme, widgetPosition]);

  const loadWidgetCode = async () => {
    try {
      const code = await getWidgetCode({
        theme: widgetTheme,
        position: widgetPosition
      });
      setWidgetCode(code);
    } catch (error) {
      console.error('Failed to load widget code:', error);
      // Set a fallback widget code in case of error
      setWidgetCode(`
        <!-- Fallback Widget Code -->
        <div id="support-widget" style="position: fixed; right: 20px; bottom: 20px; width: 400px; height: 600px; background-color: #1a1a1a; color: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 9999;">
          <div style="padding: 16px; border-bottom: 1px solid #333333;">
            <h3 style="margin: 0; font-size: 16px;">AI Support Agent</h3>
          </div>
          <div style="padding: 16px; height: calc(100% - 120px); overflow-y: auto;">
            <p style="margin-bottom: 12px;">Hello! How can I help you today?</p>
          </div>
          <div style="padding: 16px; border-top: 1px solid #333333; display: flex;">
            <input type="text" placeholder="Type your message..." style="flex: 1; padding: 8px 12px; border-radius: 4px; border: 1px solid #333333; background: #2a2a2a; color: white;">
            <button style="margin-left: 8px; padding: 8px 16px; background-color: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer;">Send</button>
          </div>
        </div>
      `);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    const userMessage = message;
    setMessage('');
    
    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await sendMessage(userMessage);
      // Add agent response to conversation
      setConversation(prev => [...prev, { role: 'agent', content: response }]);
    } catch (error) {
      console.error('Failed to get agent response:', error);
      // Add fallback response in case of error
      setConversation(prev => [...prev, { 
        role: 'agent', 
        content: "I'm sorry, I'm having trouble connecting to my knowledge base. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-96 p-4 glass-card shadow-xl">
          <Tabs defaultValue="chat">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="widget">Widget</TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <TabsContent value="chat">
              <div className="h-64 overflow-y-auto mb-4 space-y-4">
                {conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500/10 ml-8'
                        : 'bg-purple-500/10 mr-8'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can I help you?"
                  className="resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !message.trim()}
                >
                  Send
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="widget" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Theme</label>
                  <Select value={widgetTheme} onValueChange={(value: 'light' | 'dark') => setWidgetTheme(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Position</label>
                  <Select value={widgetPosition} onValueChange={(value: 'bottom-right' | 'bottom-left') => setWidgetPosition(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Embed Code</label>
                  <div className="relative">
                    <pre className="p-4 bg-background/50 rounded-lg text-xs overflow-x-auto">
                      {widgetCode}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => navigator.clipboard.writeText(widgetCode)}
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => window.open('https://elevenlabs.io/docs/api-reference/convai/agents/widget', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      ) : (
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}