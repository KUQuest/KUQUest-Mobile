export type PaymentOperationStatus = 'PENDING' | 'HELD' | 'DECLINED' | 'FAILED' | 'SETTLED' | 'REFUNDED';
export type PaymentOperationKind = 'AUTHORIZE' | 'SETTLE' | 'REFUND';
export type PaymentFailure = 'SUCCESS' | 'DECLINED' | 'FAILED' | 'PENDING';

export type PaymentAmounts = {
  currency: 'THB';
  rewardPoolSatang: number;
  platformFeeSatang: number;
  totalRequiredSatang: number;
};

export type PaymentFundingRecord = {
  fundingId: string;
  questId: string;
  hirerId: string;
  requestedHeadcount: number;
  amounts: PaymentAmounts;
  status: PaymentOperationStatus;
  actualHeadcount: number;
  capturedSatang: number;
  refundedSatang: number;
  lastOperation?: { id: string; kind: PaymentOperationKind; idempotencyKey: string };
  retryable?: boolean;
};

export type AuthorizeFundingInput = {
  fundingId: string;
  questId: string;
  hirerId: string;
  requestedHeadcount: number;
  amounts: PaymentAmounts;
  idempotencyKey: string;
};

export type SettleFundingInput = {
  fundingId: string;
  actualHeadcount: number;
  capturedSatang: number;
  refundedSatang: number;
  idempotencyKey: string;
};

export type RefundFundingInput = {
  fundingId: string;
  refundedSatang: number;
  idempotencyKey: string;
};

export type PaymentErrorCode =
  | 'INVALID_REQUEST'
  | 'FUNDING_NOT_FOUND'
  | 'INVALID_STATE'
  | 'IDEMPOTENCY_CONFLICT';

export type PaymentError = { code: PaymentErrorCode; message: string; retryable: boolean };
export type PaymentOperationResult =
  | { ok: true; value: PaymentFundingRecord }
  | { ok: false; error: PaymentError };

export type MockPaymentProviderOptions = {
  failureScript?: PaymentFailure[];
  now?: () => Date;
};

export type MockPaymentProvider = {
  authorizeFunding(input: AuthorizeFundingInput): Promise<PaymentOperationResult>;
  settleFunding(input: SettleFundingInput): Promise<PaymentOperationResult>;
  refundFunding(input: RefundFundingInput): Promise<PaymentOperationResult>;
  getFunding(fundingId: string): Promise<PaymentFundingRecord | null>;
  reset(): void;
};

type Operation = { fingerprint: string; result: PaymentOperationResult };

const error = (code: PaymentErrorCode, message: string, retryable = false): PaymentOperationResult => ({
  ok: false,
  error: { code, message, retryable },
});

const cloneRecord = (record: PaymentFundingRecord): PaymentFundingRecord => ({
  ...record,
  amounts: { ...record.amounts },
  lastOperation: record.lastOperation ? { ...record.lastOperation } : undefined,
});

const cloneResult = (result: PaymentOperationResult): PaymentOperationResult =>
  result.ok ? { ok: true, value: cloneRecord(result.value) } : { ok: false, error: { ...result.error } };

const fingerprint = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(fingerprint).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${fingerprint(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

function validAmounts(amounts: PaymentAmounts): boolean {
  return amounts.currency === 'THB'
    && Number.isInteger(amounts.rewardPoolSatang)
    && Number.isInteger(amounts.platformFeeSatang)
    && Number.isInteger(amounts.totalRequiredSatang)
    && amounts.rewardPoolSatang >= 0
    && amounts.platformFeeSatang >= 0
    && amounts.totalRequiredSatang === amounts.rewardPoolSatang + amounts.platformFeeSatang;
}

class InMemoryMockPaymentProvider implements MockPaymentProvider {
  private readonly initialFailureScript: PaymentFailure[];
  private readonly failureScript: PaymentFailure[];
  private readonly now: () => Date;
  private readonly operations = new Map<string, Operation>();
  private readonly records = new Map<string, PaymentFundingRecord>();
  private operationNumber = 0;

  constructor(options: MockPaymentProviderOptions = {}) {
    this.initialFailureScript = [...(options.failureScript ?? [])];
    this.failureScript = [...this.initialFailureScript];
    this.now = options.now ?? (() => new Date());
  }

  async authorizeFunding(input: AuthorizeFundingInput): Promise<PaymentOperationResult> {
    if (!input.idempotencyKey) return error('INVALID_REQUEST', 'Authorization request is invalid.');
    const requestFingerprint = fingerprint({ ...input, idempotencyKey: undefined });
    const previous = this.operations.get(input.idempotencyKey);
    if (previous) {
      if (previous.fingerprint !== requestFingerprint) return error('IDEMPOTENCY_CONFLICT', 'The idempotency key was reused with a different request.');
      if (previous.result.ok && previous.result.value.status === 'PENDING') {
        const recovered = this.withOperation({ ...previous.result.value, status: 'HELD' }, 'AUTHORIZE', input.idempotencyKey);
        this.records.set(input.fundingId, recovered);
        previous.result = { ok: true, value: recovered };
      }
      return cloneResult(previous.result);
    }

    if (!input.fundingId || !input.questId || !input.hirerId || !Number.isInteger(input.requestedHeadcount) || input.requestedHeadcount < 1 || !validAmounts(input.amounts)) return error('INVALID_REQUEST', 'Authorization request is invalid.');
    const existingFunding = this.records.get(input.fundingId);
    if (existingFunding) return error('INVALID_STATE', 'Funding already has a live or terminal hold.');

    const outcome = this.failureScript.shift() ?? 'SUCCESS';
    const status: PaymentOperationStatus = outcome === 'SUCCESS' ? 'HELD' : outcome;
    const record = this.withOperation({
      fundingId: input.fundingId,
      questId: input.questId,
      hirerId: input.hirerId,
      requestedHeadcount: input.requestedHeadcount,
      amounts: { ...input.amounts },
      status,
      retryable: status === 'FAILED',
      actualHeadcount: 0,
      capturedSatang: 0,
      refundedSatang: 0,
    }, 'AUTHORIZE', input.idempotencyKey);
    const result: PaymentOperationResult = { ok: true, value: record };
    this.operations.set(input.idempotencyKey, { fingerprint: requestFingerprint, result });
    if (status === 'HELD' || status === 'PENDING') this.records.set(input.fundingId, record);
    return cloneResult(result);
  }

  async settleFunding(input: SettleFundingInput): Promise<PaymentOperationResult> {
    if (!input.idempotencyKey) return error('INVALID_REQUEST', 'Settlement request is invalid.');
    const requestFingerprint = fingerprint({ ...input, idempotencyKey: undefined });
    const previous = this.operations.get(input.idempotencyKey);
    if (previous) return previous.fingerprint === requestFingerprint ? cloneResult(previous.result) : error('IDEMPOTENCY_CONFLICT', 'The idempotency key was reused with a different request.');
    if (!input.fundingId || !Number.isInteger(input.actualHeadcount) || !Number.isInteger(input.capturedSatang) || !Number.isInteger(input.refundedSatang) || input.actualHeadcount < 0 || input.capturedSatang < 0 || input.refundedSatang < 0) return error('INVALID_REQUEST', 'Settlement request is invalid.');

    const record = this.records.get(input.fundingId);
    if (!record) return error('FUNDING_NOT_FOUND', 'Funding record was not found.');
    if (record.status !== 'HELD') return error('INVALID_STATE', 'Only held funding can be settled.');
    if (input.actualHeadcount > record.requestedHeadcount || input.capturedSatang + input.refundedSatang !== record.amounts.totalRequiredSatang) {
      return error('INVALID_REQUEST', 'Settlement amounts or Actual Headcount are invalid.');
    }

    const settled = this.withOperation({ ...record, status: 'SETTLED', actualHeadcount: input.actualHeadcount, capturedSatang: input.capturedSatang, refundedSatang: input.refundedSatang }, 'SETTLE', input.idempotencyKey);
    const result: PaymentOperationResult = { ok: true, value: settled };
    this.operations.set(input.idempotencyKey, { fingerprint: requestFingerprint, result });
    this.records.set(input.fundingId, settled);
    return cloneResult(result);
  }

  async refundFunding(input: RefundFundingInput): Promise<PaymentOperationResult> {
    if (!input.idempotencyKey) return error('INVALID_REQUEST', 'Refund request is invalid.');
    const requestFingerprint = fingerprint({ ...input, idempotencyKey: undefined });
    const previous = this.operations.get(input.idempotencyKey);
    if (previous) return previous.fingerprint === requestFingerprint ? cloneResult(previous.result) : error('IDEMPOTENCY_CONFLICT', 'The idempotency key was reused with a different request.');
    if (!input.fundingId || !Number.isInteger(input.refundedSatang) || input.refundedSatang < 0) return error('INVALID_REQUEST', 'Refund request is invalid.');

    const record = this.records.get(input.fundingId);
    if (!record) return error('FUNDING_NOT_FOUND', 'Funding record was not found.');
    if (record.status !== 'HELD') return error('INVALID_STATE', 'Only held funding can be refunded.');
    if (input.refundedSatang !== record.amounts.totalRequiredSatang) return error('INVALID_REQUEST', 'Pre-start refund must return the full held amount.');

    const refunded = this.withOperation({ ...record, status: 'REFUNDED', actualHeadcount: 0, refundedSatang: input.refundedSatang }, 'REFUND', input.idempotencyKey);
    const result: PaymentOperationResult = { ok: true, value: refunded };
    this.operations.set(input.idempotencyKey, { fingerprint: requestFingerprint, result });
    this.records.set(input.fundingId, refunded);
    return cloneResult(result);
  }

  async getFunding(fundingId: string): Promise<PaymentFundingRecord | null> {
    const record = this.records.get(fundingId);
    return record ? cloneRecord(record) : null;
  }

  reset(): void {
    this.operations.clear();
    this.records.clear();
    this.failureScript.splice(0, this.failureScript.length, ...this.initialFailureScript);
    this.operationNumber = 0;
  }

  private withOperation(record: PaymentFundingRecord, kind: PaymentOperationKind, idempotencyKey: string): PaymentFundingRecord {
    const timestamp = this.now().getTime();
    this.operationNumber += 1;
    return { ...record, lastOperation: { id: `${kind.toLowerCase()}-${timestamp}-${this.operationNumber}`, kind, idempotencyKey } };
  }
}

export function createMockPaymentProvider(options: MockPaymentProviderOptions = {}): MockPaymentProvider {
  return new InMemoryMockPaymentProvider(options);
}
