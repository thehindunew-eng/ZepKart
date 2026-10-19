import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, threads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sessionFromRequest } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json();
  if (!body.content?.trim() && !body.offerPrice) return NextResponse.json({ error: "Message empty" }, { status: 400 });
  const t = await db.select().from(threads).where(eq(threads.id, id)).limit(1);
  if (!t.length) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  const inserted = await db
    .insert(messages)
    .values({
      threadId: id,
      senderId: session.id,
      content: String(body.content || (body.offerPrice ? `Offered ₹${body.offerPrice}` : "")).slice(0, 2000),
      offerPrice: body.offerPrice ? String(body.offerPrice) : null,
    })
    .returning();
  await db.update(threads).set({ lastMessageAt: new Date(), offerPrice: body.offerPrice ? String(body.offerPrice) : t[0].offerPrice }).where(eq(threads.id, id));
  return NextResponse.json({ message: inserted[0] });
}
