import React from "react";
import { ArrowLeft, Check } from "lucide-react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import styles from "./createQuestStyles";
import type { Step } from "../createQuestTypes";

export function CreateQuestHeader({
  messages,
  step,
  onBackPress,
  onStepPress,
  title,
}: {
  messages: typeof createQuestMessages.en;
  step: Step;
  onBackPress: () => void;
  onStepPress?: (step: Step) => void;
  title?: string;
}) {
  const { colors } = useAppTheme();
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
          testID="create-quest-header-back"
        >
          <ArrowLeft color={colors.onPrimary} size={28} strokeWidth={2.4} />
        </Pressable>
        <View className={styles.heroTitleGroup}>
          <Text accessibilityRole="header" className={styles.heroTitle}>
            {title ?? messages.title}
          </Text>
        </View>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: 3, now: step }}
        className={styles.progressTrack}
      >
        {[1, 2, 3].map((item, index) => {
          const node = (
            <View
              className={cn(
                styles.progressNode,
                item <= step
                  ? "bg-ku-success-bright"
                  : "bg-ku-on-primary/[0.34]"
              )}
            >
              {item < step ? (
                <Check color={colors.onPrimary} size={26} strokeWidth={2.8} />
              ) : (
                <Text className={styles.progressNodeText}>{item}</Text>
              )}
            </View>
          );
          return (
            <React.Fragment key={item}>
              {onStepPress ? (
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
                  {node}
                </Pressable>
              ) : (
                <View className={styles.progressNodePressable}>{node}</View>
              )}
              {index < 2 ? (
                <View
                  className={cn(
                    styles.progressConnector,
                    item < step
                      ? "bg-ku-success-bright"
                      : "bg-ku-on-primary/[0.3]"
                  )}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
      <View className={styles.stepLabels}>
        {stepLabels.map((label, index) => (
          <React.Fragment key={label}>
            <View className={styles.stepLabelColumn}>
              <Text
                className={cn(
                  styles.stepLabel,
                  index + 1 === step
                    ? styles.stepLabelActive
                    : index + 1 < step
                      ? "text-ku-on-primary/[0.86]"
                      : "text-ku-on-primary/[0.62]"
                )}
              >
                {label}
              </Text>
            </View>
            {index < 2 ? <View className={styles.stepLabelSpacer} /> : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
