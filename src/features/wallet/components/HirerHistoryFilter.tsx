import React, { useState } from "react";
import { Modal } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { Pressable, Text, TouchableOpacity, View } from "@/tw";
import { cn } from "@/tw/cn";

export type HirerHistoryFilterOption =
  "all" | "top_up" | "payout" | "escrow" | "inflow" | "outflow";

interface HirerHistoryFilterProps {
  title: string;
  selectedFilter: HirerHistoryFilterOption;
  onSelectFilter: (filter: HirerHistoryFilterOption) => void;
  options: {
    key: HirerHistoryFilterOption;
    label: string;
  }[];
}

export function HirerHistoryFilter({
  title,
  selectedFilter,
  onSelectFilter,
  options,
}: HirerHistoryFilterProps) {
  const { colors } = useAppTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedLabel =
    options.find((opt) => opt.key === selectedFilter)?.label ??
    options[0].label;

  return (
    <View className={styles.headerRow}>
      <Text accessibilityRole="header" className={styles.title}>
        {title}
      </Text>
      <TouchableOpacity
        accessibilityLabel={`กรองรายการ: ${selectedLabel}`}
        accessibilityRole="button"
        activeOpacity={0.8}
        className={styles.filterPill}
        onPress={() => setMenuOpen(true)}
        testID="hirer-history-filter-button"
      >
        <Text className={styles.filterText}>{selectedLabel}</Text>
        <ChevronDown color={colors.textSecondary} size={16} strokeWidth={2.2} />
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent
        visible={menuOpen}
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          className={styles.modalBackdrop}
          onPress={() => setMenuOpen(false)}
          testID="filter-modal-backdrop"
        >
          <View className={styles.menuCard}>
            {options.map((opt) => {
              const isSelected = opt.key === selectedFilter;
              return (
                <TouchableOpacity
                  accessibilityLabel={opt.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={opt.key}
                  activeOpacity={0.7}
                  className={cn(
                    styles.menuOption,
                    isSelected && styles.menuOptionSelected
                  )}
                  onPress={() => {
                    onSelectFilter(opt.key);
                    setMenuOpen(false);
                  }}
                  testID={`filter-opt-${opt.key}`}
                >
                  <Text
                    className={cn(
                      styles.menuOptionText,
                      isSelected && styles.menuOptionTextSelected
                    )}
                  >
                    {opt.label}
                  </Text>
                  {isSelected ? (
                    <Check color={colors.primary} size={18} strokeWidth={2.4} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = {
  headerRow: "mb-ku-12 flex-row items-center justify-between gap-ku-sm",
  title: "shrink font-ku-bold text-ku-title text-ku-text-strong",
  filterPill:
    "min-h-[48px] flex-row items-center gap-ku-sm rounded-ku-pill border border-ku-border bg-ku-surface px-ku-md",
  filterText: "font-ku-medium text-ku-body-small text-ku-text",
  modalBackdrop: "flex-1 items-center justify-center bg-ku-overlay p-ku-md",
  menuCard:
    "w-[80%] max-w-[320px] overflow-hidden rounded-ku-card border border-ku-border bg-ku-surface py-ku-xs",
  menuOption: "min-h-[48px] flex-row items-center justify-between px-ku-md",
  menuOptionSelected: "bg-ku-surface-accent",
  menuOptionText: "font-ku-medium text-ku-body-small text-ku-text-secondary",
  menuOptionTextSelected: "font-ku-semibold text-ku-primary-dark",
} as const;
