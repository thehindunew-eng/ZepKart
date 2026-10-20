import { z } from "zod";
import { setSessionCookie } from "@/lib/auth";
import { fail, ok, route, safeUser } from "@/lib/api";
import { DEMO_ROLES, demoAccount, ensureDemoData } from "@/lib/demo-login";

export const dynamic = "force-dynamic";

const demoInput = z.object({ role: z.enum(DEMO_ROLES) });

/** One-click demo login. Creates the demo data on first use, then signs in the chosen role. */
export const POST = route(async (req) => {
  const { role } = demoInput.parse(await req.json());
  const ready = await ensureDemoData();
  if (!ready) fail(503, "Demo accounts are turned off on this server.");
  const user = await demoAccount(role);
  if (!user) fail(503, "Demo account is not ready yet. Try again in a moment.");
  const payload = safeUser(user);
  await setSessionCookie(payload);
  return ok({ user: payload });
});
