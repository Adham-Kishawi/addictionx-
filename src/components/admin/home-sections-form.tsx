"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Save } from "lucide-react";
import {
  updateHomeSections,
  type UserActionState,
} from "@/features/admin/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { Switch } from "@/components/ui/switch";

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

export function HomeSectionsForm({
  dict,
  showCollections,
  eyebrow,
  title,
  subtitle,
}: {
  dict: Dictionary;
  showCollections: boolean;
  eyebrow: { ar: string; en: string };
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
}) {
  const router = useRouter();
  const [show, setShow] = useState(showCollections);
  const [eyebrowAr, setEyebrowAr] = useState(eyebrow.ar);
  const [eyebrowEn, setEyebrowEn] = useState(eyebrow.en);
  const [titleAr, setTitleAr] = useState(title.ar);
  const [titleEn, setTitleEn] = useState(title.en);
  const [subtitleAr, setSubtitleAr] = useState(subtitle.ar);
  const [subtitleEn, setSubtitleEn] = useState(subtitle.en);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<UserActionState>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState({});
    const fd = new FormData();
    if (show) fd.set("showCollections", "on");
    fd.set("collectionsEyebrowAr", eyebrowAr);
    fd.set("collectionsEyebrowEn", eyebrowEn);
    fd.set("collectionsTitleAr", titleAr);
    fd.set("collectionsTitleEn", titleEn);
    fd.set("collectionsSubtitleAr", subtitleAr);
    fd.set("collectionsSubtitleEn", subtitleEn);
    const res = await updateHomeSections(undefined, fd);
    setState(res);
    setPending(false);
    if (res.success) router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium">
        <span className="flex-1">{dict.admin.showCollections}</span>
        <Switch
          checked={show}
          onChange={setShow}
          name="showCollections"
          label={dict.admin.showCollections}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {dict.admin.collectionsEyebrow} (AR)
          </span>
          <input
            type="text"
            value={eyebrowAr}
            onChange={(e) => setEyebrowAr(e.target.value)}
            className={inputClass}
            placeholder="مجموعاتنا"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {dict.admin.collectionsEyebrow} (EN)
          </span>
          <input
            type="text"
            value={eyebrowEn}
            onChange={(e) => setEyebrowEn(e.target.value)}
            className={inputClass}
            dir="ltr"
            placeholder="Our Collections"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {dict.admin.collectionsTitle} (AR)
          </span>
          <input
            type="text"
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            className={inputClass}
            placeholder="مجموعاتنا"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {dict.admin.collectionsTitle} (EN)
          </span>
          <input
            type="text"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className={inputClass}
            dir="ltr"
            placeholder="Our Collections"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-muted-foreground">
            {dict.admin.collectionsSubtitle} (AR)
          </span>
          <input
            type="text"
            value={subtitleAr}
            onChange={(e) => setSubtitleAr(e.target.value)}
            className={inputClass}
            placeholder="ثلاث حالات مزاجية، عوالم كاملة"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-muted-foreground">
            {dict.admin.collectionsSubtitle} (EN)
          </span>
          <input
            type="text"
            value={subtitleEn}
            onChange={(e) => setSubtitleEn(e.target.value)}
            className={inputClass}
            dir="ltr"
            placeholder="Three moods, entire worlds"
          />
        </label>
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">
        {dict.admin.fieldsOptional}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Save className="size-4" />
          {dict.admin.save}
        </button>
        {state.success && (
          <span className="flex items-center gap-1 text-sm text-emerald-500">
            <Check className="size-4" />
            {dict.admin.collectionsSettingsSaved}
          </span>
        )}
        {state.error && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {dict.admin.errorGeneric}
          </span>
        )}
      </div>
    </form>
  );
}
