"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Footprints, Truck, BadgePercent, Store, ShieldCheck } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { useCartActions, type ShopProduct, type ShopService } from "@/components/cards";
import { ChatThread } from "@/components/ChatThread";
import { Badge, Button, Glass, ProductImage, Skeleton, Stepper, StatusPill, VisitStoreButton, EmptyState } from "@/components/ui";
import { money, percentOff } from "@/lib/utils";

type ProductResp = {
  product: ShopProduct & { description: string | null; weightValue: number; gstRate: number };
  store: { id: string; shopName: string; locality: string | null; city: string; isOpen: boolean; nextOpeningAt: string | null; nextClosingAt: string | null; pickupAvailable: boolean; deliveryAvailable: boolean; etaMinutes: number; whatsapp: string | null; deliveryFee: number; freeDeliveryAbove: number; minOrder: number };
  services: ShopService[];
  threadId: string | null;
};

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useApi<ProductResp>(`/api/products/${id}`, { poll: 20000 });
  const { user, loading: authLoading } = useAuth();
  const { cart, setItemQty } = useCart();
  const { addProduct } = useCartActions();

  if (loading && !data) {
    return <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="aspect-square" /><div className="space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-24" /><Skeleton className="h-40" /></div></div>;
  }
  if (!data) {
    return <Glass><EmptyState title={error ? "We couldn't find this item" : "Loading…"} body={error ?? undefined} action={<Link href="/"><Button variant="soft">Back to home</Button></Link>} /></Glass>;
  }

  const { product: p, store: s } = data;
  const inBasket = cart.items.find((i) => i.productId === p.id)?.qty ?? 0;
  const off = percentOff(p.price, p.mrp);
  const canBuy = p.available && s.isOpen;
  const signedIn = !!user && user.role === "customer";

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink/65 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <Glass className="overflow-hidden !rounded-[32px]">
          <div className="relative aspect-square bg-white/40">
            <ProductImage src={p.imageUrl} category={p.category} alt={p.name} />
            {off > 0 && <span className="absolute left-4 top-4 rounded-full bg-emerald-700 px-3 py-1 text-[12px] font-black text-white">{off}% off</span>}
          </div>
        </Glass>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink/50">{p.category}</p>
            <h1 className="mt-1 text-[30px] font-black leading-tight tracking-[-0.02em] sm:text-[36px]">{p.name}</h1>
            <p className="mt-1 text-[14px] font-semibold text-ink/60">{p.weightLabel}</p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <span className="text-[34px] font-black tabular-nums">{money(p.price)}</span>
            {p.mrp > p.price && <span className="mb-1.5 text-[16px] font-semibold text-ink/40 line-through">{money(p.mrp)}</span>}
            <span className="mb-1.5 text-[12.5px] font-semibold text-ink/55">incl. GST {money(p.gstIncluded)}</span>
          </div>

          {p.description && <p className="text-[14.5px] leading-relaxed text-ink/70">{p.description}</p>}

          <div className="flex flex-wrap gap-2">
            {p.available ? <Badge tone="green">In stock{p.stockLeft != null ? ` · only ${p.stockLeft} left` : ""}</Badge> : <Badge tone="red">Sold out right now</Badge>}
            {p.bargainEnabled && <Badge tone="gold"><BadgePercent className="h-3 w-3" /> Open to offers in chat</Badge>}
            {s.pickupAvailable && <Badge tone="blue"><Footprints className="h-3 w-3" /> Pickup</Badge>}
            {s.deliveryAvailable && <Badge tone="purple"><Truck className="h-3 w-3" /> Delivery</Badge>}
          </div>

          <Glass className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold">{s.shopName}</p>
              <p className="text-[12.5px] text-ink/55">{s.locality}, {s.city}</p>
              <div className="mt-1.5 flex items-center gap-2"><StatusPill compact isOpen={s.isOpen} nextOpeningAt={s.nextOpeningAt} nextClosingAt={s.nextClosingAt} /><span className="flex items-center gap-1 text-[12px] font-semibold text-ink/60"><Clock className="h-3.5 w-3.5" /> {s.etaMinutes} min</span></div>
            </div>
            <VisitStoreButton storeId={s.id} />
          </Glass>

          <div className="flex flex-wrap items-center gap-3">
            {inBasket > 0 ? (
              <>
                <Stepper value={inBasket} onChange={(v) => setItemQty(p.id, v)} max={50} />
                <Link href="/cart"><Button variant="dark" size="lg">View basket</Button></Link>
              </>
            ) : (
              <Button size="lg" disabled={!canBuy || authLoading} onClick={() => addProduct(p, 1)}>
                {!s.isOpen ? "Store closed" : p.available ? `Add to basket · ${money(p.price)}` : "Sold out"}
              </Button>
            )}
          </div>

          {data.services.length > 0 && (
            <div className="space-y-2">
              <p className="text-[13px] font-extrabold uppercase tracking-wider text-ink/55">Extra services at this store</p>
              <div className="flex flex-wrap gap-2">
                {data.services.map((sv) => (
                  <span key={sv.id} className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold"><Store className="h-3.5 w-3.5" /> {sv.title} · {money(sv.price)}</span>
                ))}
              </div>
            </div>
          )}
          <p className="flex items-center gap-1.5 text-[12px] text-ink/50"><ShieldCheck className="h-3.5 w-3.5" /> Prices include GST. Live stock updates while you shop.</p>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-[20px] font-black tracking-tight">Chat with the store</h2>
          <p className="text-[13px] text-ink/55">Ask about this item, make an offer, or request pickup or delivery.</p>
        </div>
        <ChatThread
          mode="customer"
          threadId={data.threadId}
          productId={p.id}
          signedIn={signedIn}
          loginHref={`/auth?next=/products/${p.id}`}
        />
      </section>
    </div>
  );
}
