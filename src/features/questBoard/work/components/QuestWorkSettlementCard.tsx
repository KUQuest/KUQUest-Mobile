import { Text, View } from "@/tw";
import { formatSatang } from "@/domain/satang";
import { isTerminalStatus } from "@/domain/questLifecycle";
import { useLocale } from "@/features/preferences/localeStore";
import { questWorkMessages } from "@/locales/questWorkMessages";
import type { LiveQuestSnapshot } from "../../live/liveQuestTypes";

export default function QuestWorkSettlementCard({
  snapshot,
}: {
  snapshot: LiveQuestSnapshot;
}) {
  const { locale } = useLocale();
  const messages = questWorkMessages[locale];
  if (
    !snapshot.assignment ||
    (snapshot.assignment.state === "ASSIGNMENT_ACTIVE" &&
      !isTerminalStatus(snapshot.state))
  )
    return null;
  const settlement =
    "workerSettlement" in snapshot.quest
      ? snapshot.quest.workerSettlement
      : null;
  const status =
    settlement?.status === "PAID"
      ? messages.settlementPaid
      : settlement?.status === "PENDING"
        ? messages.settlementPending
        : settlement?.status === "NO_PAYMENT"
          ? messages.settlementNone
          : messages.settlementUnavailable;
  return (
    <View
      className="gap-ku-sm rounded-ku-card border border-ku-border bg-ku-surface p-ku-md"
      testID="work-settlement"
    >
      <Text
        accessibilityRole="header"
        className="font-ku-bold text-ku-title-small text-ku-text-strong"
      >
        {messages.settlementTitle}
      </Text>
      <Text className="font-ku-regular text-ku-body-small text-ku-text-secondary">
        {status}
      </Text>
      {settlement && settlement.amountSatang !== null ? (
        <View className="gap-ku-xs">
          <Text className="font-ku-medium text-ku-label text-ku-text-secondary">
            {messages.settlementAmount}
          </Text>
          <Text
            className="font-ku-bold text-ku-title text-ku-primary-dark"
            testID="work-settlement-amount"
          >
            {formatSatang(settlement.amountSatang, locale, "exact")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
