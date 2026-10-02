# Mock payment provider contract and failure model

**Research issue:** [Choose the mock payment provider contract and failure model](https://github.com/KUQuest/KUQUest-Mobile/issues/39)

## Scope

Research for the Quest Funding → held balance → Actual Settlement/refund prototype. No destination payment code is implemented here.

## Recommendation

Use one injected, in-memory `MockPaymentProvider` with this minimum seam:

```ts
interface MockPaymentProvider {
  authorizeFunding(input): Promise<PaymentOperationResult>;
  settleFunding(input): Promise<PaymentOperationResult>;
  refundFunding(input): Promise<PaymentOperationResult>;
  getFunding(fundingId: string): Promise<PaymentFundingRecord | null>;
  reset(): void;
}
```

The provider owns only a Quest-scoped funding ledger, not Quest lifecycle state. Pass exact integer-satang amounts (`THB`) from the Quest domain: reward pool, platform fee, and total required. Enforce `total = reward pool + fee`, `0 <= actualHeadcount <= requestedHeadcount`, and—after finalization—`captured + refunded = held`. Keep fee/refund treatment explicit.

## Failure and retry model

- Success authorization returns `HELD`; only then may the Quest become `QUEST_OPEN`.
- A user/payment decline is terminal `DECLINED` with no hold; leave the Quest Draft and allow a deliberate new authorization attempt with a new idempotency key.
- A known pre-mutation provider failure is terminal `FAILED` with no hold.
- A timeout/lost response is `PENDING`/unknown, not a decline. Query `getFunding` or repeat with the same key; never issue a new key just because the client timed out.
- `SETTLED` captures the exact Actual Headcount amount and refunds unused held amount. `REFUNDED` releases the full policy-approved pre-start hold. Settlement/refund are mutually exclusive.
- The same idempotency key plus the same normalized request returns the original result. A changed request returns `IDEMPOTENCY_CONFLICT`. Matching settlement/refund retries must not duplicate money movement.
- Use a deterministic failure script and injectable clock; avoid real sleeps.

## Repository evidence

- `src/features/auth/types.ts` and `AuthService.ts` establish injected provider interfaces and closed error codes.
- `src/features/questBoard/questFixtureAdapter.ts` establishes discriminated results, current satang escrow/settlement shapes, pre-start full-refund outcomes, assignment removal, and read-only chat.
- `src/api/StudentApi.ts` and `profilePersistenceCoordinator.ts` show stable idempotency keys and retry-safe persistence.
- The provider should follow the adapter’s injected-clock and deterministic-reset conventions, remain in memory, and leave SecureStore drafts untouched.

## Decision boundary

This research chooses the provider seam, amount-input shape, operation atomicity, idempotency rules, and failure semantics. It does not choose the canonical app funding states, fee/tax policy, user-facing copy, or payment screens; those were decided in later Wayfinder tickets.
