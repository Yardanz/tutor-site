import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function sanitizeOriginalName(filename: string) {
  const normalized = filename.normalize("NFKD").replace(/[^\w.\- ]+/g, "");
  return normalized
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 120) || "file";
}

export async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export function uploadsDirPath() {
  return UPLOADS_DIR;
}

export function buildStoredFileName(originalName: string) {
  const safeOriginal = sanitizeOriginalName(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  return `${timestamp}-${random}-${safeOriginal}`;
}

export async function saveUploadedFile(input: { originalName: string; data: Buffer }) {
  await ensureUploadsDir();
  const storedName = buildStoredFileName(input.originalName);
  const fullPath = path.join(UPLOADS_DIR, storedName);
  await fs.writeFile(fullPath, input.data);
  return {
    storedName,
    filePath: fullPath,
    url: `/uploads/${storedName}`,
  };
}

export function resolveUploadPathFromUrl(url: string) {
  if (!url.startsWith("/uploads/")) return null;
  const stored = url.slice("/uploads/".length);
  if (!stored || stored.includes("..") || stored.includes("/") || stored.includes("\\")) return null;
  return path.join(UPLOADS_DIR, stored);
}

export async function deleteLocalFileByUrl(url: string) {
  const filePath = resolveUploadPathFromUrl(url);
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
    console.warn(`[uploads] File not found while deleting: ${filePath}`);
  }
}
