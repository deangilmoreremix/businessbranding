'use client';

/** Last-resort fallback when the root layout itself fails. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 32, textAlign: 'center' }}>
        <h1>The application could not be displayed</h1>
        <p>Please try again.</p>
        <button type="button" onClick={reset}>Try Again</button>
      </body>
    </html>
  );
}
