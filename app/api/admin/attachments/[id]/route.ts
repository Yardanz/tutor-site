import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { deleteLocalFileByUrl } from "@/lib/local-storage";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Некорректный ID вложения." }, { status: 400 });
  }

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: "Вложение не найдено." }, { status: 404 });
  }

  await deleteLocalFileByUrl(attachment.url).catch((error) => {
    console.error("[uploads] Delete file error:", error);
  });
  await prisma.attachment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
