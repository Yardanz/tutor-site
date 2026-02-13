import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { saveUploadedFile } from "@/lib/local-storage";
import { prisma } from "@/lib/prisma";

const MAX_UPLOAD_MB = 50;
const MAX_FILE_SIZE = MAX_UPLOAD_MB * 1024 * 1024;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { id: rawId } = await context.params;
  const postId = Number(rawId);
  if (!Number.isFinite(postId) || postId <= 0) {
    return NextResponse.json({ error: "Некорректный ID поста." }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Пост не найден." }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .concat(formData.getAll("file"))
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!files.length) {
    return NextResponse.json({ error: "Файл не передан." }, { status: 400 });
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `Файл "${file.name}" превышает ${MAX_UPLOAD_MB} MB.` }, { status: 413 });
    }
  }

  const created = [];
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const stored = await saveUploadedFile({
      originalName: file.name,
      data: Buffer.from(arrayBuffer),
    });

    const attachment = await prisma.attachment.create({
      data: {
        postId,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        url: stored.url,
      },
    });
    created.push(attachment);
  }

  return NextResponse.json({ items: created }, { status: 201 });
}
