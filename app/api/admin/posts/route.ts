import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { ensureUniqueSlug } from "@/lib/post-slug";
import { prisma } from "@/lib/prisma";
import { parseTags, slugifyRu } from "@/lib/slug";

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") ?? "all";
  const page = Number(searchParams.get("page") ?? "1");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const where =
    status === "published" ? { isPublished: true } : status === "draft" ? { isPublished: false } : {};

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { attachments: true } },
      },
    }),
  ]);

  return NextResponse.json({
    items: posts,
    page: safePage,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  try {
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

    const baseSlug = slugifyRu(rawSlug);

    const created = await prisma.$transaction(async (tx) => {
      const slug = await ensureUniqueSlug(tx, baseSlug);
      const publishedAt = isPublished ? new Date() : null;

      const post = await tx.post.create({
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

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка создания материала." }, { status: 500 });
  }
}
