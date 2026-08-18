import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// One client per request. Workers forbid sharing sockets across requests, so
// the client cannot be a module global — but it must not be rebuilt on every
// query either: each PrismaClient opens its own pg pool, so N queries per
// page would mean N database connections. The request's ExecutionContext is
// the per-request key.
const workerClients = new WeakMap<object, PrismaClient>();

function createPrismaClient() {
  const log: Prisma.PrismaClientOptions["log"] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  // OpenNext makes Worker bindings available only while a request is being
  // handled. Do not cache this client globally: module initialization happens
  // before that context exists and would silently fall back to the native
  // Prisma engine, which is unavailable in a Worker.
  try {
    const { env, ctx } = getCloudflareContext();
    const hyperdrive = env.HYPERDRIVE;

    if (hyperdrive) {
      const key: object = ctx ?? env;
      let client = workerClients.get(key);
      if (!client) {
        client = new PrismaClient({
          adapter: new PrismaPg({
            connectionString: hyperdrive.connectionString,
          }),
          log,
        });
        workerClients.set(key, client);
      }
      return client;
    }
  } catch {
    // This is expected outside of the Cloudflare Workers runtime.
  }

  // CLI commands and local Node development still use DATABASE_URL. Reuse
  // only this Node client; Worker clients are cached per request above.
  return (globalForPrisma.prisma ??= new PrismaClient({ log }));
}

// Keep the existing `prisma.model.method()` call sites, but create the client
// lazily so `getCloudflareContext()` is read inside the active request.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(createPrismaClient(), property, receiver);
  },
});
