/** Client-safe order status labels and transitions (no database imports). */

/** Allowed vendor transitions. */
export const NEXT_STATUS: Record<string, { action: string; to: string; label: string }[]> = {
  new: [
    { action: "accept", to: "accepted", label: "Accept" },
    { action: "reject", to: "rejected", label: "Reject" },
  ],
  accepted: [{ action: "preparing", to: "preparing", label: "Start preparing" }],
  preparing: [
    { action: "ready", to: "ready", label: "Ready for pickup" },
    { action: "out_for_delivery", to: "out_for_delivery", label: "Out for delivery" },
  ],
  ready: [{ action: "complete", to: "completed", label: "Mark completed" }],
  out_for_delivery: [{ action: "complete", to: "completed", label: "Mark delivered" }],
};

export const STATUS_LABEL: Record<string, string> = {
  new: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function progressSteps(fulfillment: string) {
  const last = fulfillment === "delivery" ? "out_for_delivery" : "ready";
  return ["new", "accepted", "preparing", last, "completed"];
}
