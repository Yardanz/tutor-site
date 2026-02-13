import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Некорректный ID." }, { status: 400 });

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Материал не найден." }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    return tx.post.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: existing.publishedAt ?? new Date(),
      },
    });
  });

  return NextResponse.json({ item: updated, message: "Материал опубликован." });
}
