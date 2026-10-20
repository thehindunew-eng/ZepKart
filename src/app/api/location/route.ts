import { fail, ok, route } from "@/lib/api";
import { locateByPincode } from "@/lib/ncr";

export const dynamic = "force-dynamic";

/** Resolves a pincode to a serviceable NCR locality so the shopper can set their location at the top of the page. */
export const GET = route(async (req) => {
  const pin = new URL(req.url).searchParams.get("pincode")?.trim() ?? "";
  if (!/^\d{6}$/.test(pin)) fail(400, "Enter a 6-digit pincode");
  const loc = locateByPincode(pin);
  if (!loc) fail(404, "We deliver in Delhi, Noida and Gurugram only");
  return ok({ location: { pincode: loc.pincode, city: loc.city, locality: loc.locality, lat: loc.lat, lng: loc.lng, exact: loc.exact } });
});
