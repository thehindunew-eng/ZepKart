import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { extraServices } from "@/db/schema";
import { ok, requireVendor, route } from "@/lib/api";
import { serviceInput } from "@/lib/validators";
import { publicService } from "@/lib/dto";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const { store } = await requireVendor();
  const rows = await db.select().from(extraServices).where(eq(extraServices.storeId, store.id)).orderBy(desc(extraServices.createdAt));
  return ok({ services: rows.map(publicService) });
});

export const POST = route(async (req) => {
  const { store } = await requireVendor();
  const body = serviceInput.parse(await req.json());
  const [row] = await db
    .insert(extraServices)
    .values({
      storeId: store.id,
      title: body.title,
      description: body.description || null,
      imageUrl: body.imageUrl || null,
      price: String(body.price),
      unitLabel: body.unitLabel,
      gstRate: body.gstRate,
      isActive: body.isActive,
    })
    .returning();
  return ok({ service: publicService(row) }, 201);
});
