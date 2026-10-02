import { formatTimestamp } from "@/domain/datetime";
import { useLocale } from "@/features/preferences/localeStore";
import { disputeMessages } from "@/locales/disputeMessages";
import { Text, View } from "@/tw";

import type { LiveQuestSnapshot } from "../live/liveQuestTypes";
import { useServerCountdown } from "./useServerCountdown";

/**
 * Server-owned facts after a Quest fails: the Dispute window and the money
 * hold. Renders nothing unless the Server sent `dispute` or `moneyHold`.
 */
export function FailedQuestNotice({
  quest,
}: {
  quest: LiveQuestSnapshot["quest"];
}) {
  const { locale } = useLocale();
  const messages = disputeMessages[locale];
  const dispute = "dispute" in quest ? quest.dispute : null;
  const moneyHold = "moneyHold" in quest ? quest.moneyHold : null;
  const remaining = useServerCountdown(dispute?.windowEndsAt);
  if (!dispute && !moneyHold) return null;

  const minutes = remaining ? Math.floor(remaining / 60_000) : 0;
  const lines: { key: string; text: string }[] = [];
  if (dispute && !dispute.myCase) {
    lines.push(
      remaining
        ? {
            key: "window",
            text: messages.windowEndsIn(Math.floor(minutes / 60), minutes % 60),
          }
        : { key: "closed", text: messages.windowClosed }
    );
  }
  if (moneyHold) {
    if (moneyHold?.status === "RELEASED") {
      lines.push({ key: "hold", text: messages.moneyReleased });
    } else if (moneyHold?.releasesAt) {
      lines.push({
        key: "hold",
        text: messages.moneyHeldUntil(
          formatTimestamp(moneyHold.releasesAt, locale, "")
        ),
      });
    }
  }

  return (
    <View className="gap-ku-xs" testID="failed-quest-notice">
      {lines.map((line) => (
        <Text
          key={line.key}
          testID={`failed-quest-${line.key}`}
          className="font-ku-regular text-ku-body-small text-ku-text-secondary"
        >
          {line.text}
        </Text>
      ))}
    </View>
  );
}
