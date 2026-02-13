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
  const postId = parseId(rawId);
  if (!postId) {
    return NextResponse.json({ error: "Некорректный ID поста." }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) {
    return NextResponse.json({ error: "Пост не найден." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { attachmentId?: number | string | null };
  const rawAttachmentId = body.attachmentId;

  if (rawAttachmentId == null) {
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { coverAttachmentId: null },
      include: {
        coverAttachment: {
          select: { id: true, filename: true, url: true, mimeType: true, size: true },
        },
      },
    });

    return NextResponse.json({ item: updated });
  }

  const attachmentId = Number(rawAttachmentId);
  if (!Number.isFinite(attachmentId) || attachmentId <= 0) {
    return NextResponse.json({ error: "Некорректный ID вложения." }, { status: 400 });
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: { id: true, postId: true },
  });

  if (!attachment || attachment.postId !== postId) {
    return NextResponse.json({ error: "Вложение не найдено в этом посте." }, { status: 404 });
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { coverAttachmentId: attachmentId },
    include: {
      coverAttachment: {
        select: { id: true, filename: true, url: true, mimeType: true, size: true },
      },
    },
  });

  return NextResponse.json({ item: updated });
}
