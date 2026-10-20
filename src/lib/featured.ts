import { and, asc, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { featuredClips, stores } from "@/db/schema";

/** Clips that are switched on and not expired. Shown in the customer home "Featured" carousel. */
export async function liveFeaturedClips(now = new Date()) {
  const rows = await db
    .select({ c: featuredClips, s: stores })
    .from(featuredClips)
    .leftJoin(stores, eq(featuredClips.storeId, stores.id))
    .where(and(eq(featuredClips.isActive, true), or(isNull(featuredClips.endsAt), gt(featuredClips.endsAt, now))))
    .orderBy(asc(featuredClips.sortOrder), asc(featuredClips.createdAt))
    .limit(12);
  return rows.map((r) => ({
    id: r.c.id,
    title: r.c.title,
    subtitle: r.c.subtitle,
    videoUrl: r.c.videoUrl,
    durationSec: r.c.durationSec,
    storeId: r.s?.id ?? null,
    storeName: r.s?.shopName ?? "ZepKart",
    storeLocality: r.s?.locality ?? null,
    city: r.s?.city ?? null,
  }));
}
