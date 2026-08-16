export const dynamic = "force-dynamic";

export async function GET() {
  const keys = Object.keys(process.env)
    .filter((k) => k.startsWith("AUTH_") || k.startsWith("NEXTAUTH"))
    .sort();
  return Response.json({
    hasGoogleId: Boolean(process.env.AUTH_GOOGLE_ID),
    googleIdLength: (process.env.AUTH_GOOGLE_ID ?? "").length,
    googleIdLengthOk: (process.env.AUTH_GOOGLE_ID ?? "").length === 72,
    hasGoogleSecret: Boolean(process.env.AUTH_GOOGLE_SECRET),
    googleSecretLength: (process.env.AUTH_GOOGLE_SECRET ?? "").length,
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
    hasTrustHost: Boolean(process.env.AUTH_TRUST_HOST),
    authKeys: keys,
  });
}
