import { readStoredFile, MIME } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const buf = await readStoredFile(name);
  if (!buf) return new Response("Not found", { status: 404 });
  const ext = name.split(".").pop() ?? "";
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Length": String(buf.length),
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    },
  });
}
