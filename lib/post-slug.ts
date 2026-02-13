import { Prisma, PrismaClient } from "@prisma/client";

type SlugClient = PrismaClient | Prisma.TransactionClient;

export async function ensureUniqueSlug(db: SlugClient, baseSlug: string, excludedId?: number) {
  const initial = baseSlug || "material";
  let slug = initial;
  let suffix = 2;

  while (true) {
    const existing = await db.post.findUnique({ where: { slug } });
    const conflicts = existing && existing.id !== excludedId;
    if (!conflicts) return slug;
    slug = `${initial}-${suffix}`;
    suffix += 1;
  }
}
