import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") ?? "1");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const tag = (searchParams.get("tag") ?? "").trim();

  const pinnedWhere = {
    isPublished: true,
    isPinned: true,
    ...(tag ? { tags: { has: tag } } : {}),
  };

  const normalWhere = {
    isPublished: true,
    isPinned: false,
    ...(tag ? { tags: { has: tag } } : {}),
  };

  const [pinned, total, posts] = await Promise.all([
    prisma.post.findFirst({
      where: pinnedWhere,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: {
        coverAttachment: true,
        attachments: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.post.count({ where: normalWhere }),
    prisma.post.findMany({
      where: normalWhere,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        coverAttachment: true,
        attachments: { orderBy: { createdAt: "asc" } },
      },
    }),
  ]);

  return NextResponse.json({
    pinned,
    items: posts,
    page: safePage,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
