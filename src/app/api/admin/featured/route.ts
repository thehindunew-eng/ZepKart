import { asc } from "drizzle-orm";
import { db } from "@/db";
import { featuredClips } from "@/db/schema";
import { ok, requireAdmin, route } from "@/lib/api";
import { featuredInput } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const rows = await db.select().from(featuredClips).orderBy(asc(featuredClips.sortOrder), asc(featuredClips.createdAt));
  return ok({ clips: rows });
});

/** Admin adds a clip by uploading a video or pasting an MP4 link. */
export const POST = route(async (req) => {
  await requireAdmin();
  const body = featuredInput.parse(await req.json());
  const [row] = await db
    .insert(featuredClips)
    .values({
      title: body.title,
      subtitle: body.subtitle || null,
      videoUrl: body.videoUrl,
      durationSec: body.durationSec,
      storeId: body.storeId ?? null,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    })
    .returning();
  return ok({ clip: row }, 201);
});
