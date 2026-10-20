"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Trash2, Footprints, Truck, Loader2, BadgeCheck, ArrowLeft } from "lucide-react";
import { api } from "@/hooks/useApi";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/Toast";
import { Badge, Button, EmptyState, Field, Glass, Stepper, Skeleton, ProductImage } from "@/components/ui";
import { money } from "@/lib/utils";
import { CITIES } from "@/lib/ncr";

type Quote = {
  items: { productId: string; name: string; listPrice: number; unitPrice: number; qty: number; gstAmount: number; lineTotal: number; agreed: boolean }[];
  services: { serviceId: string; title: string; unitPrice: number; qty: number; gstAmount: number; lineTotal: number }[];
  subtotal: number;
  servicesTotal: number;
  deliveryFee: number;
  gstAmount: number;
  total: number;
  minOrder: number;
  issues: string[];
};

export default function CartPage() {
  const { cart, setItemQty, setServiceQty, clear } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [form, setForm] = useState({ customerName: "", phone: "", address: "", pincode: "", note: "" });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [storeInfo, setStoreInfo] = useState<{ isOpen: boolean; pickupAvailable: boolean; deliveryAvailable: boolean; city: string } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [placing, setPlacing] = useState(false);

  const linesKey = useMemo(() => JSON.stringify({ s: cart.storeId, i: cart.items.map((i) => [i.productId, i.qty]), v: cart.services.map((x) => [x.serviceId, x.qty]), f: fulfillment }), [cart, fulfillment]);
  const hasLines = cart.items.length + cart.services.length > 0;

  // Prefill from the account until the shopper edits a field.
  const contact = { customerName: form.customerName || user?.name || "", phone: form.phone || user?.phone || "" };
  const canQuote = !!cart.storeId && hasLines && !!user && user.role === "customer";
  const shownQuote = canQuote ? quote : null;

  useEffect(() => {
    if (!canQuote) return;
    let cancel = false;
    const t = setTimeout(async () => {
      setQuoting(true);
      try {
        const r = await api<{ quote: Quote; storeOpen: boolean }>("/api/orders/quote", {
          json: { storeId: cart.storeId, items: cart.items.map((i) => ({ productId: i.productId, qty: i.qty })), services: cart.services.map((x) => ({ serviceId: x.serviceId, qty: x.qty })), fulfillment },
        });
        if (!cancel) {
          setQuote(r.quote);
          setStoreInfo((s) => ({ ...(s ?? { pickupAvailable: true, deliveryAvailable: true, city: "" }), isOpen: r.storeOpen }));
        }
      } catch (e) {
        if (!cancel) setQuote(null);
        if (!cancel && (e as Error).message) toast((e as Error).message, "error");
      } finally {
        if (!cancel) setQuoting(false);
      }
    }, 250);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
     
  }, [linesKey, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) return <Skeleton className="h-96" />;

  if (!hasLines) {
    return (
      <Glass>
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Your basket is empty" body="Add items from a store near you. Your basket stays here even if you close the app." action={<Link href="/"><Button>Browse stores</Button></Link>} />
      </Glass>
    );
  }

  if (!user || user.role !== "customer") {
    return (
      <Glass>
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Log in to check out" body="Your basket is saved on this device." action={<Link href="/auth?next=/cart"><Button>Log in to continue</Button></Link>} />
      </Glass>
    );
  }

  const deliveryOk = storeInfo ? storeInfo.deliveryAvailable : true;
  const pickupOk = storeInfo ? storeInfo.pickupAvailable : true;
  const canPlace = !!shownQuote && shownQuote.issues.length === 0 && shownQuote.items.length + shownQuote.services.length > 0 && !placing && (storeInfo?.isOpen ?? false) && contact.customerName.trim().length >= 2 && contact.phone.trim().length >= 10 && (fulfillment === "pickup" || (form.address.trim().length >= 5 && /^(110|201|122)\d{3}$/.test(form.pincode.trim())));

  const place = async () => {
    if (!cart.storeId) return;
    setPlacing(true);
    try {
      const r = await api<{ order: { id: string } }>("/api/orders", {
        json: {
          storeId: cart.storeId,
          items: cart.items.map((i) => ({ productId: i.productId, qty: i.qty })),
          services: cart.services.map((x) => ({ serviceId: x.serviceId, qty: x.qty })),
          fulfillment,
          customerName: contact.customerName.trim(),
          phone: contact.phone.trim(),
          address: fulfillment === "delivery" ? form.address.trim() : undefined,
          pincode: fulfillment === "delivery" ? form.pincode.trim() : undefined,
          note: form.note.trim() || undefined,
        },
      });
      clear();
      toast("Booking placed. The store will confirm shortly.");
      router.push(`/orders?placed=${r.order.id}`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-black tracking-tight">Basket</h1>
            <p className="text-[14px] text-ink/55">From <Link href={`/stores/${cart.storeId}`} className="font-bold text-ink hover:underline">{cart.storeName}</Link></p>
          </div>
          <button onClick={() => clear()} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-bold text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Empty basket</button>
        </div>

        <Glass className="divide-y divide-ink/5 !rounded-[28px] p-2">
          {cart.items.map((i) => {
            const line = shownQuote?.items.find((q) => q.productId === i.productId);
            return (
              <div key={i.productId} className="flex items-center gap-4 p-3 sm:p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/60"><ProductImage src={i.imageUrl} category="Grocery" alt="" /></div>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${i.productId}`} className="block truncate text-[14.5px] font-extrabold hover:underline">{i.name}</Link>
                  <p className="text-[12.5px] text-ink/55">{i.weightLabel}</p>
                  <p className="mt-0.5 text-[13.5px] font-bold">{money(i.price)} {line?.agreed && <Badge tone="green" className="ml-1">Agreed price</Badge>}</p>
                </div>
                <Stepper value={i.qty} max={50} size="sm" onChange={(v) => setItemQty(i.productId, v)} />
                <p className="w-20 text-right text-[14px] font-black tabular-nums">{money((line?.lineTotal ?? i.price * i.qty))}</p>
              </div>
            );
          })}
          {cart.services.map((x) => (
            <div key={x.serviceId} className="flex items-center gap-4 p-3 sm:p-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-amber-100/70 text-2xl">🛠️</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-extrabold">{x.title}</p>
                <p className="text-[12.5px] text-ink/55">{x.unitLabel} · {money(x.price)}</p>
              </div>
              <Stepper value={x.qty} max={10} size="sm" onChange={(v) => setServiceQty(x.serviceId, v)} />
              <p className="w-20 text-right text-[14px] font-black tabular-nums">{money(x.price * x.qty)}</p>
            </div>
          ))}
        </Glass>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <Glass className="space-y-5 !rounded-[28px] p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-white/50 p-1">
            <button disabled={!pickupOk} onClick={() => setFulfillment("pickup")} className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13.5px] font-bold transition ${fulfillment === "pickup" ? "bg-ink text-white shadow" : "text-ink/70 disabled:opacity-40"}`}><Footprints className="h-4 w-4" /> Pickup</button>
            <button disabled={!deliveryOk} onClick={() => setFulfillment("delivery")} className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13.5px] font-bold transition ${fulfillment === "delivery" ? "bg-ink text-white shadow" : "text-ink/70 disabled:opacity-40"}`}><Truck className="h-4 w-4" /> Delivery</button>
          </div>

          <div className="grid gap-3">
            <Field label="Your name"><input className="field" value={contact.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></Field>
            <Field label="Mobile number"><input className="field" inputMode="tel" value={contact.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98xxxxxx10" /></Field>
            {fulfillment === "delivery" && (
              <>
                <Field label="Delivery address"><input className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House / flat, street, area" /></Field>
                <Field label="Pincode" hint={`NCR only (${CITIES.join(", ")})`}><input className="field" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></Field>
              </>
            )}
            <Field label="Note for the shop (optional)"><input className="field" maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          </div>

          <div className="space-y-2 rounded-2xl bg-white/50 p-4 text-[13.5px]">
            {quoting && !shownQuote && <div className="flex items-center gap-2 text-ink/55"><Loader2 className="h-4 w-4 animate-spin" /> Pricing your basket…</div>}
            {shownQuote && (
              <>
                <Row label="Items (incl. GST)" value={money(shownQuote.subtotal)} />
                {shownQuote.servicesTotal > 0 && <Row label="Services (incl. GST)" value={money(shownQuote.servicesTotal)} />}
                {fulfillment === "delivery" && <Row label="Delivery fee" value={shownQuote.deliveryFee ? money(shownQuote.deliveryFee) : "Free"} />}
                <Row label="GST included" value={money(shownQuote.gstAmount)} muted />
                <div className="my-2 h-px bg-ink/10" />
                <Row label="Total" value={money(shownQuote.total)} strong />
              </>
            )}
            {shownQuote?.issues.map((x) => <p key={x} className="pt-1 text-[12.5px] font-semibold text-red-700">{x}</p>)}
            {storeInfo && !storeInfo.isOpen && <p className="pt-1 text-[12.5px] font-semibold text-red-700">This store is closed right now. Try again when it opens.</p>}
          </div>

          <Button block size="lg" disabled={!canPlace} onClick={place}>
            {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />} Place booking{shownQuote ? ` · ${money(shownQuote.total)}` : ""}
          </Button>
          <p className="text-center text-[12px] text-ink/50">Pay at pickup or on delivery. The store confirms your booking.</p>
          <Link href={`/stores/${cart.storeId}`} className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-ink/60 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Add more from this store</Link>
        </Glass>
      </div>
    </div>
  );
}

function Row({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-ink/50" : ""} ${strong ? "text-[17px] font-black" : "font-semibold"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
