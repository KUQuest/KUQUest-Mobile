import type { PayoutQuote } from "@/api/WalletApi";
import {
  INITIAL_PAYOUT_STEP,
  canGoBack,
  payoutStepReducer,
  type PayoutStep,
} from "../payoutFlow";

const quote = { id: "quote-1", receiptSatang: 10_000 } as PayoutQuote;

describe("payoutStepReducer", () => {
  it("walks amount to review to done", () => {
    const review = payoutStepReducer(INITIAL_PAYOUT_STEP, {
      type: "quoted",
      quote,
      idempotencyKey: "key-1",
    });
    expect(review).toEqual({ kind: "review", quote, idempotencyKey: "key-1" });
    expect(
      payoutStepReducer(review, { type: "confirmed", receiptSatang: 10_000 })
    ).toEqual({ kind: "done", receiptSatang: 10_000 });
  });

  it("drops the quote and key when going back from review", () => {
    const review: PayoutStep = {
      kind: "review",
      quote,
      idempotencyKey: "key-1",
    };
    expect(payoutStepReducer(review, { type: "back" })).toEqual({
      kind: "amount",
    });
  });

  it("returns to the amount step after a destination started there is saved", () => {
    let step = payoutStepReducer(INITIAL_PAYOUT_STEP, {
      type: "addDestination",
    });
    expect(step).toEqual({ kind: "destinationForm", returnTo: "amount" });
    step = payoutStepReducer(step, { type: "destinationSaved" });
    expect(step).toEqual({ kind: "amount" });
  });

  it("keeps returnTo through replace and steps form back to destination", () => {
    let step = payoutStepReducer(INITIAL_PAYOUT_STEP, {
      type: "openDestination",
    });
    step = payoutStepReducer(step, { type: "replaceDestination" });
    expect(step).toEqual({ kind: "destinationForm", returnTo: "amount" });
    step = payoutStepReducer(step, { type: "back" });
    expect(step).toEqual({ kind: "destination", returnTo: "amount" });
    expect(payoutStepReducer(step, { type: "back" })).toEqual({
      kind: "amount",
    });
  });

  it("lands on the destination step when the form had no previous step", () => {
    expect(
      payoutStepReducer(
        { kind: "destinationForm", returnTo: null },
        { type: "destinationSaved" }
      )
    ).toEqual({ kind: "destination", returnTo: null });
  });

  it("ignores actions that do not apply to the current step", () => {
    expect(
      payoutStepReducer(INITIAL_PAYOUT_STEP, {
        type: "confirmed",
        receiptSatang: 1,
      })
    ).toBe(INITIAL_PAYOUT_STEP);
  });

  it("offers back only where a previous step exists", () => {
    expect(canGoBack({ kind: "amount" })).toBe(false);
    expect(canGoBack({ kind: "done", receiptSatang: 1 })).toBe(false);
    expect(canGoBack({ kind: "destination", returnTo: null })).toBe(false);
    expect(canGoBack({ kind: "destination", returnTo: "amount" })).toBe(true);
    expect(canGoBack({ kind: "destinationForm", returnTo: null })).toBe(true);
  });
});
