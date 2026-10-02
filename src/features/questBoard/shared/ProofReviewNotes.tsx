import { useLocale } from "@/features/preferences/localeStore";
import { questBoardMessages } from "@/locales/questBoardMessages";
import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import { Text, View } from "@/tw";

import { useServerCountdown } from "./useServerCountdown";

/**
 * Server-owned Proof facts for both Hirer and Worker: the auto-approve
 * deadline while pending, who approved, and the Hirer's reason when not
 * approved. Renders nothing when the Server sent none of them.
 */
export function ProofReviewNotes({
  proof,
  testIDPrefix,
}: {
  proof: QuestV2ProofSubmission | null;
  testIDPrefix: string;
}) {
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const remaining = useServerCountdown(proof?.reviewDeadlineAt);
  if (!proof) return null;

  const totalMinutes = remaining ? Math.floor(remaining / 60_000) : 0;
  const lines: { key: string; label: string; text?: string }[] = [];
  if (remaining) {
    lines.push({
      key: "deadline",
      label: messages.proofAutoApprovesIn(
        Math.floor(totalMinutes / 60),
        totalMinutes % 60
      ),
    });
  }
  if (proof.reviewedBy === "AUTO_APPROVE") {
    lines.push({ key: "auto", label: messages.proofAutoApprovedNote });
  }
  if (proof.reviewReason) {
    lines.push({
      key: "reason",
      label: messages.proofNotApprovedReason,
      text: proof.reviewReason,
    });
  }
  if (lines.length === 0) return null;

  return (
    <View className="gap-ku-xs" testID={`${testIDPrefix}-notes`}>
      {lines.map((line) => (
        <Text
          key={line.key}
          testID={`${testIDPrefix}-${line.key}`}
          className="font-ku-regular text-ku-body-small text-ku-text-secondary"
        >
          {line.text ? `${line.label}: ${line.text}` : line.label}
        </Text>
      ))}
    </View>
  );
}
