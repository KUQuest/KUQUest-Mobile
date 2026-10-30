import type { PayoutStatus } from "@/api/WalletApi";

export type PayoutTone = "success" | "danger" | "warning";

export const PAYOUT_STATUS_TONE: Record<PayoutStatus, PayoutTone> = {
  PENDING_ADMIN_APPROVAL: "warning",
  SUBMITTED_TO_PROVIDER: "warning",
  PROVIDER_PENDING: "warning",
  SUCCEEDED: "success",
  FAILED: "danger",
  CANCELLED: "danger",
  REJECTED: "danger",
};

export const PAYOUT_TONE_CLASSES: Record<
  PayoutTone,
  { pill: string; dot: string }
> = {
  success: {
    pill: "border-ku-border-success bg-ku-surface-success",
    dot: "bg-ku-success",
  },
  danger: {
    pill: "border-ku-border-danger bg-ku-surface-danger",
    dot: "bg-ku-danger",
  },
  warning: {
    pill: "border-ku-border-warning bg-ku-surface-warning",
    dot: "bg-ku-warning",
  },
};

function isPayoutStatus(status: string): status is PayoutStatus {
  return Object.prototype.hasOwnProperty.call(PAYOUT_STATUS_TONE, status);
}

/** Unknown statuses read as in-progress rather than as a failure. */
export function getPayoutTone(status: string): PayoutTone {
  return isPayoutStatus(status) ? PAYOUT_STATUS_TONE[status] : "warning";
}
