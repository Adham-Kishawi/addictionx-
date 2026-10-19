import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// One client per request in Cloudflare Workers to prevent socket leaks
const workerClients = new WeakMap<object, PrismaClient>();

function getDatabaseUrl(): string {
  let dbUrl = process.env.DATABASE_URL;
  try {
    const cf = getCloudflareContext();
    if (cf?.env && (cf.env as any).DATABASE_URL) {
      dbUrl = (cf.env as any).DATABASE_URL as string;
    }
  } catch {}
  return dbUrl || "";
}

function createPrismaClient(): PrismaClient {
  const log: Prisma.PrismaClientOptions["log"] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set — cannot create PrismaClient");
  }

  // In Cloudflare Workers environment, scope PrismaClient to the active request context
  try {
    const cf = getCloudflareContext();
    if (cf) {
      const key = (cf.ctx || cf.env || globalThis) as object;
      let client = workerClients.get(key);
      if (!client) {
        const adapter = new PrismaPg({ connectionString: databaseUrl });
        client = new PrismaClient({ adapter, log });
        workerClients.set(key, client);
      }
      return client;
    }
  } catch {}

  // Outside of Cloudflare Workers (e.g. Next build, migrations, local Node)
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    globalForPrisma.prisma = new PrismaClient({ adapter, log });
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = createPrismaClient();
    return Reflect.get(client, property, receiver);
  },
});
