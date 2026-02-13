import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const post = await prisma.post.findFirst({
    where: {
      slug,
      isPublished: true,
    },
    include: {
      coverAttachment: true,
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Материал не найден." }, { status: 404 });
  }

  return NextResponse.json({ item: post });
}
