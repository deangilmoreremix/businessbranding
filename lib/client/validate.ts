/** Raised when a reply is not the shape we asked for (HTML, `{}`, truncated JSON, wrong types). Shown as "unreadable response" + Try Again. */
export class UnreadableResponseError extends Error {
  constructor(message = 'The service returned an unreadable response.') {
    super(message);
    this.name = 'UnreadableResponseError';
  }
}

export const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Parse a Response body as JSON; any parser failure becomes an UnreadableResponseError (never a raw "Unexpected token '<'"). */
export async function readJson<T = any>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new UnreadableResponseError();
  }
}

/** Require an object with the given keys present (non-null) or throw UnreadableResponseError. `arrays` must additionally be arrays. */
export function requireShape<T extends Record<string, any>>(value: unknown, keys: string[], arrays: string[] = []): T {
  if (!isObj(value)) throw new UnreadableResponseError();
  for (const k of keys) if (value[k] === undefined || value[k] === null) throw new UnreadableResponseError();
  for (const k of arrays) if (!Array.isArray(value[k])) throw new UnreadableResponseError();
  return value as T;
}
