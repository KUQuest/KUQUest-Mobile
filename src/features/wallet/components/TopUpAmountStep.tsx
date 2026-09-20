import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AlertCircle, ShieldCheck, Wallet } from "lucide-react-native";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

const QUICK_AMOUNTS = [100, 300, 500, 1000, 2000] as const;

export interface TopUpAmountStepProps {
  amountStr: string;
  error: string | null;
  isAmountValid: boolean;
  loading: boolean;
  locale: SupportedLocale;
  onAmountChange: (value: string) => void;
  onContinue: () => void;
  onSelectQuick: (amount: number) => void;
}

export function TopUpAmountStep({
  amountStr,
  error,
  isAmountValid,
  loading,
  locale,
  onAmountChange,
  onContinue,
  onSelectQuick,
}: TopUpAmountStepProps) {
  const m = walletMessages[locale];

  return (
    <View testID="top-up-amount-step">
      <View style={styles.bannerCard}>
        <View style={styles.bannerIconWrap}>
          <Wallet color={colors.primaryDeep} size={22} strokeWidth={2.4} />
        </View>
        <View style={styles.bannerTextWrap}>
          <Text style={styles.bannerTitle}>{m.topUpTitle}</Text>
          <Text style={styles.bannerDesc}>{m.topUpAmountDescription}</Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>{m.enterAmount}</Text>
        <View
          style={[
            styles.inputContainer,
            error ? styles.inputContainerError : null,
          ]}
        >
          <Text style={styles.inputPrefix}>฿</Text>
          <TextInput
            accessibilityLabel={m.enterAmount}
            autoFocus={false}
            keyboardType="numeric"
            onChangeText={onAmountChange}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={styles.amountInput}
            testID="top-up-amount-input"
            value={amountStr}
          />
          {amountStr.length > 0 ? (
            <TouchableOpacity
              accessibilityLabel={m.clearAmount}
              onPress={() => onAmountChange("")}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <AlertCircle color={colors.danger} size={15} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <Text style={styles.helperText}>{m.minTopUpHint}</Text>
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionLabel}>{m.quickAmountLabel}</Text>
        <View style={styles.quickGrid}>
          {QUICK_AMOUNTS.map((amt) => {
            const isSelected = amountStr === String(amt);
            return (
              <TouchableOpacity
                accessibilityLabel={m.quickAmountAccessibilityLabel(amt)}
                accessibilityRole="button"
                activeOpacity={0.7}
                key={amt}
                onPress={() => onSelectQuick(amt)}
                style={[
                  styles.quickChip,
                  isSelected ? styles.quickChipSelected : null,
                ]}
                testID={`top-up-quick-${amt}`}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    isSelected ? styles.quickChipTextSelected : null,
                  ]}
                >
                  {formatSatang(amt * 100, locale)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.infoCallout}>
        <ShieldCheck color={colors.primaryDeep} size={18} strokeWidth={2.4} />
        <Text style={styles.infoCalloutText}>{m.topUpSafetyNotice}</Text>
      </View>

      <TouchableOpacity
        accessibilityLabel={m.continue}
        accessibilityRole="button"
        activeOpacity={0.8}
        disabled={!isAmountValid || loading}
        onPress={onContinue}
        style={[
          styles.primaryActionButton,
          !isAmountValid || loading ? styles.primaryButtonDisabled : null,
        ]}
        testID="top-up-continue-btn"
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.primaryActionButtonText}>{m.continue}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surfaceAccent,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: 16,
    marginBottom: 20,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSuccess,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTextWrap: { flex: 1 },
  bannerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    color: colors.primaryDeep,
    marginBottom: 2,
  },
  bannerDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  sectionContainer: { marginBottom: 20 },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textStrong,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  inputContainerError: { borderColor: colors.danger },
  inputPrefix: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.textStrong,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.textStrong,
    paddingVertical: 0,
  },
  clearBtn: { padding: 6 },
  clearBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.textMuted,
  },
  helperText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceDanger,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  quickChipSelected: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  quickChipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  quickChipTextSelected: {
    color: colors.primaryDeep,
    fontFamily: fontFamily.bold,
  },
  infoCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSuccess,
    padding: 14,
    marginBottom: 24,
  },
  infoCalloutText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  primaryActionButton: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryActionButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.white,
  },
});
