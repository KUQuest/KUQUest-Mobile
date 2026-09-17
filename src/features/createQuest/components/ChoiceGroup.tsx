import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import styles from "../createQuestStyles";
import type { ChoiceOption, ChoiceVariant } from "../createQuestTypes";

export function ChoiceGroup({
  label,
  value,
  options,
  variant,
  stacked,
  onChange,
}: {
  label: string;
  value: string;
  options: ChoiceOption[];
  variant: ChoiceVariant;
  stacked: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <View
      className={cn(
        styles.choiceGroup,
        variant === "format"
          ? stacked
            ? styles.choiceGroupFormatStacked
            : styles.choiceGroupFormat
          : styles.choiceGroupAcceptance
      )}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={
        variant === "format" && stacked
          ? { flexDirection: "column" }
          : undefined
      }
    >
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={`${label}: ${option.label}. ${option.description}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              styles.choice,
              variant === "format"
                ? stacked
                  ? styles.choiceFormatStacked
                  : styles.choiceFormat
                : styles.choiceAcceptance,
              selected && styles.choiceSelected
            )}
            testID={`create-quest-choice-${option.value.toLowerCase()}`}
          >
            <View className={styles.choiceIcon}>
              <Icon
                color={colors.primary}
                size={variant === "format" ? 27 : 26}
                strokeWidth={2.1}
              />
            </View>
            <View className={styles.choiceCopy}>
              <Text
                className={cn(
                  styles.choiceText,
                  selected && styles.choiceTextSelected
                )}
              >
                {option.label}
              </Text>
              <Text className={styles.choiceDescription}>
                {option.description}
              </Text>
            </View>
            <View
              className={cn(styles.radio, selected && styles.radioSelected)}
            >
              {selected ? <View className={styles.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
