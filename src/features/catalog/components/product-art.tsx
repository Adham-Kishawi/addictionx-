// عمل فني للمنتج — لو فيه صورة حقيقية تُعرض هي، وإلا تدرج لوني + زجاجة عطر متوهجة
import type { Product } from "@/features/catalog/data/products";

// shape مصغّر يكفي لعرض العمل الفني — يقبل الـ Product كاملًا أو snapshot السلة
export type ProductArtSource = Pick<Product, "art" | "nameEn"> & {
  image?: string;
};

export function ProductArt({
  product,
  className,
  showName = true,
}: {
  product: ProductArtSource;
  className?: string;
  showName?: boolean;
}) {
  if (product.image) {
    return (
      <div className={className} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={className}
      style={{
        background: `radial-gradient(120% 90% at 50% 0%, ${product.art.glow}33 0%, transparent 60%),
          linear-gradient(160deg, ${product.art.from} 0%, ${product.art.to} 100%)`,
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
        {/* زجاجة عطر */}
        <svg
          viewBox="0 0 48 96"
          className="w-12 shrink-0 opacity-90"
          style={{
            filter: `drop-shadow(0 0 18px ${product.art.glow}aa)`,
          }}
          fill="none"
        >
          <rect
            x="18"
            y="6"
            width="12"
            height="8"
            rx="1.5"
            fill="white"
            fillOpacity="0.85"
          />
          <rect
            x="14"
            y="14"
            width="20"
            height="8"
            rx="2"
            fill="white"
            fillOpacity="0.7"
          />
          <path
            d="M12 22 h24 v10 c0 6 -4 8 -4 14 h-16 c0 -6 -4 -8 -4 -14 z"
            fill="white"
            fillOpacity="0.22"
            stroke="white"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
          <path
            d="M18 46 c4 -3 8 -3 12 0 c-1.5 4 -4 6 -6 8 c-2 -2 -4.5 -4 -6 -8 z"
            fill="white"
            fillOpacity="0.16"
          />
        </svg>
        {showName && (
          <span
            className="text-[0.6rem] font-medium tracking-[0.35em] text-white/70 uppercase"
            dir="ltr"
          >
            {product.nameEn.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
