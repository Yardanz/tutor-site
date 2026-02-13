import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { uploadsDirPath } from "@/lib/local-storage";

function contentTypeByExt(ext: string) {
  const lower = ext.toLowerCase();
  if (lower === ".pdf") return "application/pdf";
  if (lower === ".doc") return "application/msword";
  if (lower === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower === ".ppt") return "application/vnd.ms-powerpoint";
  if (lower === ".pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (lower === ".xls") return "application/vnd.ms-excel";
  if (lower === ".xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lower === ".zip") return "application/zip";
  if (lower === ".png") return "image/png";
  if (lower === ".jpg" || lower === ".jpeg") return "image/jpeg";
  if (lower === ".webp") return "image/webp";
  return "application/octet-stream";
}

export async function GET(_request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  if (!parts?.length) return new Response("Not Found", { status: 404 });

  const cleaned = parts.map((part) => part.replace(/[\\/]/g, "")).join("/");
  const absolutePath = path.resolve(uploadsDirPath(), cleaned);
  if (!absolutePath.startsWith(path.resolve(uploadsDirPath()))) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const data = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath);
    return new Response(data, {
      status: 200,
      headers: {
        "content-type": contentTypeByExt(ext),
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
