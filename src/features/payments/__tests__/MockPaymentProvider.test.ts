import {
  createMockPaymentProvider,
  type AuthorizeFundingInput,
  type PaymentFundingRecord,
} from '../MockPaymentProvider';

const authorization: AuthorizeFundingInput = {
  fundingId: 'funding-1',
  questId: 'quest-1',
  hirerId: 'hirer-1',
  requestedHeadcount: 3,
  amounts: {
    currency: 'THB',
    rewardPoolSatang: 36000,
    platformFeeSatang: 1800,
    totalRequiredSatang: 37800,
  },
  idempotencyKey: 'quest:quest-1:authorize',
};

function expectRecord(result: { ok: boolean; value?: PaymentFundingRecord }): PaymentFundingRecord {
  if (!result.ok || !result.value) throw new Error('Expected a funding record');
  return result.value;
}

describe('MockPaymentProvider', () => {
  it('authorizes a hold with the exact amount breakdown', async () => {
    const provider = createMockPaymentProvider();

    const record = expectRecord(await provider.authorizeFunding(authorization));

    expect(record.status).toBe('HELD');
    expect(record.amounts).toEqual(authorization.amounts);
    expect(record.capturedSatang).toBe(0);
    expect(record.refundedSatang).toBe(0);
  });

  it('returns a decline without creating a hold and permits a deliberate retry', async () => {
    const provider = createMockPaymentProvider({ failureScript: ['DECLINED'] });

    const declined = await provider.authorizeFunding(authorization);
    const retry = await provider.authorizeFunding({ ...authorization, idempotencyKey: 'quest:quest-1:authorize:retry' });

    expect(expectRecord(declined).status).toBe('DECLINED');
    expect(expectRecord(retry).status).toBe('HELD');
    expect((await provider.getFunding(authorization.fundingId))?.status).toBe('HELD');
  });

  it('recovers a pending authorization on the same key without a second hold', async () => {
    const provider = createMockPaymentProvider({ failureScript: ['PENDING'] });

    const pending = expectRecord(await provider.authorizeFunding(authorization));
    expect((await provider.getFunding(authorization.fundingId))?.status).toBe('PENDING');
    const recovered = expectRecord(await provider.authorizeFunding(authorization));

    expect(pending.status).toBe('PENDING');
    expect(recovered.status).toBe('HELD');
    expect(recovered.fundingId).toBe(pending.fundingId);
  });

  it('is idempotent and rejects a changed payload on the same key', async () => {
    const provider = createMockPaymentProvider();

    const first = expectRecord(await provider.authorizeFunding(authorization));
    const duplicate = expectRecord(await provider.authorizeFunding(authorization));
    const conflict = await provider.authorizeFunding({ ...authorization, amounts: { ...authorization.amounts, rewardPoolSatang: 37200, totalRequiredSatang: 39000 } });

    expect(duplicate).toEqual(first);
    expect(conflict).toMatchObject({ ok: false, error: { code: 'IDEMPOTENCY_CONFLICT' } });
  });

  it('settles by Actual Headcount and refunds unused places atomically', async () => {
    const provider = createMockPaymentProvider();
    await provider.authorizeFunding(authorization);

    const result = expectRecord(await provider.settleFunding({
      fundingId: authorization.fundingId,
      actualHeadcount: 2,
      capturedSatang: 25200,
      refundedSatang: 12600,
      idempotencyKey: 'quest:quest-1:settle:2',
    }));

    expect(result.status).toBe('SETTLED');
    expect(result.actualHeadcount).toBe(2);
    expect(result.capturedSatang + result.refundedSatang).toBe(37800);
  });

  it('rejects a second authorization while a funding hold already exists', async () => {
    const provider = createMockPaymentProvider();
    await provider.authorizeFunding(authorization);

    const result = await provider.authorizeFunding({ ...authorization, idempotencyKey: 'quest:quest-1:authorize:second' });

    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_STATE' } });
  });

  it('rejects fractional settlement amounts', async () => {
    const provider = createMockPaymentProvider();
    await provider.authorizeFunding(authorization);

    const result = await provider.settleFunding({ fundingId: authorization.fundingId, actualHeadcount: 2, capturedSatang: 25200.5, refundedSatang: 12599.5, idempotencyKey: 'settle-fractional' });

    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });


  it('checks idempotency conflicts before validating changed payloads', async () => {
    const settledProvider = createMockPaymentProvider();
    await settledProvider.authorizeFunding(authorization);
    await settledProvider.settleFunding({ fundingId: authorization.fundingId, actualHeadcount: 3, capturedSatang: 37800, refundedSatang: 0, idempotencyKey: 'settle-same-key' });
    const settlementConflict = await settledProvider.settleFunding({ fundingId: authorization.fundingId, actualHeadcount: 3, capturedSatang: 37800.5, refundedSatang: -0.5, idempotencyKey: 'settle-same-key' });

    const refundedProvider = createMockPaymentProvider();
    await refundedProvider.authorizeFunding(authorization);
    await refundedProvider.refundFunding({ fundingId: authorization.fundingId, refundedSatang: 37800, idempotencyKey: 'refund-same-key' });
    const refundConflict = await refundedProvider.refundFunding({ fundingId: authorization.fundingId, refundedSatang: -1, idempotencyKey: 'refund-same-key' });

    expect(settlementConflict).toMatchObject({ ok: false, error: { code: 'IDEMPOTENCY_CONFLICT' } });
    expect(refundConflict).toMatchObject({ ok: false, error: { code: 'IDEMPOTENCY_CONFLICT' } });
  });


  it('returns known failures without creating a hold', async () => {
    const provider = createMockPaymentProvider({ failureScript: ['FAILED'] });

    const result = expectRecord(await provider.authorizeFunding(authorization));

    expect(result.status).toBe('FAILED');
    expect(result.retryable).toBe(true);
    expect(await provider.getFunding(authorization.fundingId)).toBeNull();
  });


  it('returns identical results for settlement and refund retries', async () => {
    const settledProvider = createMockPaymentProvider();
    await settledProvider.authorizeFunding(authorization);
    const settlementInput = { fundingId: authorization.fundingId, actualHeadcount: 3, capturedSatang: 37800, refundedSatang: 0, idempotencyKey: 'settle-retry' };
    const firstSettlement = await settledProvider.settleFunding(settlementInput);
    const duplicateSettlement = await settledProvider.settleFunding({ ...settlementInput, actualHeadcount: 3 });

    const refundedProvider = createMockPaymentProvider();
    await refundedProvider.authorizeFunding(authorization);
    const refundInput = { fundingId: authorization.fundingId, refundedSatang: 37800, idempotencyKey: 'refund-retry' };
    const firstRefund = await refundedProvider.refundFunding(refundInput);
    const duplicateRefund = await refundedProvider.refundFunding({ ...refundInput });

    expect(duplicateSettlement).toEqual(firstSettlement);
    expect(duplicateRefund).toEqual(firstRefund);
  });

  it('treats reordered object keys as the same authorization request', async () => {
    const provider = createMockPaymentProvider();
    const reordered = {
      ...authorization,
      amounts: {
        totalRequiredSatang: 37800,
        platformFeeSatang: 1800,
        rewardPoolSatang: 36000,
        currency: 'THB' as const,
      },
    };

    const first = await provider.authorizeFunding(authorization);
    const duplicate = await provider.authorizeFunding(reordered);

    expect(duplicate).toEqual(first);
  });

  it('rejects refund after settlement', async () => {
    const provider = createMockPaymentProvider();
    await provider.authorizeFunding(authorization);
    await provider.settleFunding({ fundingId: authorization.fundingId, actualHeadcount: 3, capturedSatang: 37800, refundedSatang: 0, idempotencyKey: 'settle-before-refund' });

    const result = await provider.refundFunding({ fundingId: authorization.fundingId, refundedSatang: 37800, idempotencyKey: 'refund-after-settlement' });

    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_STATE' } });
  });

  it('rejects conflicting terminal operations and restores its failure script on reset', async () => {
    const provider = createMockPaymentProvider({ failureScript: ['DECLINED'] });
    expect(expectRecord(await provider.authorizeFunding(authorization)).status).toBe('DECLINED');
    provider.reset();
    expect(expectRecord(await provider.authorizeFunding(authorization)).status).toBe('DECLINED');

    const funded = createMockPaymentProvider();
    await funded.authorizeFunding(authorization);
    await funded.refundFunding({ fundingId: authorization.fundingId, refundedSatang: 37800, idempotencyKey: 'refund-1' });
    const conflict = await funded.settleFunding({ fundingId: authorization.fundingId, actualHeadcount: 3, capturedSatang: 37800, refundedSatang: 0, idempotencyKey: 'settle-1' });

    expect(conflict).toMatchObject({ ok: false, error: { code: 'INVALID_STATE' } });
  });

  it('fully refunds a pre-start cancellation and reset clears provider state', async () => {
    const provider = createMockPaymentProvider();
    await provider.authorizeFunding(authorization);

    const refunded = expectRecord(await provider.refundFunding({
      fundingId: authorization.fundingId,
      refundedSatang: 37800,
      idempotencyKey: 'quest:quest-1:refund:cancelled',
    }));

    expect(refunded.status).toBe('REFUNDED');
    expect(refunded.refundedSatang).toBe(37800);
    provider.reset();
    expect(await provider.getFunding(authorization.fundingId)).toBeNull();
  });
});
