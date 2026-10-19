import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/db";
import { stores, users } from "@/db/schema";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function fail(status: number, message: string): never {
  throw new HttpError(status, message);
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler so thrown errors become clean JSON responses. */
export function route<C = unknown>(handler: Handler<C>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) {
        const first = e.issues[0];
        const field = first?.path?.join(".");
        return NextResponse.json({ error: field ? `${field}: ${first.message}` : first?.message ?? "Invalid input" }, { status: 400 });
      }
      console.error("[api]", req.method, new URL(req.url).pathname, e);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function requireUser(role?: "customer" | "vendor") {
  const user = await currentUser();
  if (!user) fail(401, "Please log in to continue");
  if (role && user.role !== role) fail(403, role === "vendor" ? "Vendor account required" : "Customer account required");
  return user;
}

/** Vendor helper: returns the logged-in vendor and their store. */
export async function requireVendor() {
  const user = await requireUser("vendor");
  const rows = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
  const store = rows[0];
  if (!store) fail(404, "Store not found for this account");
  return { user, store };
}

export const safeUser = (u: typeof users.$inferSelect) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  phone: u.phone,
  avatarUrl: u.avatarUrl,
});
