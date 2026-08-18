import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || token.length < 10) {
    return new Response("Invalid link", { status: 400 });
  }

  const entry = await prisma.newsletterEntry.findUnique({
    where: { unsubscribeToken: token },
    select: { id: true, isActive: true, email: true },
  });

  if (!entry) {
    return new Response("Link not recognised", { status: 404 });
  }

  if (!entry.isActive) {
    return unsubscribedPage(entry.email);
  }

  await prisma.newsletterEntry.update({
    where: { id: entry.id },
    data: { isActive: false },
  });

  return unsubscribedPage(entry.email);
}

function unsubscribedPage(email: string) {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Unsubscribed — ADDICTIONX</title></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;">
    <div style="max-width:480px;padding:40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">&#10003;</div>
      <h1 style="color:#f5c518;font-size:22px;margin:0 0 12px;">You've been unsubscribed</h1>
      <p style="color:#e8e8e8;font-size:15px;line-height:1.6;">
        <b>${email}</b> has been removed from the ADDICTIONX newsletter.
      </p>
      <p style="color:#666;font-size:12px;margin-top:24px;">
        Changed your mind? You can always resubscribe on our website.
      </p>
    </div>
  </body>
</html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
