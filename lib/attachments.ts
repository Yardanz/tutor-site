export type AttachmentView = {
  filename: string;
  mimeType?: string | null;
  size?: number | null;
};

function extensionFromFilename(filename: string) {
  const ext = filename.split(".").pop();
  return ext ? ext.toLowerCase() : "";
}

export function isImageAttachment(input: AttachmentView) {
  const ext = extensionFromFilename(input.filename);
  const mime = (input.mimeType ?? "").toLowerCase();
  return mime.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
}

export function attachmentIcon(input: AttachmentView) {
  const ext = extensionFromFilename(input.filename);
  const mime = (input.mimeType ?? "").toLowerCase();

  if (mime.includes("pdf") || ext === "pdf") return "📄";
  if (["doc", "docx"].includes(ext) || mime.includes("word")) return "📝";
  if (["ppt", "pptx"].includes(ext) || mime.includes("presentation")) return "📊";
  if (["xls", "xlsx"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel")) return "📈";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext) || mime.includes("zip") || mime.includes("compressed")) return "🗜️";
  if (isImageAttachment(input)) return "🖼️";
  return "📎";
}

export function formatAttachmentSize(size?: number | null) {
  if (size == null || Number.isNaN(size)) return null;
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}
