"use client";

import { AdRequests } from "@/components/AdRequests";
import { useVendorGate } from "@/components/vendor/useVendorData";

export default function AdsPage() {
  const gate = useVendorGate();
  return <AdRequests ready={gate.ready} showMarket />;
}
