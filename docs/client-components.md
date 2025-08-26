# Client-Side Components Guide for Next.js

## Understanding Hydration Issues

Hydration mismatches occur when the server-rendered HTML doesn't match the client-side React tree. Common causes:

1. Using browser APIs during render
2. Different content between server and client
3. Time-dependent rendering
4. Accessing window/document before hydration

## Solutions and Patterns

### 1. Basic Client Component Pattern

```tsx
'use client';

import { useEffect, useState } from 'react';

export function ClientComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div>
      {/* Client-side only content */}
    </div>
  );
}
```

### 2. Dynamic Imports with Loading States

```tsx
// components/feature/index.tsx
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/loading-spinner';

const FeatureClient = dynamic(
  () => import('./feature-client').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <LoadingSpinner message="Loading feature..." />
  }
);

export { FeatureClient as Feature };

// components/feature/feature-client.tsx
'use client';

import { useEffect, useState } from 'react';

export default function FeatureClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    // Component content
  );
}
```

### 3. Layout Pattern for Client-Side Wrappers

```tsx
// app/client-layout.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div>
      {mounted ? children : null}
      {/* Client-side only features */}
    </div>
  );
}

// app/layout.tsx
import ClientLayout from './client-layout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
```

### 4. Loading Component Pattern

```tsx
// components/loading-spinner.tsx
'use client';

import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">{message}</span>
    </div>
  );
}
```

## Best Practices

1. **Component Organization**
   - Keep client components in separate files
   - Use barrel files for clean imports
   - Group related components together

2. **Performance Optimization**
   - Use dynamic imports for large client components
   - Implement loading states for better UX
   - Split code into smaller chunks

3. **State Management**
   - Initialize state after mount
   - Use loading states during hydration
   - Handle undefined states gracefully

4. **Error Handling**
   - Implement error boundaries
   - Provide fallback UI
   - Log errors appropriately

## Testing Recommendations

1. **Unit Tests**
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ClientComponent } from './client-component';

describe('ClientComponent', () => {
  it('renders after mounting', async () => {
    render(<ClientComponent />);
    
    // Initially nothing should be rendered
    expect(screen.queryByTestId('client-content')).not.toBeInTheDocument();
    
    // Content should appear after mounting
    await waitFor(() => {
      expect(screen.getByTestId('client-content')).toBeInTheDocument();
    });
  });
});
```

2. **Integration Tests**
```tsx
import { render, screen, act } from '@testing-library/react';
import { ClientFeature } from './client-feature';

describe('ClientFeature Integration', () => {
  beforeAll(() => {
    // Mock window methods
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }))
    });
  });

  it('integrates with browser APIs correctly', async () => {
    render(<ClientFeature />);
    
    // Wait for mounting and API calls
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(screen.getByRole('button')).toBeEnabled();
  });
});
```

## Common Pitfalls

1. **Avoid Direct Browser API Usage in Render**
```tsx
// ❌ Wrong
function Component() {
  const width = window.innerWidth;
  return <div>{width}</div>;
}

// ✅ Correct
function Component() {
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);
  
  if (!width) return null;
  return <div>{width}</div>;
}
```

2. **Handle Undefined States**
```tsx
// ❌ Wrong
function Component() {
  const [data, setData] = useState(null);
  return <div>{data.value}</div>; // Will throw error
}

// ✅ Correct
function Component() {
  const [data, setData] = useState(null);
  
  if (!data) return null;
  return <div>{data.value}</div>;
}
```

## Performance Considerations

1. **Code Splitting**
```tsx
// Dynamically import heavy components
const HeavyFeature = dynamic(() => import('./heavy-feature'), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading feature..." />
});
```

2. **Lazy Loading**
```tsx
// Lazy load below-the-fold content
const BelowFold = dynamic(() => import('./below-fold'), {
  loading: () => <LoadingSpinner />,
  ssr: true
});
```

3. **Optimized Re-renders**
```tsx
// Use memo for expensive computations
const MemoizedChart = memo(function Chart({ data }) {
  return (
    <ResponsiveContainer>
      <LineChart data={data}>
        {/* Chart components */}
      </LineChart>
    </ResponsiveContainer>
  );
});
```

## Edge Cases

1. **Third-party Library Integration**
```tsx
function ThirdPartyComponent() {
  const [lib, setLib] = useState(null);
  
  useEffect(() => {
    import('third-party-lib').then(module => {
      setLib(module.default);
    });
  }, []);
  
  if (!lib) return <LoadingSpinner />;
  return <lib.Component />;
}
```

2. **Window Event Listeners**
```tsx
function EventComponent() {
  const [event, setEvent] = useState(null);
  
  useEffect(() => {
    const handler = (e) => setEvent(e);
    window.addEventListener('custom-event', handler);
    return () => window.removeEventListener('custom-event', handler);
  }, []);
  
  return <div>{event?.detail}</div>;
}
```

## Debugging Tips

1. Use React DevTools to inspect component tree
2. Check for hydration warnings in console
3. Use React.StrictMode to catch issues
4. Implement error boundaries for graceful failures

## Conclusion

Following these patterns ensures:
- Consistent rendering between server and client
- Smooth hydration process
- Better performance and user experience
- Maintainable and testable code