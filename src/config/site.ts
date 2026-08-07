export const siteConfig = {
  name: "ADDICTIONX",
  nameAr: "أديكشن إكس",
  tagline: "Feel the Rush",
  taglineAr: "عِش الإحساس",
  description: "متجر عطور فاخرة — عطور تُشعل الحواس بتجربة تسوق سينمائية.",
  url: "https://addictionx.com",
  locale: "ar-EG",
  lang: "ar",
  dir: "rtl" as const,
  currency: "EGP",
  currencySymbol: "ج.م",
  contactEmail: "addictionxshop@gmail.com",
  adminEmail: "addictionxshop@gmail.com",
  social: {
    instagram: "https://www.instagram.com/addictionn_x",
    tiktok: "https://www.tiktok.com/@addiction_x8",
  },
} as const;

export type SiteConfig = typeof siteConfig;
