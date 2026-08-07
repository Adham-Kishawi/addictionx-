"use client";

// Root error boundary — shown when even the layout fails. Brand-styled minimal fallback.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" dir="ltr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p
            style={{
              fontSize: 56,
              fontWeight: 700,
              margin: 0,
              color: "#ef4444",
            }}
          >
            500
          </p>
          <h1 style={{ fontSize: 22, margin: "12px 0 6px" }}>
            ADDICTIONX — Something went wrong
          </h1>
          <p style={{ color: "#9ca3af", margin: "0 0 20px" }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              borderRadius: 9999,
              border: "1px solid rgba(239,68,68,0.4)",
              background: "rgba(239,68,68,0.15)",
              color: "#fca5a5",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
