import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fail } from "@/lib/api";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

export function uploadRoot() {
  const configured = process.env.UPLOAD_DIR || "storage/uploads";
  return path.isAbsolute(configured) ? configured : path.join(/*turbopackIgnore: true*/ process.cwd(), configured);
}

export type DetectedKind = { kind: "image"; ext: "jpg" | "png" | "webp" } | { kind: "video"; ext: "mp4" | "mov" };

/** Identifies files by their magic bytes, never by the client-supplied type. */
export function detectKind(buf: Buffer): DetectedKind | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { kind: "image", ext: "jpg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { kind: "image", ext: "png" };
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return { kind: "image", ext: "webp" };
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brand = buf.toString("ascii", 8, 12);
    if (brand === "qt  ") return { kind: "video", ext: "mov" };
    return { kind: "video", ext: "mp4" };
  }
  return null;
}

type Box = { type: string; start: number; payload: number; end: number };

function boxes(buf: Buffer, from: number, to: number): Box[] {
  const out: Box[] = [];
  let pos = from;
  while (pos + 8 <= to) {
    let size = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    let header = 8;
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(pos + 8));
      header = 16;
    } else if (size === 0) {
      size = to - pos;
    }
    if (size < header || pos + size > to) break;
    out.push({ type, start: pos, payload: pos + header, end: pos + size });
    pos += size;
  }
  return out;
}

/** Reads the duration (seconds) from an MP4/MOV file's movie header box. */
export function readVideoDurationSec(buf: Buffer): number | null {
  const top = boxes(buf, 0, buf.length);
  const moov = top.find((b) => b.type === "moov");
  if (!moov) return null;
  const mvhd = boxes(buf, moov.payload, moov.end).find((b) => b.type === "mvhd");
  if (!mvhd) return null;
  const version = buf[mvhd.payload];
  let timescale: number;
  let duration: number;
  if (version === 1) {
    timescale = buf.readUInt32BE(mvhd.payload + 4 + 16);
    duration = Number(buf.readBigUInt64BE(mvhd.payload + 4 + 20));
  } else {
    timescale = buf.readUInt32BE(mvhd.payload + 4 + 8);
    duration = buf.readUInt32BE(mvhd.payload + 4 + 12);
  }
  if (!timescale || !duration) return null;
  return Math.round((duration / timescale) * 100) / 100;
}

/** Validates an uploaded file and returns its verified kind. */
export function validateUpload(buf: Buffer, expected: "image" | "video") {
  const kind = detectKind(buf);
  if (!kind || kind.kind !== expected) {
    fail(400, expected === "image" ? "Please upload a JPG, PNG or WebP image" : "Please upload an MP4 or MOV video");
  }
  return kind;
}

export async function saveFile(buf: Buffer, ext: string) {
  const dir = uploadRoot();
  await mkdir(/*turbopackIgnore: true*/ dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(/*turbopackIgnore: true*/ path.join(dir, name), buf);
  return `/api/media/${name}`;
}

const SAFE_NAME = /^[a-f0-9-]{36}\.(jpg|png|webp|mp4|mov)$/;

export function mediaFilePath(name: string) {
  if (!SAFE_NAME.test(name)) return null;
  return path.join(/*turbopackIgnore: true*/ uploadRoot(), name);
}

export async function readStoredFile(name: string) {
  const p = mediaFilePath(name);
  if (!p) return null;
  try {
    return await readFile(/*turbopackIgnore: true*/ p);
  } catch {
    return null;
  }
}

export const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
};

/** Resolves a stored media URL ("/api/media/<name>") to its file contents and duration. */
export async function storedMediaInfo(url: string) {
  const m = /^\/api\/media\/([^/?#]+)$/.exec(url);
  if (!m) return null;
  const buf = await readStoredFile(m[1]);
  if (!buf) return null;
  return { buf, durationSec: readVideoDurationSec(buf) };
}
