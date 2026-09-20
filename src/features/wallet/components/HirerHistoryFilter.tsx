import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

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
    <View style={styles.headerRow}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        accessibilityLabel={`กรองรายการ: ${selectedLabel}`}
        accessibilityRole="button"
        activeOpacity={0.8}
        onPress={() => setMenuOpen(true)}
        style={styles.filterPill}
        testID="hirer-history-filter-button"
      >
        <Text style={styles.filterText}>{selectedLabel}</Text>
        <ChevronDown color={colors.textSecondary} size={16} strokeWidth={2.2} />
      </TouchableOpacity>

      {/* Filter Options Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={menuOpen}
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setMenuOpen(false)}
          testID="filter-modal-backdrop"
        >
          <View style={styles.menuCard}>
            {options.map((opt) => {
              const isSelected = opt.key === selectedFilter;
              return (
                <TouchableOpacity
                  accessibilityLabel={opt.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={opt.key}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectFilter(opt.key);
                    setMenuOpen(false);
                  }}
                  style={[
                    styles.menuOption,
                    isSelected && styles.menuOptionSelected,
                  ]}
                  testID={`filter-opt-${opt.key}`}
                >
                  <Text
                    style={[
                      styles.menuOptionText,
                      isSelected && styles.menuOptionTextSelected,
                    ]}
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

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textStrong,
  },
  filterPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    width: "80%",
    maxWidth: 280,
    paddingVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuOptionSelected: {
    backgroundColor: colors.surfaceSuccess,
  },
  menuOptionText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  menuOptionTextSelected: {
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDeep,
  },
});
