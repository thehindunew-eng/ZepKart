import { ok, requireVendor, route, fail } from "@/lib/api";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, readVideoDurationSec, saveFile, validateUpload } from "@/lib/media";
import { MAX_AD_SECONDS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/** Vendor uploads: images (DP, cover, product, service) or a short advertisement video. */
export const POST = route(async (req) => {
  await requireVendor();
  const form = await req.formData();
  const file = form.get("file");
  const kind = form.get("kind") === "video" ? "video" : "image";
  if (!(file instanceof File)) fail(400, "Choose a file to upload");
  const limit = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) fail(400, kind === "video" ? "Video must be 60 MB or smaller" : "Image must be 5 MB or smaller");
  if (file.size === 0) fail(400, "The file is empty");

  const buf = Buffer.from(await file.arrayBuffer());
  const detected = validateUpload(buf, kind);
  let durationSec: number | null = null;
  if (detected.kind === "video") {
    durationSec = readVideoDurationSec(buf);
    if (durationSec == null) fail(400, "We couldn't read this video's length. Try re-exporting as MP4.");
    if (durationSec > MAX_AD_SECONDS) fail(400, `Video is ${Math.ceil(durationSec)} seconds. Advertisements must be ${MAX_AD_SECONDS} seconds or less.`);
  }
  const url = await saveFile(buf, detected.ext);
  return ok({ url, kind: detected.kind, durationSec }, 201);
});
