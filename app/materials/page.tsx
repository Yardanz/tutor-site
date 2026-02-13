import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { attachmentIcon, formatAttachmentSize } from "@/lib/attachments";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 10;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

type PostCardData = {
  id: number;
  slug: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  coverAttachmentId: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  coverAttachment: {
    id: number;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  } | null;
  attachments: Array<{
    id: number;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
};

export const metadata: Metadata = {
  title: "Материалы | Екатерина Драндина",
  description: "Публичная лента материалов по английскому языку для школьников и подростков.",
};

function excerptFromMarkdown(content: string) {
  const plain = content.replace(/[#>*_`~\-\[\]()!]/g, "").replace(/\s+/g, " ").trim();
  return plain.length > 160 ? `${plain.slice(0, 160)}...` : plain;
}

function formatRuDate(date: Date) {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function isImageAttachment(attachment: { mimeType?: string | null; filename?: string | null; url?: string | null }) {
  const mime = attachment.mimeType?.toLowerCase();
  if (mime?.startsWith("image/")) return true;

  const source = (attachment.filename || attachment.url || "").toLowerCase();
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(source);
}

function isGifAttachment(attachment: { mimeType?: string | null; filename?: string | null; url?: string | null }) {
  const mime = attachment.mimeType?.toLowerCase();
  if (mime === "image/gif") return true;

  const source = (attachment.filename || attachment.url || "").toLowerCase();
  return /\.gif$/i.test(source);
}

function AttachmentPreviewList({ post }: { post: PostCardData }) {
  const nonImageAttachments = post.attachments.filter((attachment) => !isImageAttachment(attachment));
  const visible = nonImageAttachments.slice(0, 3);
  const moreCount = nonImageAttachments.length - visible.length;

  if (!visible.length) return null;

  return (
    <div className="mt-4 space-y-2">
      {visible.map((attachment) => {
        const sizeLabel = formatAttachmentSize(attachment.size);
        return (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="text-base">{attachmentIcon(attachment)}</span>
            <span className="min-w-0 flex-1 truncate">{attachment.filename}</span>
            {sizeLabel && <span className="text-xs text-slate-500">{sizeLabel}</span>}
          </a>
        );
      })}
      {moreCount > 0 && (
        <Link href={`/materials/${post.slug}`} className="inline-block pl-1 text-sm font-medium text-sky-700 hover:underline">
          еще {moreCount}
        </Link>
      )}
    </div>
  );
}

function PostCard({ post, pinned = false }: { post: PostCardData; pinned?: boolean }) {
  const displayDate = post.publishedAt ?? post.createdAt;
  const previewImage =
    (post.coverAttachment && isImageAttachment(post.coverAttachment) ? post.coverAttachment : null) ??
    post.attachments.find((attachment) => isImageAttachment(attachment)) ??
    null;
  const previewIsGif = previewImage ? isGifAttachment(previewImage) : false;

  return (
    <article className={`card p-5 text-left md:p-6 ${pinned ? "border-slate-400 bg-slate-50/70" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {pinned ? <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-slate-700">📌 Закреплено</span> : null}
        <span>{formatRuDate(displayDate)}</span>
      </div>

      <h2 className="mt-3 text-2xl font-bold leading-tight text-slate-900">
        <Link href={`/materials/${post.slug}`} className="transition hover:text-slate-700">
          {post.title}
        </Link>
      </h2>

      <p className="mt-3 text-left text-[15px] leading-7 text-slate-600">{excerptFromMarkdown(post.content)}</p>

      {previewImage ? (
        <a
          href={previewImage.url}
          target="_blank"
          rel="noopener"
          className="mt-4 block w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-slate-100"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
            {previewIsGif ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewImage.url} alt={post.title} className="h-full w-full object-cover object-[50%_35%]" loading="lazy" />
            ) : (
              <Image
                src={previewImage.url}
                alt={post.title}
                fill
                className="object-cover object-[50%_35%]"
                sizes="(max-width: 768px) 100vw, 720px"
              />
            )}
          </div>
        </a>
      ) : null}

      {!!post.tags.length && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[var(--border)] bg-slate-50 px-2 py-1 text-xs text-slate-600">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <AttachmentPreviewList post={post} />

      <div className="mt-5">
        <Button asChild variant="secondary">
          <Link href={`/materials/${post.slug}`}>Читать</Link>
        </Button>
      </div>
    </article>
  );
}

export default async function MaterialsPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);

  const [pinnedPost, totalRegularPosts, regularPosts] = await Promise.all([
    prisma.post.findFirst({
      where: { isPublished: true, isPinned: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: {
        coverAttachment: { select: { id: true, filename: true, url: true, size: true, mimeType: true } },
        attachments: {
          select: { id: true, filename: true, url: true, size: true, mimeType: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.post.count({ where: { isPublished: true, isPinned: false } }),
    prisma.post.findMany({
      where: { isPublished: true, isPinned: false },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        coverAttachment: { select: { id: true, filename: true, url: true, size: true, mimeType: true } },
        attachments: {
          select: { id: true, filename: true, url: true, size: true, mimeType: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalRegularPosts / PAGE_SIZE));

  return (
    <main className="container-page max-w-6xl py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Материалы</h1>
          <p className="mt-1 text-sm text-slate-500">Публичная лента полезных материалов и разборов.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/">На главную</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {currentPage === 1 && pinnedPost ? <PostCard post={pinnedPost} pinned /> : null}
        {regularPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {!pinnedPost && !regularPosts.length ? <p className="card p-6 text-slate-600">Материалов пока нет</p> : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button asChild variant="secondary" className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>
          <Link href={`/materials?page=${currentPage - 1}`}>Назад</Link>
        </Button>
        <p className="text-sm text-slate-600">
          Страница <span className="font-semibold text-slate-800">{currentPage}</span> из{" "}
          <span className="font-semibold text-slate-800">{totalPages}</span>
        </p>
        <Button asChild variant="secondary" className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}>
          <Link href={`/materials?page=${currentPage + 1}`}>Вперед</Link>
        </Button>
      </div>
    </main>
  );
}
