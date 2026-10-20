import { ok, route } from "@/lib/api";
import { liveFeaturedClips } from "@/lib/featured";

export const dynamic = "force-dynamic";

/** Public list of featured clips for the customer home. */
export const GET = route(async () => ok({ ads: await liveFeaturedClips() }));
