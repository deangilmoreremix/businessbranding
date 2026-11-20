// Offline stub so edge functions can be loaded without network access.
export function createClient() {
  return { from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'row_1' }, error: null }) }) }) }) };
}
