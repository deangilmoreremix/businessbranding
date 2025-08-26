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
# Business Analyzer Component

The Business Analyzer component provides tools for analyzing a business's online presence and brand strategy.

## Features

### Website Analysis
- Scrapes website content
- Extracts social media links
- Analyzes website structure
- Identifies brand elements

### Social Media Analysis
- Detects social media profiles
- Analyzes social media engagement
- Provides platform-specific insights
- Tracks social performance

### Brand Analysis
- Comprehensive brand health check
- Competitive benchmarking
- Market position analysis
- Growth opportunity identification

### Data Visualization
- Interactive charts
- Performance metrics
- Trend analysis
- Comparative views

## Usage

\`\`\`tsx
import { BusinessAnalyzer } from '@/components/business-analyzer';

export default function BrandStrategyPage() {
  const handleAnalysisComplete = (info) => {
    console.log('Analysis complete:', info);
  };

  return (
    <BusinessAnalyzer onAnalysisComplete={handleAnalysisComplete} />
  );
}
\`\`\`

## Props

| Prop | Type | Description |
|------|------|-------------|
| onAnalysisComplete | function | Callback when analysis completes |

## Events

The component emits the following events:

- **onAnalysisComplete**: Called when analysis is finished
- **onError**: Called if analysis fails
- **onProgress**: Progress updates during analysis

## Examples

### Basic Usage
\`\`\`tsx
<BusinessAnalyzer 
  onAnalysisComplete={handleResults}
/>
\`\`\`

### With Custom Styling
\`\`\`tsx
<BusinessAnalyzer
  className="custom-analyzer"
  style={{ maxWidth: '800px' }}
  onAnalysisComplete={handleResults}
/>
\`\`\`

### With Error Handling
\`\`\`tsx
<BusinessAnalyzer
  onAnalysisComplete={handleResults}
  onError={(error) => console.error('Analysis failed:', error)}
/>
\`\`\`

## Best Practices

1. **Website Analysis**
   - Provide complete URLs
   - Ensure website accessibility
   - Include all relevant pages

2. **Social Media Links**
   - Use official profile URLs
   - Verify link accuracy
   - Include all active platforms

3. **Data Handling**
   - Save analysis results
   - Track changes over time
   - Export important metrics

4. **Error Handling**
   - Implement proper error handling
   - Provide user feedback
   - Retry failed operations

## Integration Tips

1. **With Brand Analysis**
   \`\`\`tsx
   <BusinessAnalyzer
     onAnalysisComplete={(info) => {
       // Pass results to BrandAnalysis component
       setBrandInfo(info);
     }}
   />
   \`\`\`

2. **With Visual Identity**
   \`\`\`tsx
   <BusinessAnalyzer
     onAnalysisComplete={(info) => {
       // Use results for visual identity generation
       generateVisualIdentity(info);
     }}
   />
   \`\`\`

3. **With Voice Content**
   \`\`\`tsx
   <BusinessAnalyzer
     onAnalysisComplete={(info) => {
       // Generate voice content based on analysis
       createVoiceContent(info);
     }}
   />
   \`\`\`

## Performance Optimization

1. **Efficient Analysis**
   - Cache analysis results
   - Implement progressive loading
   - Optimize API calls

2. **Resource Management**
   - Handle large datasets efficiently
   - Implement pagination
   - Use data compression

3. **User Experience**
   - Show loading states
   - Provide progress feedback
   - Enable cancellation
`;

export default function BusinessAnalyzerPage() {
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
            <Link href="/docs/components/brand-analysis">
              Next Component
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}