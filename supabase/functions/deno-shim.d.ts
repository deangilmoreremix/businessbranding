// Minimal ambient declarations so the Edge Functions can be type-checked with `npm run check:edge` (tsc) without Deno.
// Supabase runs them on Deno; this only describes the parts they use.
declare const Deno: { env: { get(name: string): string | undefined; set(name: string, value: string): void; delete(name: string): void }; serve(handler: (req: Request) => Response | Promise<Response>): void };
declare module "https://deno.land/std@0.168.0/http/server.ts" { export function serve(handler: (req: Request) => Response | Promise<Response>): void }
declare module "https://esm.sh/@supabase/supabase-js@2.39.3" { export function createClient(url: string, key: string, opts?: unknown): any }
declare module "node:async_hooks" {
  export class AsyncLocalStorage<T> {
    run<R>(store: T, fn: () => R): R;
    getStore(): T | undefined;
  }
}
