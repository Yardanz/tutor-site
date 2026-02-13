import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { deleteLocalFileByUrl } from "@/lib/local-storage";
import { ensureUniqueSlug } from "@/lib/post-slug";
import { prisma } from "@/lib/prisma";
import { parseTags, slugifyRu } from "@/lib/slug";

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Некорректный ID." }, { status: 400 });

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      coverAttachment: true,
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!post) return NextResponse.json({ error: "Материал не найден." }, { status: 404 });

  return NextResponse.json({ item: post });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Некорректный ID." }, { status: 400 });

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();
  const rawSlug = String(body.slug ?? "").trim();
  const tags = parseTags(String(body.tags ?? ""));
  const isPublished = Boolean(body.isPublished);
  const isPinned = Boolean(body.isPinned);

  if (!title || !content || !rawSlug) {
    return NextResponse.json({ error: "Заполните заголовок, slug и текст." }, { status: 400 });
  }

  const oldPost = await prisma.post.findUnique({ where: { id } });
  if (!oldPost) return NextResponse.json({ error: "Материал не найден." }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    const baseSlug = slugifyRu(rawSlug);
    const slug = await ensureUniqueSlug(tx, baseSlug, id);
    const publishedAt = isPublished ? oldPost.publishedAt ?? new Date() : oldPost.publishedAt;

    const post = await tx.post.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        tags,
        isPublished,
        isPinned,
        publishedAt,
      },
    });

    if (isPinned) {
      await tx.post.updateMany({
        where: { id: { not: post.id }, isPinned: true },
        data: { isPinned: false },
      });
    }

    return post;
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "Некорректный ID." }, { status: 400 });

  const post = await prisma.post.findUnique({
    where: { id },
    include: { attachments: true },
  });
  if (!post) return NextResponse.json({ error: "Материал не найден." }, { status: 404 });

  await prisma.post.delete({ where: { id } });
  await Promise.allSettled(post.attachments.map((attachment) => deleteLocalFileByUrl(attachment.url)));

  return NextResponse.json({ ok: true });
}
