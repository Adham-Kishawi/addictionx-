-- Keep the deployed schema aligned with User.permissions in schema.prisma.
-- Empty permissions denotes a full-access administrator; non-empty arrays
-- constrain administrative scopes.
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
