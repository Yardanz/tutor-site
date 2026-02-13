import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Button } from "@/components/ui/Button";
import { attachmentIcon, formatAttachmentSize, isImageAttachment } from "@/lib/attachments";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
};

function makeDescription(content: string) {
  return content.replace(/[#>*_`~\-\[\]()!]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
}

function formatRuDate(date: Date) {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findFirst({
    where: { slug, isPublished: true },
    select: { title: true, content: true },
  });

  if (!post) {
    return {
      title: "Материал не найден",
      description: "Запрошенный материал отсутствует.",
    };
  }

  const description = makeDescription(post.content);
  return {
    title: `${post.title} | Материалы`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      locale: "ru_RU",
    },
  };
}

export default async function MaterialPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findFirst({
    where: { slug, isPublished: true },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });

  if (!post) notFound();

  const html = await renderMarkdownToHtml(post.content);
  const publishedDate = formatRuDate(post.publishedAt ?? post.createdAt);

  return (
    <main className="container-page max-w-5xl py-8">
      <Button asChild variant="ghost" size="sm">
        <Link href="/materials">Назад к материалам</Link>
      </Button>

      <article className="card mt-4 p-6 text-left md:p-8">
        <header className="border-b border-[var(--border)] pb-4 text-left">
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{post.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{publishedDate}</p>
          {!!post.tags.length && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--border)] bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="mx-auto mt-6 max-w-3xl text-left">
          <MarkdownContent html={html} />
        </div>
      </article>

      {!!post.attachments.length && (
        <section className="card mt-4 p-5 md:p-6">
          <h2 className="text-xl font-bold">Вложения</h2>
          <ul className="mt-4 space-y-3">
            {post.attachments.map((attachment) => {
              const isImage = isImageAttachment(attachment);
              const sizeLabel = formatAttachmentSize(attachment.size);
              return (
                <li key={attachment.id} className="rounded-xl border border-[var(--border)] bg-white p-3">
                  <div className="flex items-center gap-3">
                    {isImage ? (
                      <a href={attachment.url} target="_blank" rel="noopener" className="h-14 w-14 overflow-hidden rounded-lg border border-[var(--border)] bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={attachment.url} alt={attachment.filename} className="h-full w-full object-cover" />
                      </a>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--border)] bg-slate-50 text-2xl">
                        {attachmentIcon(attachment)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate font-medium text-slate-900">{attachment.filename}</p>
                      {sizeLabel ? <p className="mt-1 text-xs text-slate-500">{sizeLabel}</p> : null}
                    </div>

                    <Button asChild variant="secondary" size="sm" className="whitespace-nowrap">
                      <a href={attachment.url} target="_blank" rel="noopener">
                        Скачать
                      </a>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
