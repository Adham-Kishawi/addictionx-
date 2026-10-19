import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const collections = await prisma.collection.findMany();
    const products = await prisma.product.findMany({ select: { nameEn: true, slug: true } });
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      collectionsCount: collections.length,
      collections,
      productsCount: products.length,
      products,
      envDbUrl: process.env.DATABASE_URL ? "defined" : "undefined",
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "db_error",
      timestamp: new Date().toISOString(),
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      envDbUrl: process.env.DATABASE_URL ? "defined" : "undefined",
    }, { status: 500 });
  }
}
