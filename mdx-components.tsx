import type { MDXComponents } from 'mdx/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl mb-4" {...props} />,
    h2: (props) => <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight mt-10 mb-4" {...props} />,
    h3: (props) => <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4" {...props} />,
    p: (props) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />,
    a: (props) => <Link {...props} className="text-blue-500 hover:text-blue-700 hover:underline" />,
    pre: (props) => (
      <Card className="p-4 my-6 overflow-x-auto">
        <pre {...props} />
      </Card>
    ),
    code: (props) => <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm" {...props} />,
    ul: (props) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />,
    ol: (props) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />,
    ...components,
  };
}