import { formatSatang } from "@/domain/satang";
import { useLocale } from "@/features/preferences/localeStore";
import { disputeMessages } from "@/locales/disputeMessages";
import { Text } from "@/tw";

import { useMyDisputeCaseQuery } from "../api/questBoardQueries";

/**
 * Who won the viewer's own decided Dispute Case. Only the filer can read the
 * resolution (`getMyQuestDisputeCase`); the Quest snapshot names the status
 * but not the paid Worker or amount.
 */
export function DisputeOutcome({
  questId,
  viewerId,
  status,
}: {
  questId: string;
  viewerId: string | null;
  status: string;
}) {
  const { locale } = useLocale();
  const messages = disputeMessages[locale];
  const decided = status === "DISPUTE_CASE_RESOLVED";
  const query = useMyDisputeCaseQuery(questId, viewerId, decided);

  let text: string | null = null;
  if (status === "DISPUTE_CASE_DISMISSED") {
    text = messages.outcomeDismissed;
  } else if (decided) {
    const resolved = query.data?.case;
    const amount = resolved?.resolvedAmountSatang;
    if (resolved && amount != null) {
      const formatted = formatSatang(amount, locale, "exact");
      text =
        resolved.resolvedWorkerId === viewerId
          ? messages.outcomeYouWon(formatted)
          : messages.outcomeOtherWorkerPaid(formatted);
    }
  }
  if (!text) return null;

  return (
    <Text
      accessibilityRole="text"
      className="font-ku-semibold text-ku-body-small text-ku-text-strong"
      testID="dispute-outcome"
    >
      {text}
    </Text>
  );
}
