import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const COOKIE_NAME = "zepkart_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
};

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is not set");
  return "zepkart-dev-only-secret";
}

/** Demo admin access password. Set ADMIN_ACCESS_PASSWORD in production; the fallback is for local demos only. */
export function adminAccessPassword(): string | null {
  const configured = process.env.ADMIN_ACCESS_PASSWORD;
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : "zepkart-admin-demo";
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export function signSession(user: SessionUser) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone ?? null, avatarUrl: user.avatarUrl ?? null },
    jwtSecret(),
    { expiresIn: "7d" },
  );
}

export function verifySession(token: string): SessionUser | null {
  try {
    return jwt.verify(token, jwtSecret()) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * True when the browser is on HTTPS. Proxies (Vercel, the preview host) forward x-forwarded-proto;
 * the Origin header of a POST is a second signal and is always sent by browsers over https.
 */
async function isSecureRequest(): Promise<boolean> {
  const h = await headers();
  const proto = (h.get("x-forwarded-proto") ?? h.get("x-forwarded-protocol") ?? "").split(",")[0].trim();
  if (proto) return proto === "https";
  return (h.get("origin") ?? "").startsWith("https://");
}

/**
 * Session cookie. On HTTPS it is SameSite=None; Secure so it survives when the app is
 * shown inside another site's iframe (the preview). Lax cookies are dropped there, which
 * made login succeed but the session vanish. Plain http keeps SameSite=Lax, since browsers
 * drop Secure cookies on http origins.
 */
export async function setSessionCookie(user: SessionUser) {
  const store = await cookies();
  const secure = await isSecureRequest();
  store.set(COOKIE_NAME, signSession(user), {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  const secure = await isSecureRequest();
  store.set(COOKIE_NAME, "", { httpOnly: true, sameSite: secure ? "none" : "lax", secure, path: "/", maxAge: 0 });
}

/** Returns the current user with fresh data from the database, or null. */
export async function currentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifySession(token);
  if (!session) return null;
  const rows = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  return rows[0] ?? null;
}
