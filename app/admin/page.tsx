import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { DeletePostButton } from "@/components/admin/DeletePostButton";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<{ status?: string }>;
};

type AdminPostRow = Prisma.PostGetPayload<{
  include: { _count: { select: { attachments: true } } };
}>;

function formatDate(value: Date | null) {
  if (!value) return null;
  return value.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function statusLabel(post: { isPublished: boolean; publishedAt: Date | null }) {
  if (!post.isPublished) return "Черновик";
  const published = formatDate(post.publishedAt);
  return published ? `Опубликовано (${published})` : "Опубликовано";
}

export default async function AdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = params.status ?? "all";

  const where =
    status === "published" ? { isPublished: true } : status === "draft" ? { isPublished: false } : {};

  const posts: AdminPostRow[] = await prisma.post.findMany({
    where,
    include: { _count: { select: { attachments: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="container-page py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Админка</h1>
          <p className="text-sm text-slate-500">Управление материалами</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/new">Новый материал</Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild variant="secondary" className={status === "all" ? "bg-slate-100" : ""}>
          <Link href="/admin?status=all">Все</Link>
        </Button>
        <Button asChild variant="secondary" className={status === "published" ? "bg-slate-100" : ""}>
          <Link href="/admin?status=published">Опубликованные</Link>
        </Button>
        <Button asChild variant="secondary" className={status === "draft" ? "bg-slate-100" : ""}>
          <Link href="/admin?status=draft">Черновики</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {posts.map((post: AdminPostRow) => (
          <article key={post.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-[240px]">
                <h2 className="text-xl font-bold">{post.title}</h2>
                <p className="text-sm text-slate-500">/materials/{post.slug}</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{statusLabel(post)}</span>
                  {post.isPinned ? <span className="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-800">📌 Закреплено</span> : null}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Обновлено: {formatDate(post.updatedAt)} • Вложений: {post._count.attachments}
                </p>
              </div>

              <div className="flex gap-2">
                <Button asChild variant="secondary">
                  <Link href={`/admin/edit/${post.id}`}>Редактировать</Link>
                </Button>
                <DeletePostButton id={post.id} />
              </div>
            </div>
          </article>
        ))}

        {!posts.length ? <p className="card p-4 text-slate-600">Материалов пока нет.</p> : null}
      </div>
    </main>
  );
}
