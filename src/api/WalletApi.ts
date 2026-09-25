import { z } from "zod";
import { ApiClient, type RequestOptions } from "./ApiClient";

export const walletBalancesSchema = z.object({
  spendingBalanceSatang: z.number().int().nonnegative(),
  earningsBalanceSatang: z.number().int().nonnegative(),
  fundingReservedSatang: z.number().int().nonnegative(),
  reservedForPayoutsSatang: z.number().int().nonnegative(),
});
export type WalletBalances = z.infer<typeof walletBalancesSchema>;

export const walletDataSchema = z.object({
  wallet: walletBalancesSchema,
});

export const topUpStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "EXPIRED",
  "FAILED",
]);
export type TopUpStatus = z.infer<typeof topUpStatusSchema>;

export const topUpQuoteDataSchema = z.object({
  id: z.string().min(1),
  creditSatang: z.number().int().positive(),
  chargedFeeSatang: z.number().int().nonnegative(),
  chargedTaxSatang: z.number().int().nonnegative(),
  paymentTotalSatang: z.number().int().positive(),
  expiresAt: z.string(),
});
export type TopUpQuote = z.infer<typeof topUpQuoteDataSchema>;

export const topUpDataSchema = z.object({
  id: z.string().min(1),
  internalReference: z.string().min(1),
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

export const walletActivitySchema = z.object({
  id: z.string().min(1),
  ledgerTransactionId: z.string().min(1).optional(),
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

export const walletActivitiesDataSchema = z.object({
  activities: z.array(walletActivitySchema),
});
export const topUpListItemSchema = z.object({
  id: z.string().min(1),
  internalReference: z.string().optional(),
  creditSatang: z.union([z.number(), z.string()]).transform(Number),
  paymentTotalSatang: z
    .union([z.number(), z.string()])
    .transform(Number)
    .optional(),
  topUpStatus: z.string(),
  creditedLedgerTransactionId: z.string().nullable().optional(),
  createdAt: z.string(),
  qrExpiresAt: z.string().nullable().optional(),
});
export type TopUpListItem = z.infer<typeof topUpListItemSchema>;

export const topUpsListDataSchema = z.object({
  items: z.array(topUpListItemSchema),
});
export const payoutListItemSchema = z.object({
  id: z.string().min(1),
  internalReference: z.string().optional(),
  principalSatang: z
    .union([z.number(), z.string()])
    .transform(Number)
    .optional(),
  amountSatang: z.union([z.number(), z.string()]).transform(Number).optional(),
  feeSatang: z.union([z.number(), z.string()]).transform(Number).optional(),
  payoutStatus: z.string().optional(),
  status: z.string().optional(),
  destinationMaskedLastFour: z.string().optional(),
  destinationBankCode: z.string().optional(),
  destinationAccountHolderName: z.string().optional(),
  destination: z
    .object({
      type: z.string().optional(),
      maskedAccount: z.string().optional(),
    })
    .optional(),
  createdAt: z.string(),
  reserveLedgerTransactionId: z.string().optional(),
  finalLedgerTransactionId: z.string().nullable().optional(),
});
export type PayoutListItem = z.infer<typeof payoutListItemSchema>;

export const WalletTransactionType = {
  TOP_UP: "TOP_UP",
  SPEND: "SPEND",
  EARN: "EARN",
  HOLD: "HOLD",
  RELEASE: "RELEASE",
  CONVERT: "CONVERT",
  PAYOUT: "PAYOUT",
} as const;
export type TransactionType =
  (typeof WalletTransactionType)[keyof typeof WalletTransactionType];

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
  ledgerTransactionId?: string;
  spendingDeltaSatang?: number;
  earningsDeltaSatang?: number;
  fundingReservedDeltaSatang?: number;
  payoutReservedDeltaSatang?: number;
  sourceApi?: "ACTIVITIES" | "TOP_UPS" | "PAYOUTS";
  destinationInfo?: string;
  expiresAt?: string;
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
  PAYOUT: {
    title: "Bank Payout",
    titleTh: "ถอนเงินเข้าบัญชีธนาคาร",
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
    ledgerTransactionId: activity.ledgerTransactionId,
    spendingDeltaSatang: activity.spendingDeltaSatang,
    earningsDeltaSatang: activity.earningsDeltaSatang,
    fundingReservedDeltaSatang: activity.fundingReservedDeltaSatang,
    payoutReservedDeltaSatang: activity.payoutReservedDeltaSatang,
  };
}
export const earningsConversionDataSchema = z.object({
  id: z.string().min(1),
  amountSatang: z.coerce.number().int().positive(),
  createdAt: z.string(),
});

export const payoutDestinationTypeSchema = z.enum([
  "PROMPTPAY",
  "BANK_ACCOUNT",
]);
export type PayoutDestinationType = z.infer<typeof payoutDestinationTypeSchema>;

export const payoutDestinationSchema = z.object({
  id: z.string().min(1),
  principalUserId: z.string().optional(),
  recipientType: z.literal("SELF").optional(),
  givenName: z.string().optional(),
  surname: z.string().optional(),
  relationship: z.literal("SELF").optional(),
  accountCountry: z.string().optional(),
  accountCurrency: z.string().optional(),
  bankCode: z.string().nullable().optional(),
  accountHolderName: z.string().min(1),
  routingType: z.enum(["BANK_ACCOUNT", "PROMPTPAY"]).optional(),
  maskedLastFour: z.string().optional(),
  maskedRoutingValue: z.string().optional(),
  createdAt: z.string(),
  retiredAt: z.string().nullable().optional(),
  // compatibility with mobile client properties
  type: payoutDestinationTypeSchema.optional(),
  maskedAccount: z.string().optional(),
  isDefault: z.boolean().optional(),
});
export type PayoutDestination = z.infer<typeof payoutDestinationSchema>;

export function normalizePayoutDestination(
  raw: PayoutDestination
): PayoutDestination {
  const resolvedType =
    raw.type ??
    (raw.routingType === "PROMPTPAY" ? "PROMPTPAY" : "BANK_ACCOUNT");
  const resolvedMasked =
    raw.maskedAccount ??
    raw.maskedRoutingValue ??
    (raw.maskedLastFour ? `•••• ${raw.maskedLastFour}` : "");
  return {
    ...raw,
    type: resolvedType,
    routingType: raw.routingType ?? resolvedType,
    maskedAccount: resolvedMasked,
    isDefault: raw.isDefault ?? true,
  };
}

export const createPayoutDestinationPayloadSchema = z.object({
  givenName: z.string().min(1).optional(),
  surname: z.string().min(1).optional(),
  accountHolderName: z.string().min(1),
  bankCode: z.string().min(1).optional(),
  accountNumber: z.string().min(1),
  routingType: z.enum(["BANK_ACCOUNT", "PROMPTPAY"]).optional(),
  routingValue: z.string().optional(),
  recipientType: z.literal("SELF").optional(),
  relationship: z.literal("SELF").optional(),
  accountCountry: z.literal("TH").optional(),
  accountCurrency: z.literal("THB").optional(),
  // compatibility with existing callers
  type: payoutDestinationTypeSchema.optional(),
});
export type CreatePayoutDestinationPayload = z.input<
  typeof createPayoutDestinationPayloadSchema
>;

export const activePayoutDestinationDataSchema = z.union([
  payoutDestinationSchema.nullable(),
  z
    .object({
      destinations: z.array(payoutDestinationSchema),
    })
    .transform((val) => val.destinations[0] ?? null),
]);

export const payoutDestinationsDataSchema = z.union([
  z.object({
    destinations: z.array(payoutDestinationSchema),
  }),
  payoutDestinationSchema.nullable().transform((destination) => ({
    destinations: destination ? [normalizePayoutDestination(destination)] : [],
  })),
]);
export type PayoutDestinationsResponse = z.infer<
  typeof payoutDestinationsDataSchema
>;

export const payoutDestinationDataSchema = z
  .union([
    z
      .object({
        destination: payoutDestinationSchema,
      })
      .transform((val) => val.destination),
    payoutDestinationSchema,
  ])
  .nullable();

export const deletePayoutDestinationDataSchema = z
  .object({
    retired: z.boolean().optional(),
    id: z.string().optional(),
  })
  .optional();

export const payoutStatusSchema = z.enum([
  "PENDING_ADMIN_APPROVAL",
  "SUBMITTED_TO_PROVIDER",
  "PROVIDER_PENDING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "REJECTED",
]);
export type PayoutStatus = z.infer<typeof payoutStatusSchema>;

export const payoutQuoteSchema = z.object({
  id: z.string().min(1),
  principalUserId: z.string().optional(),
  payoutDestinationId: z.string().optional(),
  policyRevisionId: z.string().optional(),
  receiptSatang: z.union([z.number(), z.string()]).transform(Number),
  maximumFeeSatang: z.union([z.number(), z.string()]).transform(Number),
  maximumTaxSatang: z.union([z.number(), z.string()]).transform(Number),
  maximumDebitSatang: z.union([z.number(), z.string()]).transform(Number),
  feeRoundingMode: z.string().optional(),
  expiresAt: z.string(),
  consumedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type PayoutQuote = z.infer<typeof payoutQuoteSchema>;

export const payoutStatusHistoryItemSchema = z.object({
  id: z.string().min(1),
  fromStatus: z.string().nullable(),
  toStatus: z.string(),
  providerStatus: z.string().nullable().optional(),
  actorUserId: z.string().nullable().optional(),
  actorAdminId: z.string().nullable().optional(),
  source: z.string().optional(),
  reason: z.string().nullable().optional(),
  occurredAt: z.string(),
});
export type PayoutStatusHistoryItem = z.infer<
  typeof payoutStatusHistoryItemSchema
>;

export const payoutStatusHistoryDataSchema = z.array(
  payoutStatusHistoryItemSchema
);

export const payoutRecordSchema = z.object({
  id: z.string().min(1),
  internalReference: z.string().optional(),
  principalUserId: z.string().optional(),
  quoteId: z.string().optional(),
  payoutDestinationId: z.string().optional(),
  principalSatang: z
    .union([z.number(), z.string()])
    .transform(Number)
    .optional(),
  receiptSatang: z.union([z.number(), z.string()]).transform(Number).optional(),
  maximumFeeSatang: z
    .union([z.number(), z.string()])
    .transform(Number)
    .optional(),
  maximumTaxSatang: z
    .union([z.number(), z.string()])
    .transform(Number)
    .optional(),
  maximumDebitSatang: z
    .union([z.number(), z.string()])
    .transform(Number)
    .optional(),
  actualFeeSatang: z
    .union([z.number(), z.string()])
    .transform(Number)
    .nullable()
    .optional(),
  actualTaxSatang: z
    .union([z.number(), z.string()])
    .transform(Number)
    .nullable()
    .optional(),
  actualDebitSatang: z
    .union([z.number(), z.string()])
    .transform(Number)
    .nullable()
    .optional(),
  payoutStatus: payoutStatusSchema.optional(),
  status: payoutStatusSchema.optional(),
  amountSatang: z.union([z.number(), z.string()]).transform(Number).optional(),
  feeSatang: z.union([z.number(), z.string()]).transform(Number).optional(),
  destination: z
    .object({
      type: payoutDestinationTypeSchema.optional(),
      maskedAccount: z.string().optional(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type PayoutRecord = z.infer<typeof payoutRecordSchema>;

export const requestPayoutPayloadSchema = z.object({
  amountSatang: z.number().int().positive().optional(),
  destinationId: z.string().min(1).optional(),
  quoteId: z.string().min(1).optional(),
});
export type RequestPayoutPayload = z.infer<typeof requestPayoutPayloadSchema>;

export const payoutDataSchema = z.union([
  z
    .object({
      payout: payoutRecordSchema,
    })
    .transform((val) => val.payout),
  payoutRecordSchema,
]);

export const payoutsListDataSchema = z.object({
  items: z.array(payoutListItemSchema),
});
function normalizePayout(raw: PayoutRecord): PayoutRecord {
  const resolvedStatus =
    raw.status ?? raw.payoutStatus ?? "PENDING_ADMIN_APPROVAL";
  return {
    ...raw,
    amountSatang:
      raw.amountSatang ?? raw.receiptSatang ?? raw.principalSatang ?? 0,
    feeSatang:
      raw.feeSatang ?? raw.actualFeeSatang ?? raw.maximumFeeSatang ?? 0,
    status: resolvedStatus,
    payoutStatus: resolvedStatus,
  };
}

export class WalletApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  async getWallet(options?: RequestOptions): Promise<WalletBalances> {
    return (await this.client.get("/api/v1/wallet", walletDataSchema, options))
      .wallet;
  }

  async convertEarnings(
    amountSatang: number,
    idempotencyKey = createIdempotencyKey()
  ): Promise<{ id: string; amountSatang: number }> {
    return this.client.send(
      "POST",
      "/api/v1/wallet/earnings-conversions",
      earningsConversionDataSchema,
      { json: { amountSatang }, idempotencyKey }
    );
  }

  async quoteTopUp(creditSatang: number): Promise<TopUpQuote> {
    return this.client.send(
      "POST",
      "/api/v1/top-ups/quotes",
      topUpQuoteDataSchema,
      { json: { creditSatang } }
    );
  }

  async createTopUp(
    quoteId: string,
    idempotencyKey = createIdempotencyKey()
  ): Promise<TopUpData> {
    return this.client.send("POST", "/api/v1/top-ups", topUpDataSchema, {
      json: { quoteId },
      idempotencyKey,
    });
  }

  async simulateTopUp(topUpId: string): Promise<TopUpData> {
    return this.client.send(
      "POST",
      `/api/v1/top-ups/${topUpId}/simulate`,
      topUpDataSchema
    );
  }

  async getTopUpStatus(
    topUpId: string,
    options?: RequestOptions
  ): Promise<TopUpData> {
    return this.client.get(
      `/api/v1/top-ups/${topUpId}`,
      topUpDataSchema,
      options
    );
  }

  async listTopUps(
    limit?: number,
    options?: RequestOptions
  ): Promise<TopUpListItem[]> {
    const result = await this.client.get(
      "/api/v1/top-ups",
      topUpsListDataSchema,
      { ...options, query: { limit } }
    );
    return result.items;
  }

  async listPayouts(
    limit?: number,
    options?: RequestOptions
  ): Promise<PayoutListItem[]> {
    const result = await this.client.get(
      "/api/v1/payouts",
      payoutsListDataSchema,
      { ...options, query: { limit } }
    );
    return result.items;
  }

  async getTransactionHistory(
    limit = 30,
    options?: RequestOptions
  ): Promise<UserTransactionHistoryResult> {
    const [activitiesRes, topUpsRes, payoutsRes] = await Promise.allSettled([
      this.client
        .get("/api/v1/wallet/activities", walletActivitiesDataSchema, {
          ...options,
          query: { limit },
        })
        .then((data) => data.activities),
      this.listTopUps(limit, options),
      this.listPayouts(limit, options),
    ]);

    const activities =
      activitiesRes.status === "fulfilled" ? activitiesRes.value : [];
    const topUps = topUpsRes.status === "fulfilled" ? topUpsRes.value : [];
    const payouts = payoutsRes.status === "fulfilled" ? payoutsRes.value : [];

    const itemsMap = new Map<string, UserTransaction>();

    // 1. Process ledger activities
    for (const activity of activities) {
      const tx = transactionFromActivity(activity);
      tx.sourceApi = "ACTIVITIES";
      itemsMap.set(tx.id, tx);
    }

    // 2. Process top-ups from Top-ups API
    for (const topUp of topUps) {
      const topUpIdNorm = topUp.id.toLowerCase();
      const topUpRefNorm = topUp.internalReference
        ?.toLowerCase()
        .replace(/^top-up:/, "");

      const matched = Array.from(itemsMap.values()).find((tx) => {
        if (tx.id.toLowerCase() === topUpIdNorm) return true;
        if (
          topUp.creditedLedgerTransactionId &&
          (tx.id === topUp.creditedLedgerTransactionId ||
            tx.ledgerTransactionId === topUp.creditedLedgerTransactionId)
        ) {
          return true;
        }
        if (tx.reference) {
          const txRefNorm = tx.reference.toLowerCase().replace(/^top-up:/, "");
          if (txRefNorm === topUpIdNorm) return true;
          if (topUpRefNorm && txRefNorm === topUpRefNorm) return true;
        }
        if (
          tx.type === "TOP_UP" &&
          tx.amountSatang === topUp.creditSatang &&
          Math.abs(
            new Date(tx.createdAt).getTime() -
              new Date(topUp.createdAt).getTime()
          ) < 60000
        ) {
          return true;
        }
        return false;
      });

      if (matched) {
        matched.sourceApi = "TOP_UPS";
        matched.status = topUp.topUpStatus;
        if (topUp.internalReference) {
          matched.reference = topUp.internalReference;
        }
        if (topUp.qrExpiresAt) {
          matched.expiresAt = topUp.qrExpiresAt;
        }
      } else {
        const isPaid = topUp.topUpStatus === "PAID";
        itemsMap.set(topUp.id, {
          id: topUp.id,
          type: "TOP_UP",
          title: "PromptPay Top-Up",
          titleTh: "เติมเงินผ่านพร้อมเพย์",
          amountSatang: topUp.creditSatang,
          direction: "INFLOW",
          status: topUp.topUpStatus,
          createdAt: topUp.createdAt,
          reference: topUp.internalReference,
          sourceApi: "TOP_UPS",
          expiresAt: topUp.qrExpiresAt ?? undefined,
          spendingDeltaSatang: isPaid ? topUp.creditSatang : 0,
        });
      }
    }

    // 3. Process payouts from Payouts API
    for (const payout of payouts) {
      const payoutAmount = payout.principalSatang ?? payout.amountSatang ?? 0;
      const destinationInfo = payout.destinationMaskedLastFour
        ? `${payout.destinationBankCode ?? "ธนาคาร"} •• ${payout.destinationMaskedLastFour}`
        : payout.destination?.maskedAccount;

      const payoutIdNorm = payout.id.toLowerCase();
      const payoutRefNorm = payout.internalReference
        ?.toLowerCase()
        .replace(/^payout:/, "");

      const matched = Array.from(itemsMap.values()).find((tx) => {
        if (tx.id.toLowerCase() === payoutIdNorm) return true;
        if (
          payout.reserveLedgerTransactionId &&
          (tx.id === payout.reserveLedgerTransactionId ||
            tx.ledgerTransactionId === payout.reserveLedgerTransactionId)
        ) {
          return true;
        }
        if (
          payout.finalLedgerTransactionId &&
          (tx.id === payout.finalLedgerTransactionId ||
            tx.ledgerTransactionId === payout.finalLedgerTransactionId)
        ) {
          return true;
        }
        if (tx.reference) {
          const txRefNorm = tx.reference.toLowerCase().replace(/^payout:/, "");
          if (txRefNorm === payoutIdNorm) return true;
          if (payoutRefNorm && txRefNorm === payoutRefNorm) return true;
        }
        if (
          tx.type === "PAYOUT" &&
          tx.amountSatang === payoutAmount &&
          Math.abs(
            new Date(tx.createdAt).getTime() -
              new Date(payout.createdAt).getTime()
          ) < 60000
        ) {
          return true;
        }
        return false;
      });

      if (matched) {
        matched.sourceApi = "PAYOUTS";
        if (destinationInfo) matched.destinationInfo = destinationInfo;
        if (payout.payoutStatus || payout.status) {
          matched.status =
            payout.payoutStatus ?? payout.status ?? matched.status;
        }
        if (payout.internalReference) {
          matched.reference = payout.internalReference;
        }
      } else {
        itemsMap.set(payout.id, {
          id: payout.id,
          type: "PAYOUT",
          title: "Bank Payout",
          titleTh: "ถอนเงินเข้าบัญชีธนาคาร",
          amountSatang: payoutAmount,
          direction: "OUTFLOW",
          status: payout.payoutStatus ?? payout.status ?? "PENDING",
          createdAt: payout.createdAt,
          reference: payout.internalReference,
          sourceApi: "PAYOUTS",
          destinationInfo,
          payoutReservedDeltaSatang: -payoutAmount,
        });
      }
    }

    const items = Array.from(itemsMap.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const uniqueItems: UserTransaction[] = [];
    const seenKeys = new Set<string>();

    for (const item of items) {
      const refKey = item.reference
        ? `${item.type}:${item.reference.toLowerCase().replace(/^(top-up|payout):/, "")}`
        : null;
      const primaryKey = item.id.toLowerCase();

      if (seenKeys.has(primaryKey) || (refKey && seenKeys.has(refKey))) {
        continue;
      }

      seenKeys.add(primaryKey);
      if (refKey) seenKeys.add(refKey);
      if (item.ledgerTransactionId) {
        seenKeys.add(item.ledgerTransactionId.toLowerCase());
      }

      uniqueItems.push(item);
    }

    return { items: uniqueItems };
  }

  async getActivePayoutDestination(
    options?: RequestOptions
  ): Promise<PayoutDestination | null> {
    const destination = await this.client.get(
      "/api/v1/payout-destinations",
      activePayoutDestinationDataSchema,
      options
    );
    return destination ? normalizePayoutDestination(destination) : null;
  }

  async listPayoutDestinations(
    options?: RequestOptions
  ): Promise<PayoutDestination[]> {
    const destination = await this.getActivePayoutDestination(options);
    return destination ? [destination] : [];
  }

  async createPayoutDestination(
    payload: CreatePayoutDestinationPayload
  ): Promise<PayoutDestination> {
    const validatedPayload =
      createPayoutDestinationPayloadSchema.parse(payload);
    const names = (validatedPayload.accountHolderName ?? "")
      .trim()
      .split(/\s+/);
    const givenName = validatedPayload.givenName ?? names[0] ?? "Member";
    const surname =
      validatedPayload.surname ?? (names.slice(1).join(" ") || "Student");
    const routingType =
      validatedPayload.routingType ??
      (validatedPayload.type === "PROMPTPAY" ? "PROMPTPAY" : "BANK_ACCOUNT");
    const bankCode =
      validatedPayload.bankCode ??
      (routingType === "PROMPTPAY" ? "PROMPTPAY" : "KBANK");

    const bodyPayload: Record<string, unknown> = {
      accountHolderName: validatedPayload.accountHolderName,
      accountNumber: validatedPayload.accountNumber,
      bankCode,
      givenName,
      surname,
      routingType,
    };
    if (validatedPayload.type) {
      bodyPayload.type = validatedPayload.type;
    }
    if (validatedPayload.recipientType) {
      bodyPayload.recipientType = validatedPayload.recipientType;
    }
    if (validatedPayload.relationship) {
      bodyPayload.relationship = validatedPayload.relationship;
    }
    if (validatedPayload.accountCountry) {
      bodyPayload.accountCountry = validatedPayload.accountCountry;
    }
    if (validatedPayload.accountCurrency) {
      bodyPayload.accountCurrency = validatedPayload.accountCurrency;
    }

    const destination = await this.client.send(
      "POST",
      "/api/v1/payout-destinations",
      payoutDestinationDataSchema,
      { json: bodyPayload }
    );
    if (!destination) {
      throw new Error("Payout destination creation returned null data");
    }
    return normalizePayoutDestination(destination);
  }

  async deletePayoutDestination(
    id?: string
  ): Promise<{ id?: string; retired: boolean }> {
    const data = await this.client.send(
      "DELETE",
      "/api/v1/payout-destinations",
      deletePayoutDestinationDataSchema
    );
    return { id, retired: data?.retired ?? true };
  }

  async retireActivePayoutDestination(): Promise<boolean> {
    const res = await this.deletePayoutDestination();
    return res.retired;
  }

  async quotePayout(receiptSatang: number): Promise<PayoutQuote> {
    return this.client.send(
      "POST",
      "/api/v1/payouts/quotes",
      payoutQuoteSchema,
      { json: { receiptSatang } }
    );
  }

  async createPayout(
    quoteId: string,
    idempotencyKey = createIdempotencyKey()
  ): Promise<PayoutRecord> {
    const raw = await this.client.send(
      "POST",
      "/api/v1/payouts",
      payoutDataSchema,
      { json: { quoteId }, idempotencyKey }
    );
    return normalizePayout(raw);
  }

  async requestPayout(
    amountSatangOrQuoteId: number | string,
    destinationId?: string,
    idempotencyKey = createIdempotencyKey()
  ): Promise<PayoutRecord> {
    if (typeof amountSatangOrQuoteId === "string") {
      return this.createPayout(amountSatangOrQuoteId, idempotencyKey);
    }
    if (destinationId) {
      const payload = {
        amountSatang: amountSatangOrQuoteId,
        destinationId,
      };
      const raw = await this.client.send(
        "POST",
        "/api/v1/payouts",
        payoutDataSchema,
        { json: payload, idempotencyKey }
      );
      return normalizePayout(raw);
    }
    const quote = await this.quotePayout(amountSatangOrQuoteId);
    return this.createPayout(quote.id, idempotencyKey);
  }

  async getPayout(
    payoutId: string,
    options?: RequestOptions
  ): Promise<PayoutRecord> {
    const raw = await this.client.get(
      `/api/v1/payouts/${payoutId}`,
      payoutDataSchema,
      options
    );
    return normalizePayout(raw);
  }
  async listPayoutStatusHistory(
    payoutId: string,
    options?: RequestOptions
  ): Promise<PayoutStatusHistoryItem[]> {
    return this.client.get(
      `/api/v1/payouts/${payoutId}/status-history`,
      payoutStatusHistoryDataSchema,
      options
    );
  }
}

export const walletApi = new WalletApi();
