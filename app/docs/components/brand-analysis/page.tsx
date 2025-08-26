'use client';

import { MDXProvider } from '@mdx-js/react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const components = {
  h1: (props: any) => <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl mb-4" {...props} />,
  h2: (props: any) => <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight mt-10 mb-4" {...props} />,
  h3: (props: any) => <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4" {...props} />,
  p: (props: any) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />,
  a: (props: any) => <Link {...props} className="text-blue-500 hover:text-blue-700 hover:underline" />,
  pre: (props: any) => (
    <Card className="p-4 my-6 overflow-x-auto">
      <pre {...props} />
    </Card>
  ),
  code: (props: any) => <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm" {...props} />,
  ul: (props: any) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />,
  ol: (props: any) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />,
};

const content = `
# Brand Analysis Component

The Brand Analysis component provides comprehensive AI-powered analysis of your brand strategy across multiple dimensions.

## Features

### Analysis Dashboard
- Real-time brand health monitoring
- Competitive benchmarking
- Market position tracking
- Growth trajectory analysis

### Brand Pillars
- 20-point brand strategy analysis
- Detailed insights for each pillar
- Improvement recommendations
- Progress tracking

### Performance Metrics
- Brand health score
- Market fit assessment
- Engagement analytics
- Growth indicators

### Visualization
- Interactive charts and graphs
- Trend analysis
- Comparative visualizations
- Performance dashboards

## Usage

\`\`\`tsx
import { BrandAnalysis } from '@/components/brand-analysis';

export default function BrandStrategyPage() {
  const handleAnalysisComplete = (analysis) => {
    console.log('Analysis complete:', analysis);
  };

  return (
    <BrandAnalysis
      businessIdea="Your business description"
      websiteUrl="https://example.com"
      onAnalysisComplete={handleAnalysisComplete}
    />
  );
}
\`\`\`

## Props

| Prop | Type | Description |
|------|------|-------------|
| businessIdea | string | Business description or concept |
| websiteUrl | string | Optional website URL for analysis |
| onAnalysisComplete | function | Callback when analysis completes |

## Events

The component emits the following events:

- **onAnalysisComplete**: Called when analysis is finished
- **onError**: Called if analysis fails
- **onProgress**: Progress updates during analysis

## Examples

### Basic Usage
\`\`\`tsx
<BrandAnalysis 
  businessIdea="Tech startup focused on AI solutions"
  onAnalysisComplete={handleResults}
/>
\`\`\`

### With Website Analysis
\`\`\`tsx
<BrandAnalysis
  businessIdea="E-commerce fashion brand"
  websiteUrl="https://example.com"
  onAnalysisComplete={handleResults}
/>
\`\`\`

### With Custom Styling
\`\`\`tsx
<BrandAnalysis
  businessIdea="Local restaurant chain"
  className="custom-analysis"
  style={{ maxWidth: '800px' }}
/>
\`\`\`

## Best Practices

1. **Provide Clear Business Description**
   - Be specific about your business
   - Include key differentiators
   - Mention target market

2. **Website Analysis**
   - Use complete URLs
   - Ensure website is accessible
   - Include main business pages

3. **Handle Results**
   - Save analysis results
   - Track changes over time
   - Act on recommendations

4. **Regular Updates**
   - Run analysis periodically
   - Compare with previous results
   - Monitor improvements
`;

export default function BrandAnalysisPage() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-5 w-5 text-blue-500" />
          <Badge>Component</Badge>
        </div>
        
        <MDXProvider components={components}>
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </MDXProvider>

        <div className="mt-12 flex justify-between items-center">
          <Button variant="outline" asChild>
            <Link href="/docs">
              Back to Components
            </Link>
          </Button>
          <Button asChild>
            <Link href="/docs/components/visual-identity-analyzer">
              Next Component
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}