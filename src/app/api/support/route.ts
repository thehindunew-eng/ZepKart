import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { ok, route } from "@/lib/api";
import { supportCreate } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** Contact form. Open to guests too. Signed-in users are linked to the ticket. */
export const POST = route(async (req) => {
  const body = supportCreate.parse(await req.json());
  const user = await currentUser();
  const [row] = await db
    .insert(supportTickets)
    .values({
      userId: user?.id ?? null,
      name: body.name,
      contact: body.contact,
      topic: body.topic,
      orderRef: body.orderRef || null,
      message: body.message,
    })
    .returning({ id: supportTickets.id });
  return ok({ id: row.id, message: "Thanks. Our team will reply on your contact details within 24 hours." }, 201);
});
