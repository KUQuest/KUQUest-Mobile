import { AccessibilityInfo, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text, View } from "@/tw";
import { getActionBarPaddingBottom } from "@/theme/layout";
import { cn } from "@/tw/cn";
import { X } from "lucide-react-native";
import { formatSatang } from "@/domain/satang";
import { colors } from "@/theme/colors";
import type { QuestBoardMessages } from "@/locales/questBoardMessages";
import { getQuestRewardSatang } from "../../presentation/questBoardViewData";
import type { QuestBoardQuest } from "../../domain/types";
import styles from "../../styles/questDetailStyles";
import { formatDate } from "@/domain/datetime";
import {
  CandidateReviewSheet,
  type CandidateReviewSheetProps,
} from "../../teamAssemble/components/CandidateReviewSheet";
import {
  PartialGroupStartConsentSheet,
  type PartialGroupStartConsentSheetProps,
} from "../../teamAssemble/components/PartialGroupStartConsentSheet";

type ConfirmationSheetProps = {
  locale: "en" | "th";
  messages: QuestBoardMessages;
  quest: QuestBoardQuest;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
};

function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

function ConfirmationSheet({
  locale,
  messages,
  quest,
  onCancel,
  onConfirm,
  busy = false,
}: ConfirmationSheetProps) {
  const insets = useSafeAreaInsets();
  const firstCome = quest.candidateMode === "NO_CANDIDATE";
  const title = firstCome
    ? messages.confirmParticipationTitle
    : messages.confirmApplicationTitle;
  const description = firstCome
    ? messages.confirmParticipationDescription
    : messages.confirmApplicationDescription;
  const confirmLabel = firstCome
    ? messages.confirmParticipation
    : messages.confirmApplication;

  return (
    <Modal
      animationType="slide"
      onDismiss={() => announce(messages.details)}
      onRequestClose={onCancel}
      onShow={() => announce(title)}
      transparent
      visible
    >
      <Pressable onPress={onCancel} className={styles.modalBackdrop}>
        <Pressable
          accessibilityViewIsModal
          onPress={() => undefined}
          className={styles.confirmSheet}
          style={{
            paddingBottom: getActionBarPaddingBottom(insets.bottom),
          }}
        >
          <View className={styles.confirmHeader}>
            <Text accessibilityRole="header" className={styles.confirmTitle}>
              {title}
            </Text>
            <Pressable
              accessibilityLabel={messages.notYet}
              accessibilityRole="button"
              onPress={onCancel}
              className={styles.sheetCloseButton}
            >
              <X color={colors.textStrong} size={24} />
            </Pressable>
          </View>
          <Text className={styles.confirmDescription}>{description}</Text>
          <View className={styles.confirmSummary}>
            <Text className={styles.confirmSummaryText}>{quest.title}</Text>
            <Text
              className={styles.confirmSummaryText}
            >{`${formatSatang(getQuestRewardSatang(quest), locale)} ${messages.perPerson}`}</Text>
            <Text
              className={styles.confirmSummaryText}
            >{`${messages.schedule}: ${formatDate(quest.startDate, locale, "")}${quest.timeRange ? ` · ${quest.timeRange}` : ""}`}</Text>
            <Text
              className={styles.confirmSummaryText}
            >{`${messages.deadline}: ${formatDate(quest.deadline, locale, "")}`}</Text>
            <Text
              className={styles.confirmSummaryText}
            >{`${messages.location}: ${quest.location}`}</Text>
          </View>
          <View className={styles.confirmActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              className={styles.cancelAction}
            >
              <Text className={styles.cancelActionText}>{messages.notYet}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onConfirm}
              className={cn(
                styles.confirmAction,
                busy && styles.primaryActionDisabled
              )}
              testID="confirm-quest-application"
            >
              <Text className={styles.confirmActionText}>
                {busy ? messages.loading : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export interface QuestDetailSheetsProps {
  prototypeCandidateSheet?: CandidateReviewSheetProps;
  liveCandidateSheet?: CandidateReviewSheetProps;
  prototypeConsentSheet?: PartialGroupStartConsentSheetProps;
  liveConsentSheet?: PartialGroupStartConsentSheetProps;
  confirmationSheet?: ConfirmationSheetProps;
}

export function QuestDetailSheets({
  prototypeCandidateSheet,
  liveCandidateSheet,
  prototypeConsentSheet,
  liveConsentSheet,
  confirmationSheet,
}: QuestDetailSheetsProps) {
  return (
    <>
      {prototypeCandidateSheet ? (
        <CandidateReviewSheet {...prototypeCandidateSheet} />
      ) : null}
      {liveCandidateSheet ? (
        <CandidateReviewSheet {...liveCandidateSheet} />
      ) : null}
      {prototypeConsentSheet ? (
        <PartialGroupStartConsentSheet {...prototypeConsentSheet} />
      ) : null}
      {liveConsentSheet ? (
        <PartialGroupStartConsentSheet {...liveConsentSheet} />
      ) : null}
      {confirmationSheet ? <ConfirmationSheet {...confirmationSheet} /> : null}
    </>
  );
}
