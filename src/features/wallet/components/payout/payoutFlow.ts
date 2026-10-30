import type { PayoutQuote } from "@/api/WalletApi";

export type PayoutReturnTo = "amount" | null;

/** Where the Payout sheet is. Each step carries only the data it owns. */
export type PayoutStep =
  | { kind: "amount" }
  | { kind: "review"; quote: PayoutQuote; idempotencyKey: string }
  | { kind: "done"; receiptSatang: number }
  | { kind: "destination"; returnTo: PayoutReturnTo }
  | { kind: "destinationForm"; returnTo: PayoutReturnTo };

export type PayoutAction =
  | { type: "quoted"; quote: PayoutQuote; idempotencyKey: string }
  | { type: "confirmed"; receiptSatang: number }
  | { type: "openDestination" }
  | { type: "addDestination" }
  | { type: "replaceDestination" }
  | { type: "destinationSaved" }
  | { type: "back" };

export const INITIAL_PAYOUT_STEP: PayoutStep = { kind: "amount" };

export function payoutStepReducer(
  step: PayoutStep,
  action: PayoutAction
): PayoutStep {
  switch (action.type) {
    case "quoted":
      return step.kind === "amount"
        ? {
            kind: "review",
            quote: action.quote,
            idempotencyKey: action.idempotencyKey,
          }
        : step;
    case "confirmed":
      return step.kind === "review"
        ? { kind: "done", receiptSatang: action.receiptSatang }
        : step;
    case "openDestination":
      return step.kind === "amount"
        ? { kind: "destination", returnTo: "amount" }
        : step;
    case "addDestination":
      if (step.kind === "amount") {
        return { kind: "destinationForm", returnTo: "amount" };
      }
      return step.kind === "destination"
        ? { kind: "destinationForm", returnTo: step.returnTo }
        : step;
    case "replaceDestination":
      return step.kind === "destination"
        ? { kind: "destinationForm", returnTo: step.returnTo }
        : step;
    case "destinationSaved":
      if (step.kind !== "destinationForm") return step;
      return step.returnTo === "amount"
        ? { kind: "amount" }
        : { kind: "destination", returnTo: null };
    case "back":
      switch (step.kind) {
        case "review":
          return { kind: "amount" };
        case "destination":
          return step.returnTo === "amount" ? { kind: "amount" } : step;
        case "destinationForm":
          return { kind: "destination", returnTo: step.returnTo };
        default:
          return step;
      }
  }
}

export function canGoBack(step: PayoutStep): boolean {
  switch (step.kind) {
    case "review":
    case "destinationForm":
      return true;
    case "destination":
      return step.returnTo !== null;
    default:
      return false;
  }
}
