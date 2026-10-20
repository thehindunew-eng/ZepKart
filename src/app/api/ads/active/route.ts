import { ok, route } from "@/lib/api";
import { liveFeaturedClips } from "@/lib/featured";

export const dynamic = "force-dynamic";

/** Kept for older clients. Same data as /api/featured. */
export const GET = route(async () => ok({ ads: await liveFeaturedClips() }));
