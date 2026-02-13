import { notFound } from "next/navigation";
import { PostEditorForm } from "@/components/admin/PostEditorForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditPostPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const post = await prisma.post.findUnique({
    where: { id },
    include: { attachments: { orderBy: { createdAt: "desc" } } },
  });
  if (!post) notFound();

  return (
    <main className="container-page py-8">
      <h1 className="mb-4 text-3xl font-extrabold">Редактирование материала</h1>
      <div className="card p-5">
        <PostEditorForm
          mode="edit"
          initial={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content,
            tags: post.tags,
            isPublished: post.isPublished,
            isPinned: post.isPinned,
            coverAttachmentId: post.coverAttachmentId,
            attachments: post.attachments,
          }}
        />
      </div>
    </main>
  );
}
