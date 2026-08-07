// Product model matching the Prisma schema structure — mock until the DB is wired
// Prices are integers in piasters (100 piasters = 1 EGP) per decision #3

export type Gender = "male" | "female" | "unisex";

export type PerfumeNotes = {
  top: string[];
  heart: string[];
  base: string[];
};

export type Product = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number; // in piasters
  compareAtPrice?: number; // in piasters
  // The default variant size in ml — set from DB (not available in the mock)
  sizeMl?: number;
  gender: Gender;
  collection: string;
  notes: PerfumeNotes;
  rating: number;
  reviewsCount: number;
  isNew: boolean;
  isBestseller: boolean;
  isSoldOut?: boolean;
  // If the image is missing, ProductArt with the gradient is shown
  image?: string;
  art: { from: string; to: string; glow: string };
};

export const collections = [
  { slug: "rush", nameAr: "الإحساس", nameEn: "The Rush" },
  { slug: "noir", nameAr: "الليل", nameEn: "Noir" },
  { slug: "gold", nameAr: "الذهبي", nameEn: "Golden Hour" },
] as const;

export const products: Product[] = [
  {
    id: "p1",
    slug: "red-rush",
    nameAr: "ريد راش",
    nameEn: "Red Rush",
    descriptionAr:
      "انفجار أدريالين نقي — زعفران حار وقرمزي لاذع يفتتح المساء، يتبعه قلب من الورد الدمشقي، ويستقر على قاعدة من خشب الأرز الداكن.",
    descriptionEn:
      "Pure adrenaline blast — fiery saffron and tart berry open the night, a Damascus rose heart, settling on a dark cedar base.",
    price: 185000,
    compareAtPrice: 220000,
    gender: "unisex",
    collection: "rush",
    notes: {
      top: ["زعفران", "توت أحمر"],
      heart: ["ورد دمشقي", "فلفل وردي"],
      base: ["خشب الأرز", "مسك داكن"],
    },
    rating: 4.9,
    reviewsCount: 214,
    isNew: true,
    isBestseller: true,
    art: { from: "#7f1d1d", to: "#450a0a", glow: "#ef4444" },
    image: "/uploads/prodact.png",
  },
  {
    id: "p2",
    slug: "midnight-noir",
    nameAr: "منتصف الليل",
    nameEn: "Midnight Noir",
    descriptionAr:
      "هيبة الليل بعبوة — عود ماليزي دخاني ممزوج بالفانيليا السوداء والباتشولي، لشخص يترك أثرًا قبل أن يغادر.",
    descriptionEn:
      "The night's gravity in a bottle — smoky Malaysian oud with black vanilla and patchouli, for those who leave an impression before leaving.",
    price: 240000,
    gender: "male",
    collection: "noir",
    notes: {
      top: ["برغموت", "فلفل أسود"],
      heart: ["عود ماليزي", "باتشولي"],
      base: ["فانيليا سوداء", "صندل"],
    },
    rating: 4.8,
    reviewsCount: 189,
    isNew: false,
    isBestseller: true,
    art: { from: "#1e1b4b", to: "#020617", glow: "#6366f1" },
    image: "/uploads/prodact.png",
  },
  {
    id: "p3",
    slug: "golden-hour",
    nameAr: "الساعة الذهبية",
    nameEn: "Golden Hour",
    descriptionAr:
      "دفء الشمس على الجلد — عنبر ذهبي وعسل مغربي وياسمين ليلي. عطر غروب يحول كل لحظة عادية إلى مشهد.",
    descriptionEn:
      "Sun on your skin — golden amber, Moroccan honey and night jasmine. A sunset scent that turns any moment into a scene.",
    price: 170000,
    gender: "female",
    collection: "gold",
    notes: {
      top: ["برغموت كالابريا", "كمثرى"],
      heart: ["ياسمين ليلي", "عسل"],
      base: ["عنبر ذهبي", "مسك أبيض"],
    },
    rating: 4.7,
    reviewsCount: 156,
    isNew: false,
    isBestseller: true,
    art: { from: "#78350f", to: "#451a03", glow: "#f59e0b" },
    image: "/uploads/prodact.png",
  },
  {
    id: "p4",
    slug: "velvet-rose",
    nameAr: "روز مخملية",
    nameEn: "Velvet Rose",
    descriptionAr:
      "وردة قرمزية ناعمة كالمخمل فوق قاعدة من فانيليا تاهيتي والمسك. عطر نسائي آسر بتوازن بين القوة والأنوثة.",
    descriptionEn:
      "A crimson rose as soft as velvet over Tahitian vanilla and musk. A captivating feminine scent balancing power and grace.",
    price: 195000,
    gender: "female",
    collection: "rush",
    notes: {
      top: ["ليتشي", "بيرغموت"],
      heart: ["وردة قرمزية", "بايونيا"],
      base: ["فانيليا تاهيتي", "مسك"],
    },
    rating: 4.6,
    reviewsCount: 98,
    isNew: true,
    isBestseller: false,
    art: { from: "#881337", to: "#4c0519", glow: "#fb7185" },
    image: "/uploads/prodact.png",
  },
  {
    id: "p5",
    slug: "oud-mystique",
    nameAr: "عود غامض",
    nameEn: "Oud Mystique",
    descriptionAr:
      "عود هندي فاخر محمّص بالتوابل الشرقية والجلد. عطر رجالي جريء لا يُنسى، يفرض حضوره في أي مكان.",
    descriptionEn:
      "Indian oud roasted with oriental spices and leather. A bold, unforgettable masculine scent that commands any room.",
    price: 260000,
    compareAtPrice: 300000,
    gender: "male",
    collection: "noir",
    notes: {
      top: ["زعفران", "توت"],
      heart: ["عود هندي", "جلد"],
      base: ["عنبر رمادي", "خشب الأرز"],
    },
    rating: 4.9,
    reviewsCount: 243,
    isNew: false,
    isBestseller: true,
    art: { from: "#27272a", to: "#09090b", glow: "#a1a1aa" },
    image: "/uploads/prodact.png",
  },
  {
    id: "p6",
    slug: "citrus-dream",
    nameAr: "حلم حمضي",
    nameEn: "Citrus Dream",
    descriptionAr:
      "انتعاش صيفي — ليمون صقلية وبرغموت مع أوراق النعناع، يخفت إلى قلب أبيض زهري. مثالي للنهار.",
    descriptionEn:
      "Summer freshness — Sicilian lemon and bergamot with mint leaves, fading into a white floral heart. Perfect for daytime.",
    price: 120000,
    gender: "unisex",
    collection: "gold",
    notes: {
      top: ["ليمون صقلية", "نعناع"],
      heart: ["زهر البرتقال", "زهر الأرز"],
      base: ["مسك أبيض", "خشب أشقر"],
    },
    rating: 4.5,
    reviewsCount: 74,
    isNew: true,
    isBestseller: false,
    art: { from: "#155e75", to: "#083344", glow: "#22d3ee" },
    image: "/uploads/prodact.png",
  },
  {
    id: "p7",
    slug: "smoke-signals",
    nameAr: "إشارات دخان",
    nameEn: "Smoke Signals",
    descriptionAr:
      "دخان معسول — شاي مدخّن وتبغ حلو مع قهوة تركية. عطر غامض يحكي قصة لم تكتمل.",
    descriptionEn:
      "Sweet smoke — smoked tea and tobacco with Turkish coffee. A mysterious scent telling an unfinished story.",
    price: 155000,
    gender: "male",
    collection: "noir",
    notes: {
      top: ["شاي مدخّن", "هيل"],
      heart: ["تبغ حلو", "قهوة"],
      base: ["فانيليا", "صندل"],
    },
    rating: 4.4,
    reviewsCount: 61,
    isNew: false,
    isBestseller: false,
    art: { from: "#3f2d20", to: "#1c120a", glow: "#d97706" },
    image: "/uploads/prodact.png",
  },
  {
    id: "p8",
    slug: "mystic-pearl",
    nameAr: "لؤلؤة الغموض",
    nameEn: "Mystic Pearl",
    descriptionAr:
      "لؤلؤة بيضاء مشعة — موسك أبيض نقي وزهر الفانيليا مع لمسة من الغاردينيا. رقة تحمل حضورًا.",
    descriptionEn:
      "A radiant white pearl — pure white musk and vanilla flower with a hint of gardenia. Delicacy with presence.",
    price: 145000,
    gender: "female",
    collection: "gold",
    notes: {
      top: ["غاردينيا", "كمثرى"],
      heart: ["زهر الفانيليا", "زهر الياسمين"],
      base: ["موسك أبيض", "خشب الصندل"],
    },
    rating: 4.7,
    reviewsCount: 132,
    isNew: true,
    isBestseller: false,
    art: { from: "#4c1d95", to: "#1e0a3c", glow: "#c084fc" },
    image: "/uploads/prodact.png",
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function formatPrice(price: number): string {
  const pounds = price / 100;
  return pounds.toLocaleString("en-EG", { maximumFractionDigits: 0 });
}
