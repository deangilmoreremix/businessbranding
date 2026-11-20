'use client';

import dynamic from 'next/dynamic';
// React Flow styles are scoped to this route so other pages do not load them
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { NavHeader } from '@/components/nav-header';

// React Flow is browser-only and sizeable: load it on demand.
const WorkflowBuilder = dynamic(() => import('@/components/local/workflow-builder'), {
  ssr: false,
  loading: () => <p className="text-sm text-muted-foreground">Loading workflow builder…</p>
});

export default function WorkflowsPage() {
  return (
    <>
      <NavHeader />
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-16 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Content workflows</h1>
          <p className="text-muted-foreground">Chain a brief into AI-written copy, a branded email and a voice-over. Everything is saved in this browser.</p>
        </div>
        <Card className="p-4"><WorkflowBuilder /></Card>
      </main>
    </>
  );
}
