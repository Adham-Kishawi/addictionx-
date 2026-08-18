// Shared Open Graph card — brand identity in a 1200×630 frame (ADDICTIONX:
// deep black + neon red + metallic + the Heartbeat line signature).

export const OG_SIZE = { width: 1200, height: 630 } as const;

// Open Graph routes run inside the Worker. Runtime filesystem access is not
// available there, so do not load local WOFF files with `node:fs`.
// Satori falls back to its built-in fonts, keeping social cards functional.
export const ogFonts = [];

export function ogCard({
  eyebrow,
  title,
  subtitle,
  accent = "#ef4444",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background:
          "linear-gradient(135deg, #0b0b0e 0%, #17131f 55%, #0b0b0e 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -170,
          left: "50%",
          marginLeft: -450,
          width: 900,
          height: 430,
          borderRadius: 9999,
          background: `radial-gradient(closest-side, ${accent}40, transparent 72%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -210,
          right: -170,
          width: 740,
          height: 410,
          borderRadius: 9999,
          background: `radial-gradient(closest-side, ${accent}2b, transparent 72%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "0 56px",
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.5em",
            color: accent,
            fontFamily: "Alexandria",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 112,
            fontWeight: 700,
            fontFamily: "Playfair",
            color: "#ffffff",
            lineHeight: 1.08,
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: 34,
              fontWeight: 400,
              fontFamily: "Alexandria",
              color: "#c9ccd6",
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        ) : null}
        <svg
          width="300"
          height="44"
          viewBox="0 0 300 44"
          style={{ marginTop: 14 }}
        >
          <path
            d="M0 22 H76 L84 22 Q88 6 98 22 L110 22 Q114 38 124 22 L132 22 H300"
            fill="none"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 30,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 400,
          letterSpacing: "0.6em",
          color: "#8b8f9a",
          fontFamily: "Alexandria",
        }}
      >
        ADDICTIONX
      </div>
    </div>
  );
}
