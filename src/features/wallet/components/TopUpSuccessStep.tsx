import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle2, ShieldCheck, Wallet } from "lucide-react-native";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

export interface TopUpSuccessStepProps {
  creditSatang: number;
  locale: SupportedLocale;
  onDone: () => void;
}

export function TopUpSuccessStep({
  creditSatang,
  locale,
  onDone,
}: TopUpSuccessStepProps) {
  const m = walletMessages[locale];
  const credit = formatSatang(creditSatang, locale, "exact");

  return (
    <View style={styles.successState} testID="top-up-success-view">
      <View style={styles.successIconWrap} testID="top-up-verified-badge">
        <CheckCircle2 color={colors.success} size={48} strokeWidth={2.2} />
      </View>
      <Text style={styles.successTitle}>{m.topUpSuccessTitle}</Text>
      <Text style={styles.successDescription}>{m.topUpSuccessDescription}</Text>
      <View style={styles.successAmountCard}>
        <View style={styles.successAmountHeader}>
          <Wallet color={colors.primaryDeep} size={20} strokeWidth={2.2} />
          <Text style={styles.successAmountLabel}>{m.topUpCredit}</Text>
        </View>
        <Text style={styles.successAmount}>{credit}</Text>
      </View>
      <View style={styles.successNote}>
        <ShieldCheck color={colors.success} size={18} strokeWidth={2.2} />
        <Text style={styles.successNoteText}>{m.paymentSuccess}</Text>
      </View>
      <TouchableOpacity
        accessibilityLabel={m.done}
        accessibilityRole="button"
        activeOpacity={0.8}
        onPress={onDone}
        style={styles.successActionButton}
        testID="top-up-done-btn"
      >
        <Text style={styles.successActionText}>{m.done}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  successState: {
    alignItems: "center",
    paddingBottom: 24,
    paddingTop: 24,
  },
  successIconWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceSuccess,
    borderColor: colors.borderSuccess,
    borderRadius: 48,
    borderWidth: 1,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  successTitle: {
    color: colors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: 24,
    marginTop: 16,
    textAlign: "center",
  },
  successDescription: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    textAlign: "center",
  },
  successAmountCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderAccent,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: "100%",
  },
  successAmountHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  successAmountLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: 13,
  },
  successAmount: {
    color: colors.primaryDeep,
    fontFamily: fontFamily.bold,
    fontSize: 32,
    marginTop: 4,
  },
  successNote: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceAccent,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    padding: 12,
    width: "100%",
  },
  successNoteText: {
    color: colors.textSecondary,
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  successActionButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 9999,
    height: 52,
    justifyContent: "center",
    marginTop: 24,
    width: "100%",
  },
  successActionText: {
    color: colors.white,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
  },
});
