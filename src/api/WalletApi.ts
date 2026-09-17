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
  resourceType?: string | null;
  spendingDeltaSatang?: number;
  earningsDeltaSatang?: number;
  fundingReservedDeltaSatang?: number;
  payoutReservedDeltaSatang?: number;
}

export interface UserTransactionHistoryResult {
  items: UserTransaction[];
}

export function createIdempotencyKey(): string {
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
    resourceType: activity.resourceType,
    spendingDeltaSatang: activity.spendingDeltaSatang,
    earningsDeltaSatang: activity.earningsDeltaSatang,
    fundingReservedDeltaSatang: activity.fundingReservedDeltaSatang,
    payoutReservedDeltaSatang: activity.payoutReservedDeltaSatang,
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

export const payoutDestinationTypeSchema = z.enum([
  "PROMPTPAY",
  "BANK_ACCOUNT",
]);
export type PayoutDestinationType = z.infer<typeof payoutDestinationTypeSchema>;

export const payoutDestinationSchema = z.object({
  id: z.string().min(1),
  type: payoutDestinationTypeSchema,
  accountHolderName: z.string().min(1),
  maskedAccount: z.string().min(1),
  bankCode: z.string().nullable().optional(),
  isDefault: z.boolean(),
  createdAt: z.string(),
});
export type PayoutDestination = z.infer<typeof payoutDestinationSchema>;

export const createPayoutDestinationPayloadSchema = z.object({
  type: payoutDestinationTypeSchema,
  accountNumber: z.string().min(1),
  accountHolderName: z.string().min(1),
  bankCode: z.string().min(1).nullable().optional(),
});
export type CreatePayoutDestinationPayload = z.infer<
  typeof createPayoutDestinationPayloadSchema
>;

export const payoutDestinationsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    destinations: z.array(payoutDestinationSchema),
  }),
});
export type PayoutDestinationsResponse = z.infer<
  typeof payoutDestinationsResponseSchema
>;

export const payoutDestinationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    destination: payoutDestinationSchema,
  }),
});

export const deletePayoutDestinationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().min(1),
  }),
});

export const payoutStatusSchema = z.enum([
  "PENDING_ADMIN_APPROVAL",
  "SUBMITTED_TO_PROVIDER",
  "PROVIDER_PENDING",
  "SUCCEEDED",
  "FAILED",
  "REJECTED",
]);
export type PayoutStatus = z.infer<typeof payoutStatusSchema>;

export const payoutRecordSchema = z.object({
  id: z.string().min(1),
  amountSatang: z.number().int(),
  feeSatang: z.number().int(),
  status: payoutStatusSchema,
  destination: z.object({
    type: payoutDestinationTypeSchema,
    maskedAccount: z.string().min(1),
  }),
  createdAt: z.string(),
});
export type PayoutRecord = z.infer<typeof payoutRecordSchema>;

export const requestPayoutPayloadSchema = z.object({
  amountSatang: z.number().int().positive(),
  destinationId: z.string().min(1),
});
export type RequestPayoutPayload = z.infer<typeof requestPayoutPayloadSchema>;

export const payoutResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    payout: payoutRecordSchema,
  }),
});

export const payoutsListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    payouts: z.array(payoutRecordSchema),
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

  async listPayoutDestinations(): Promise<PayoutDestination[]> {
    const body = await this.client.request<unknown>(
      "/api/v1/payout-destinations"
    );
    return payoutDestinationsResponseSchema.parse(body).data.destinations;
  }

  async createPayoutDestination(
    payload: CreatePayoutDestinationPayload
  ): Promise<PayoutDestination> {
    const validatedPayload =
      createPayoutDestinationPayloadSchema.parse(payload);
    const body = await this.client.requestJson<unknown>(
      "/api/v1/payout-destinations",
      validatedPayload,
      { method: "POST" }
    );
    return payoutDestinationResponseSchema.parse(body).data.destination;
  }

  async deletePayoutDestination(id: string): Promise<{ id: string }> {
    const body = await this.client.request<unknown>(
      `/api/v1/payout-destinations/${id}`,
      { method: "DELETE" }
    );
    return deletePayoutDestinationResponseSchema.parse(body).data;
  }

  async requestPayout(
    amountSatang: number,
    destinationId: string,
    idempotencyKey = createIdempotencyKey()
  ): Promise<PayoutRecord> {
    const payload = requestPayoutPayloadSchema.parse({
      amountSatang,
      destinationId,
    });
    const body = await this.client.requestJson<unknown>(
      "/api/v1/payouts",
      payload,
      {
        method: "POST",
        headers: { "idempotency-key": idempotencyKey },
      }
    );
    return payoutResponseSchema.parse(body).data.payout;
  }

  async listPayouts(): Promise<PayoutRecord[]> {
    const body = await this.client.request<unknown>("/api/v1/payouts");
    return payoutsListResponseSchema.parse(body).data.payouts;
  }
}

export const walletApi = new WalletApi();
