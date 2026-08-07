import { prisma } from "@/lib/prisma";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { NewsletterActions } from "@/components/admin/newsletter-actions";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const entries = await prisma.newsletterEntry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.newsletter}
      </h1>

      {entries.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {dict.admin.newsletterEmpty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">Email</th>
                <th className="px-4 py-3 text-start font-medium">Date</th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.status}
                </th>
                <th className="px-4 py-3 text-end font-medium">
                  {dict.admin.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-4 py-3 font-medium" dir="ltr">
                    {entry.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                    {entry.createdAt.toLocaleDateString(
                      locale === "ar" ? "ar-EG" : "en-US",
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        entry.isActive
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {entry.isActive
                        ? dict.admin.newsletterActive
                        : dict.admin.newsletterInactive}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <NewsletterActions
                      email={entry.email}
                      isActive={entry.isActive}
                      dict={dict}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
