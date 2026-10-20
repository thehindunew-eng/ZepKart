import { eq } from "drizzle-orm";
import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { fail, ok, requireAdmin, route } from "@/lib/api";
import { supportPatch } from "@/lib/validators";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = supportPatch.parse(await req.json());
  const [row] = await db.update(supportTickets).set({ status: body.status }).where(eq(supportTickets.id, id)).returning();
  if (!row) fail(404, "Ticket not found");
  return ok({ ticket: row });
});
