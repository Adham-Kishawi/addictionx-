import { PrismaClient, type Gender } from "@prisma/client";
import { hash } from "bcryptjs";
import { products } from "../src/features/catalog/data/products";

const prisma = new PrismaClient();

const genderMap: Record<string, Gender> = {
  male: "MALE",
  female: "FEMALE",
  unisex: "UNISEX",
};

async function main() {
  // ---------- First admin account ----------
  const email = (process.env.ADMIN_EMAIL || "admin@addictionx.com")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin@123456";
  const name = process.env.ADMIN_NAME || "ADDICTIONX Admin";

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", name },
    create: {
      email,
      name,
      passwordHash: await hash(password, 10),
      role: "ADMIN",
    },
  });
  console.log("✅ Admin ready:", email, "| password:", password);

  // ---------- Products ----------
  for (const p of products) {
    const data = {
      name: p.nameAr,
      nameEn: p.nameEn,
      slug: p.slug,
      description: p.descriptionAr,
      descriptionEn: p.descriptionEn,
      collection: p.collection,
      notes: p.notes,
      art: p.art,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      gender: genderMap[p.gender],
      basePrice: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      isActive: true,
      isFeatured: p.isBestseller,
      isBestSeller: p.isBestseller,
      // Best sellers keep their array index as the manual section order
      bestsellerOrder: p.isBestseller ? products.indexOf(p) + 1 : 0,
      isNew: p.isNew,
    };

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: data,
    });

    await prisma.productVariant.upsert({
      where: { productId_sizeMl: { productId: product.id, sizeMl: 100 } },
      update: { price: p.price, stock: 10 },
      create: {
        productId: product.id,
        sizeMl: 100,
        price: p.price,
        stock: 10,
        sku: `${p.slug}-100`,
      },
    });

    // Real product image — the same transparent bottle PNG for every product
    // (delete existing ones first so re-seeding stays idempotent)
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: "/uploads/prodact.png",
        alt: p.nameAr,
        position: 0,
        isPrimary: true,
      },
    });
  }
  console.log(`✅ Seeded ${products.length} products`);

  // ---------- Collections ----------
  const collections = [
    { slug: "rush", nameAr: "الإحساس", nameEn: "The Rush", sortOrder: 10 },
    { slug: "noir", nameAr: "الليل", nameEn: "Noir", sortOrder: 20 },
    { slug: "gold", nameAr: "الذهبي", nameEn: "Golden Hour", sortOrder: 30 },
  ];
  for (const c of collections) {
    await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { nameAr: c.nameAr, nameEn: c.nameEn, sortOrder: c.sortOrder },
      create: c,
    });
  }
  console.log(`✅ Seeded ${collections.length} collections`);

  // ---------- Shipping zones (governorates + default region) ----------
  const governorates = [
    { en: "Cairo", ar: "القاهرة" },
    { en: "Giza", ar: "الجيزة" },
    { en: "Alexandria", ar: "الإسكندرية" },
    { en: "Port Said", ar: "بورسعيد" },
    { en: "Suez", ar: "السويس" },
    { en: "Ismailia", ar: "الإسماعيلية" },
    { en: "Damietta", ar: "دمياط" },
    { en: "Dakahlia", ar: "الدقهلية" },
    { en: "Sharqia", ar: "الشرقية" },
    { en: "Qalyubia", ar: "القليوبية" },
    { en: "Kafr El Sheikh", ar: "كفر الشيخ" },
    { en: "Gharbia", ar: "الغربية" },
    { en: "Menoufia", ar: "المنوفية" },
    { en: "Beheira", ar: "البحيرة" },
    { en: "Fayoum", ar: "الفيوم" },
    { en: "Beni Suef", ar: "بني سويف" },
    { en: "Minya", ar: "المنيا" },
    { en: "Asyut", ar: "أسيوط" },
    { en: "Sohag", ar: "سوهاج" },
    { en: "Qena", ar: "قنا" },
    { en: "Luxor", ar: "الأقصر" },
    { en: "Aswan", ar: "أسوان" },
    { en: "Red Sea", ar: "البحر الأحمر" },
    { en: "New Valley", ar: "الوادي الجديد" },
    { en: "Matrouh", ar: "مطروح" },
    { en: "North Sinai", ar: "شمال سيناء" },
    { en: "South Sinai", ar: "جنوب سيناء" },
  ];
  const DEFAULT_REGION_FEE = Number(
    process.env.DEFAULT_SHIPPING_FEE_QIRSH || 5000,
  );
  for (const [i, g] of governorates.entries()) {
    const gov = await prisma.governorate.upsert({
      where: { id: `gov-${g.en.toLowerCase().replace(/\s+/g, "-")}` },
      update: { nameAr: g.ar, nameEn: g.en, sortOrder: (i + 1) * 10 },
      create: {
        id: `gov-${g.en.toLowerCase().replace(/\s+/g, "-")}`,
        nameAr: g.ar,
        nameEn: g.en,
        sortOrder: (i + 1) * 10,
      },
    });
    await prisma.region.upsert({
      where: {
        id: `reg-${gov.id}-standard`,
      },
      update: {
        nameAr: "المنطقة الرئيسية",
        nameEn: "Main Area",
        shippingFee: DEFAULT_REGION_FEE,
      },
      create: {
        id: `reg-${gov.id}-standard`,
        governorateId: gov.id,
        nameAr: "المنطقة الرئيسية",
        nameEn: "Main Area",
        shippingFee: DEFAULT_REGION_FEE,
      },
    });
  }
  console.log(
    `✅ Seeded ${governorates.length} governorates with a default region`,
  );

  console.log("⚠ غيّر كلمة مرور الأدمن إذا لم تضبط ADMIN_PASSWORD.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
