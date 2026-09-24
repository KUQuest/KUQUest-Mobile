import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import styles from "../createQuestStyles";
import type { ChoiceOption, ChoiceVariant } from "../../createQuestTypes";

/**
 * Single-select radio group. `format` renders side-by-side tiles (stacked on
 * narrow or large-text layouts); `acceptance` renders a grouped list.
 */
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
  const { colors } = useAppTheme();
  const isTile = variant === "format" && !stacked;

  return (
    <View
      className={isTile ? styles.choiceTiles : styles.choiceList}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {options.map((option, index) => {
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
              isTile ? styles.choiceTile : styles.choiceRow,
              !isTile && index > 0 && styles.choiceRowDivider,
              selected &&
                (isTile ? styles.choiceTileSelected : styles.choiceRowSelected)
            )}
            testID={`create-quest-choice-${option.value.toLowerCase()}`}
          >
            <View
              className={isTile ? styles.choiceTileTop : styles.choiceIconSlot}
            >
              <View
                className={cn(
                  styles.choiceIcon,
                  selected && styles.choiceIconSelected
                )}
              >
                <Icon
                  color={selected ? colors.onHirer : colors.hirer}
                  size={22}
                  strokeWidth={2.1}
                />
              </View>
              {isTile ? <Radio selected={selected} /> : null}
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
            {isTile ? null : <Radio selected={selected} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View className={cn(styles.radio, selected && styles.radioSelected)}>
      {selected ? <View className={styles.radioDot} /> : null}
    </View>
  );
}
