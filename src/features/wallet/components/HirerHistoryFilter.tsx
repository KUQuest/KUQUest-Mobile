import React, { useState } from "react";
import { Modal } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { Pressable, Text, TouchableOpacity, View } from "@/tw";

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
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedLabel =
    options.find((opt) => opt.key === selectedFilter)?.label ??
    options[0].label;

  return (
    <View className={styles.headerRow}>
      <Text className={styles.title}>{title}</Text>
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
          <View className={styles.menuCard} style={menuCardShadow}>
            {options.map((opt) => {
              const isSelected = opt.key === selectedFilter;
              return (
                <TouchableOpacity
                  accessibilityLabel={opt.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={opt.key}
                  activeOpacity={0.7}
                  className={`${styles.menuOption} ${
                    isSelected ? styles.menuOptionSelected : ""
                  }`}
                  onPress={() => {
                    onSelectFilter(opt.key);
                    setMenuOpen(false);
                  }}
                  testID={`filter-opt-${opt.key}`}
                >
                  <Text
                    className={`${styles.menuOptionText} ${
                      isSelected ? styles.menuOptionTextSelected : ""
                    }`}
                  >
                    {opt.label}
                  </Text>
                  {isSelected ? (
                    <Check color={colors.primary} size={16} strokeWidth={2.4} />
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
  headerRow: "mb-[14px] flex-row items-center justify-between",
  title: "font-ku-bold text-[22px] leading-[28px] text-ku-text-strong",
  filterPill:
    "flex-row items-center gap-ku-sm rounded-ku-pill bg-ku-surface-muted px-[14px] py-[7px]",
  filterText: "font-ku-medium text-ku-meta text-ku-text-secondary",
  modalBackdrop: "flex-1 items-center justify-center bg-ku-overlay p-ku-md",
  menuCard:
    "w-[80%] max-w-[280px] rounded-[16px] border border-ku-border-subtle bg-ku-card py-ku-sm",
  menuOption: "flex-row items-center justify-between px-ku-md py-[12px]",
  menuOptionSelected: "bg-ku-surface-success",
  menuOptionText: "font-ku-medium text-ku-body-small text-ku-text-secondary",
  menuOptionTextSelected: "font-ku-semibold text-ku-primary-dark",
} as const;

const menuCardShadow = {
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 5,
} as const;
