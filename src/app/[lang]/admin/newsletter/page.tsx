import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { NewsletterActions } from "@/components/admin/newsletter-actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminNewsletterPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission("newsletter");
  const [{ lang }, { page }] = await Promise.all([params, searchParams]);
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const currentPage = Math.max(1, Number(page) || 1);

  const [entries, totalEntries] = await Promise.all([
    prisma.newsletterEntry.findMany({
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.newsletterEntry.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

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
                <th className="px-4 py-3 text-start font-medium">
                  {dict.account.email}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.date}
                </th>
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

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/${locale}/admin/newsletter${p > 1 ? `?page=${p}` : ""}`}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                currentPage === p
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
