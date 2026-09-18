import React from "react";
import { ArrowLeft, Check, CircleHelp } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { colors } from "@/theme/colors";
import styles from "../createQuestStyles";
import type { Step } from "../createQuestTypes";

export function CreateQuestHeader({
  messages,
  step,
  onBackPress,
  onHelpPress,
  onStepPress,
  title,
  subtitle,
}: {
  messages: typeof createQuestMessages.en;
  step: Step;
  onBackPress: () => void;
  onHelpPress: () => void;
  onStepPress: (step: Step) => void;
  title?: string;
  subtitle?: string;
}) {
  const stepLabels = [
    messages.missionInfo,
    messages.teamSetup,
    messages.review,
  ];

  return (
    <View className={styles.hero}>
      <View className={styles.heroTop}>
        <Pressable
          accessibilityLabel={messages.back}
          accessibilityRole="button"
          className={styles.heroButton}
          onPress={onBackPress}
          style={{ borderColor: "rgba(255,255,255,0.42)" }}
          testID="create-quest-header-back"
        >
          <ArrowLeft color={colors.white} size={28} strokeWidth={2.4} />
        </Pressable>
        <View className={styles.heroTitleGroup}>
          <Text accessibilityRole="header" className={styles.heroTitle}>
            {title ?? messages.title}
          </Text>
          <Text className={styles.heroSubtitle}>
            {subtitle ?? messages.headerSubtitle}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={messages.helpLabel}
          accessibilityRole="button"
          className={styles.heroButton}
          onPress={onHelpPress}
          style={{ borderColor: "rgba(255,255,255,0.42)" }}
          testID="create-quest-help"
        >
          <CircleHelp color={colors.white} size={30} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: 3, now: step }}
        className={styles.progressTrack}
      >
        {[1, 2, 3].map((item, index) => (
          <React.Fragment key={item}>
            <Pressable
              accessibilityLabel={`${messages.step(item, 3)}: ${stepLabels[index]}`}
              accessibilityRole="button"
              accessibilityState={{
                disabled: item > step,
                selected: item === step,
              }}
              className={styles.progressNodePressable}
              disabled={item > step}
              onPress={() => onStepPress(item as Step)}
            >
              <View
                className={styles.progressNode}
                style={{
                  backgroundColor:
                    item <= step
                      ? colors.successBright
                      : "rgba(255,255,255,0.34)",
                }}
              >
                {item < step ? (
                  <Check color={colors.white} size={26} strokeWidth={2.8} />
                ) : (
                  <Text className={styles.progressNodeText}>{item}</Text>
                )}
              </View>
            </Pressable>
            {index < 2 ? (
              <View
                className={styles.progressConnector}
                style={{
                  backgroundColor:
                    item < step
                      ? colors.successBright
                      : "rgba(255,255,255,0.3)",
                }}
              />
            ) : null}
          </React.Fragment>
        ))}
      </View>
      <View className={styles.stepLabels}>
        {stepLabels.map((label, index) => (
          <Text
            key={label}
            className={cn(
              styles.stepLabel,
              index + 1 === step && styles.stepLabelActive
            )}
            style={{
              color:
                index + 1 === step
                  ? colors.white
                  : index + 1 < step
                    ? "rgba(255,255,255,0.86)"
                    : "rgba(255,255,255,0.62)",
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
