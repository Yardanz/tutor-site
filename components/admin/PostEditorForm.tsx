"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { attachmentIcon, formatAttachmentSize, isImageAttachment } from "@/lib/attachments";
import { slugifyRu } from "@/lib/slug";

type Attachment = {
  id: number;
  filename: string;
  mimeType?: string | null;
  size?: number | null;
  url: string;
};

type InitialPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  isPublished: boolean;
  isPinned: boolean;
  coverAttachmentId: number | null;
  attachments: Attachment[];
};

type Props =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      initial: InitialPost;
    };

type Toast = {
  type: "success" | "error";
  message: string;
};

export function PostEditorForm(props: Props) {
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : null;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false);
  const [coverAttachmentId, setCoverAttachmentId] = useState<number | null>(initial?.coverAttachmentId ?? null);
  const [currentPostId, setCurrentPostId] = useState<number | null>(initial?.id ?? null);

  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>(initial?.attachments ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadingNames, setUploadingNames] = useState<string[]>([]);
  const [deletingAttachmentIds, setDeletingAttachmentIds] = useState<number[]>([]);
  const [coverLoadingAttachmentId, setCoverLoadingAttachmentId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  function pushToast(type: Toast["type"], message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2500);
  }

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugifyRu(value));
    }
  }

  function regenerateSlug() {
    setSlug(slugifyRu(title));
    setSlugTouched(true);
  }

  function clearFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadSelectedFiles(files: File[]) {
    if (!files.length) return;
    if (!currentPostId) {
      pushToast("error", "Сначала сохраните материал, чтобы загрузить вложения.");
      clearFileInput();
      return;
    }

    setUploading(true);
    setUploadingNames(files.map((file) => file.name));

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const response = await fetch(`/api/admin/posts/${currentPostId}/attachments`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as { items?: Attachment[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось загрузить файлы.");
      }

      const items = payload.items ?? [];
      setUploadedAttachments((prev) => [...prev, ...items]);
      pushToast("success", items.length > 1 ? "Файлы загружены." : "Файл загружен.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Ошибка загрузки файлов.");
    } finally {
      setUploading(false);
      setUploadingNames([]);
      clearFileInput();
    }
  }

  async function onFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    await uploadSelectedFiles(files);
  }

  async function submitWithState(nextPublishedState: boolean) {
    const safeTitle = title.trim();
    const safeSlug = slug.trim();
    if (!safeTitle) throw new Error("Заголовок обязателен.");
    if (!safeSlug) throw new Error("Slug обязателен.");

    const body = {
      title: safeTitle,
      slug: safeSlug,
      tags,
      content,
      isPublished: nextPublishedState,
      isPinned,
    };

    const targetUrl = isEdit && initial ? `/api/admin/posts/${initial.id}` : "/api/admin/posts";
    const response = await fetch(targetUrl, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as { item?: { id: number }; error?: string };
    if (!response.ok || !payload.item) {
      throw new Error(payload.error ?? "Не удалось сохранить материал.");
    }

    return payload.item.id;
  }

  async function onSave() {
    setSaving(true);
    try {
      const postId = await submitWithState(isPublished);
      setCurrentPostId(postId);
      pushToast("success", "Материал сохранен.");

      if (isEdit) {
        router.refresh();
      } else {
        router.push(`/admin/edit/${postId}`);
      }
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  }

  async function onPublish() {
    if (!isEdit || !initial) {
      setPublishing(true);
      try {
        const postId = await submitWithState(true);
        setCurrentPostId(postId);
        setIsPublished(true);
        pushToast("success", "Материал опубликован.");
        router.push(`/admin/edit/${postId}`);
      } catch (error) {
        pushToast("error", error instanceof Error ? error.message : "Ошибка публикации.");
      } finally {
        setPublishing(false);
      }
      return;
    }

    setPublishing(true);
    try {
      const response = await fetch(`/api/admin/posts/${initial.id}/publish`, { method: "PATCH" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Ошибка публикации.");
      setIsPublished(true);
      pushToast("success", payload.message ?? "Материал опубликован.");
      router.refresh();
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Ошибка публикации.");
    } finally {
      setPublishing(false);
    }
  }

  async function onUnpublish() {
    if (!isEdit || !initial) {
      setIsPublished(false);
      pushToast("success", "Статус переключен на черновик. Нажмите «Сохранить».");
      return;
    }

    setUnpublishing(true);
    try {
      const response = await fetch(`/api/admin/posts/${initial.id}/unpublish`, { method: "PATCH" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Ошибка снятия с публикации.");
      setIsPublished(false);
      pushToast("success", payload.message ?? "Материал снят с публикации.");
      router.refresh();
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Ошибка снятия с публикации.");
    } finally {
      setUnpublishing(false);
    }
  }

  async function deleteAttachment(id: number) {
    if (!window.confirm("Удалить вложение?")) return;

    setDeletingAttachmentIds((prev) => [...prev, id]);
    try {
      const response = await fetch(`/api/admin/attachments/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Не удалось удалить вложение.");
      }

      setUploadedAttachments((prev) => prev.filter((item) => item.id !== id));
      setCoverAttachmentId((prev) => (prev === id ? null : prev));
      pushToast("success", "Вложение удалено.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Не удалось удалить вложение.");
    } finally {
      setDeletingAttachmentIds((prev) => prev.filter((item) => item !== id));
    }
  }

  const isBusy = saving || publishing || unpublishing;

  async function updateCover(nextAttachmentId: number | null) {
    if (!currentPostId) {
      pushToast("error", "Сначала сохраните материал, чтобы выбрать обложку.");
      return;
    }

    setCoverLoadingAttachmentId(nextAttachmentId ?? -1);
    try {
      const response = await fetch(`/api/admin/posts/${currentPostId}/cover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentId: nextAttachmentId }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string; item?: { coverAttachmentId?: number | null } };
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось обновить обложку.");
      }

      setCoverAttachmentId(payload.item?.coverAttachmentId ?? null);
      pushToast("success", nextAttachmentId ? "Обложка установлена." : "Обложка убрана.");
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Не удалось обновить обложку.");
    } finally {
      setCoverLoadingAttachmentId(null);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs ${isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
              {isPublished ? "Опубликовано" : "Черновик"}
            </span>
            {isPinned ? <span className="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-800">📌 Закреплено</span> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={isBusy} type="button">
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
            {!isPublished ? (
              <Button variant="secondary" onClick={onPublish} disabled={isBusy} type="button">
                {publishing ? "Публикация..." : "Опубликовать"}
              </Button>
            ) : (
              <Button variant="secondary" onClick={onUnpublish} disabled={isBusy} type="button">
                {unpublishing ? "Обновление..." : "Снять с публикации"}
              </Button>
            )}
          </div>
        </div>

        {isPublished && slug ? (
          <div className="mt-3">
            <a className="text-sm font-medium text-sky-700 hover:underline" href={`/materials/${slug}`} target="_blank" rel="noreferrer">
              Открыть на сайте
            </a>
          </div>
        ) : null}
      </div>

      {toast ? (
        <div className={`rounded-xl border p-3 text-sm ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
          {toast.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <p className="mb-1 text-sm font-medium">Заголовок *</p>
          <input className="input" required value={title} onChange={(e) => onTitleChange(e.target.value)} />
        </label>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Slug (URL) *</p>
            <Button variant="secondary" size="sm" type="button" onClick={regenerateSlug}>
              Сгенерировать
            </Button>
          </div>
          <input
            className="input"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugifyRu(e.target.value));
            }}
          />
          <p className="mt-1 text-xs text-slate-500">URL: /materials/{slug || "<slug>"}</p>
        </div>
      </div>

      <label>
        <p className="mb-1 text-sm font-medium">Теги (через запятую)</p>
        <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="английский, огэ, грамматика" />
      </label>

      <label>
        <p className="mb-1 text-sm font-medium">Контент (Markdown)</p>
        <textarea className="input min-h-56" required value={content} onChange={(e) => setContent(e.target.value)} placeholder="# Тема материала" />
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
        <span className="text-sm">Закрепить пост</span>
      </label>
      {isPinned ? <p className="text-xs text-slate-500">Закрепленный пост всегда отображается первым в ленте.</p> : null}

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">Вложения</p>
          <Button
            asChild
            variant="secondary"
            className={`cursor-pointer ${!currentPostId || uploading ? "pointer-events-none opacity-50" : ""}`}
          >
            <label>
              Добавить файлы
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                multiple
                disabled={!currentPostId || uploading}
                onChange={onFileInputChange}
              />
            </label>
          </Button>
        </div>

        {!currentPostId ? (
          <p className="mt-2 text-xs text-slate-500">Сначала сохраните материал, чтобы загрузить вложения.</p>
        ) : null}
        {uploading ? (
          <p className="mt-2 text-xs text-slate-500">Загрузка... {uploadingNames.join(", ")}</p>
        ) : null}

        {uploadedAttachments.length ? (
          <ul className="mt-4 space-y-2">
            {uploadedAttachments.map((attachment) => {
              const isDeleting = deletingAttachmentIds.includes(attachment.id);
              const sizeLabel = formatAttachmentSize(attachment.size);
              const isCover = coverAttachmentId === attachment.id;
              const isCoverLoading = coverLoadingAttachmentId === attachment.id || (coverLoadingAttachmentId === -1 && isCover);

              return (
                <li key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-2 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    {isImageAttachment(attachment) ? (
                      <a href={attachment.url} target="_blank" rel="noreferrer" className="h-12 w-12 overflow-hidden rounded-md border border-[var(--border)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={attachment.url} alt={attachment.filename} className="h-full w-full object-cover" />
                      </a>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[var(--border)] bg-slate-50 text-lg">
                        {attachmentIcon(attachment)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <a href={attachment.url} target="_blank" rel="noreferrer" className="block truncate font-medium text-sky-700 hover:underline">
                        {attachment.filename}
                      </a>
                      {isCover ? <p className="mt-1 text-xs font-semibold text-emerald-700">Обложка</p> : null}
                      {sizeLabel ? <p className="text-xs text-slate-500">{sizeLabel}</p> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isImageAttachment(attachment) ? (
                      isCover ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCover(null)}
                          disabled={isCoverLoading || uploading || !currentPostId}
                          type="button"
                        >
                          {isCoverLoading ? "Обновление..." : "Убрать обложку"}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateCover(attachment.id)}
                          disabled={isCoverLoading || uploading || !currentPostId}
                          type="button"
                        >
                          {isCoverLoading ? "Обновление..." : "Сделать обложкой"}
                        </Button>
                      )
                    ) : null}
                    <Button asChild variant="secondary" size="sm">
                      <a href={attachment.url} target="_blank" rel="noreferrer">
                        Скачать
                      </a>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteAttachment(attachment.id)} disabled={isDeleting} type="button">
                      {isDeleting ? "Удаление..." : "Удалить"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Пока нет загруженных вложений.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/admin">Назад к списку</Link>
        </Button>
      </div>
    </form>
  );
}
