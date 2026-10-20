"use client";

import { useAuth } from "@/components/AuthProvider";
import { AdRequests } from "@/components/AdRequests";

export default function WholesalerAdsPage() {
  const { user, wholesaler, loading } = useAuth();
  return <AdRequests ready={!loading && user?.role === "wholesaler" && !!wholesaler} />;
}
