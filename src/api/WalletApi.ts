import { z } from "zod";
import { ApiClient } from "./ApiClient";

export const walletBalancesSchema = z.object({
  spendingBalanceSatang: z.number().int().nonnegative(),
  earningsBalanceSatang: z.number().int().nonnegative(),
  fundingReservedSatang: z.number().int().nonnegative(),
  reservedForPayoutsSatang: z.number().int().nonnegative(),
});
export type WalletBalances = z.infer<typeof walletBalancesSchema>;

export const walletResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    wallet: walletBalancesSchema,
  }),
});

export const topUpStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "EXPIRED",
  "FAILED",
]);
export type TopUpStatus = z.infer<typeof topUpStatusSchema>;

export const topUpQuoteResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().min(1),
    creditSatang: z.number().int().positive(),
    chargedFeeSatang: z.number().int().nonnegative(),
    chargedTaxSatang: z.number().int().nonnegative(),
    paymentTotalSatang: z.number().int().positive(),
    expiresAt: z.string(),
  }),
});
export type TopUpQuote = z.infer<typeof topUpQuoteResponseSchema>["data"];

export const topUpDataSchema = z.object({
  id: z.string().min(1),
  creditSatang: z.number().int().positive(),
  chargedFeeSatang: z.number().int().nonnegative(),
  chargedTaxSatang: z.number().int().nonnegative(),
  paymentTotalSatang: z.number().int().positive(),
  qrPayload: z.string().nullable(),
  qrDataUrl: z.string().nullable(),
  qrExpiresAt: z.string().nullable(),
  topUpStatus: topUpStatusSchema,
  createdAt: z.string(),
});
export type TopUpData = z.infer<typeof topUpDataSchema>;

export const topUpResponseSchema = z.object({
  success: z.literal(true),
  data: topUpDataSchema,
});
export const walletActivitySchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string(),
  type: z.enum(["TOP_UP", "SPEND", "EARN", "HOLD", "RELEASE", "CONVERT"]),
  activityStatus: z.enum(["PENDING", "COMPLETED", "FAILED"]),
  spendingDeltaSatang: z.number().int(),
  earningsDeltaSatang: z.number().int(),
  fundingReservedDeltaSatang: z.number().int(),
  payoutReservedDeltaSatang: z.number().int(),
  resourceType: z.string().nullable(),
  resourceId: z.string().nullable(),
});
export type WalletActivity = z.infer<typeof walletActivitySchema>;

export const walletActivitiesResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    activities: z.array(walletActivitySchema),
  }),
});

export type TransactionType =
  "TOP_UP" | "SPEND" | "EARN" | "HOLD" | "RELEASE" | "CONVERT";

export interface UserTransaction {
  id: string;
  type: TransactionType;
  title: string;
  titleTh: string;
  amountSatang: number;
  direction: "INFLOW" | "OUTFLOW";
  status: string;
  createdAt: string;
  reference?: string;
}

export interface UserTransactionHistoryResult {
  items: UserTransaction[];
}

function createIdempotencyKey(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

const activityLabels: Record<
  TransactionType,
  Pick<UserTransaction, "title" | "titleTh">
> = {
  TOP_UP: {
    title: "PromptPay Top-Up",
    titleTh: "เติมเงินผ่านพร้อมเพย์",
  },
  SPEND: {
    title: "Wallet Payment",
    titleTh: "การชำระเงินจากกระเป๋าเงิน",
  },
  EARN: {
    title: "Quest Earnings",
    titleTh: "รายได้จากเควสต์",
  },
  HOLD: {
    title: "Quest Escrow Reserved",
    titleTh: "กันเงินประกันเควสต์",
  },
  RELEASE: {
    title: "Quest Escrow Released",
    titleTh: "คืนเงินประกันเควสต์",
  },
  CONVERT: {
    title: "Earnings Converted",
    titleTh: "โอนรายได้เข้าสู่ยอดเงินพร้อมใช้",
  },
};

function transactionFromActivity(activity: WalletActivity): UserTransaction {
  const deltas = [
    activity.spendingDeltaSatang,
    activity.earningsDeltaSatang,
    activity.fundingReservedDeltaSatang,
    activity.payoutReservedDeltaSatang,
  ];
  const primaryDelta = deltas.find((delta) => delta !== 0) ?? 0;
  const labels = activityLabels[activity.type];

  return {
    id: activity.id,
    type: activity.type,
    title: labels.title,
    titleTh: labels.titleTh,
    amountSatang: Math.abs(primaryDelta),
    direction: primaryDelta > 0 ? "INFLOW" : "OUTFLOW",
    status: activity.activityStatus,
    createdAt: activity.occurredAt,
    reference: activity.resourceId ?? undefined,
  };
}

export const earningsConversionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().min(1),
    amountSatang: z.number().int().positive(),
    createdAt: z.string(),
  }),
});

export class WalletApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async getWallet(): Promise<WalletBalances> {
    const body = await this.client.request<unknown>("/api/v1/wallet");
    return walletResponseSchema.parse(body).data.wallet;
  }

  async convertEarnings(
    amountSatang: number,
    idempotencyKey = createIdempotencyKey()
  ): Promise<{ id: string; amountSatang: number }> {
    const body = await this.client.requestJson<unknown>(
      "/api/v1/wallet/earnings-conversions",
      { amountSatang },
      {
        method: "POST",
        headers: { "idempotency-key": idempotencyKey },
      }
    );
    return earningsConversionResponseSchema.parse(body).data;
  }

  async quoteTopUp(creditSatang: number): Promise<TopUpQuote> {
    const body = await this.client.requestJson<unknown>(
      "/api/v1/top-ups/quotes",
      { creditSatang },
      { method: "POST" }
    );
    return topUpQuoteResponseSchema.parse(body).data;
  }

  async createTopUp(
    quoteId: string,
    idempotencyKey = createIdempotencyKey()
  ): Promise<TopUpData> {
    const body = await this.client.requestJson<unknown>(
      "/api/v1/top-ups",
      { quoteId },
      {
        method: "POST",
        headers: { "idempotency-key": idempotencyKey },
      }
    );
    return topUpResponseSchema.parse(body).data;
  }

  async simulateTopUp(topUpId: string): Promise<TopUpData> {
    const body = await this.client.request<unknown>(
      `/api/v1/top-ups/${topUpId}/simulate`,
      { method: "POST" }
    );
    return topUpResponseSchema.parse(body).data;
  }

  async getTopUpStatus(topUpId: string): Promise<TopUpData> {
    const body = await this.client.request<unknown>(
      `/api/v1/top-ups/${topUpId}`
    );
    return topUpResponseSchema.parse(body).data;
  }

  async getTransactionHistory(
    limit = 20
  ): Promise<UserTransactionHistoryResult> {
    const body = await this.client.request<unknown>(
      `/api/v1/wallet/activities?limit=${limit}`
    );
    const activities =
      walletActivitiesResponseSchema.parse(body).data.activities;

    return {
      items: activities
        .map(transactionFromActivity)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    };
  }
}

export const walletApi = new WalletApi();
