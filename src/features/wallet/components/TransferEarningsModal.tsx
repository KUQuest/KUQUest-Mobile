import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowDown,
  ArrowRightLeft,
  CheckCircle2,
  Info,
  Sparkles,
  Wallet,
  X,
} from "lucide-react-native";
import { type WalletBalances } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import type { WalletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { useConvertEarningsMutation } from "../api/walletQueries";

interface TransferEarningsModalProps {
  visible: boolean;
  balances: WalletBalances | null;
  messages: WalletMessages;
  onClose: () => void;
  onSuccess: (amountSatang: number) => void;
}

export function TransferEarningsModal({
  visible,
  balances,
  messages: m,
  onClose,
  onSuccess,
}: TransferEarningsModalProps) {
  const earningsSatang = balances?.earningsBalanceSatang ?? 0;
  const spendingSatang = balances?.spendingBalanceSatang ?? 0;
  const [inputAmount, setInputAmount] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const convertMutation = useConvertEarningsMutation();
  const loading = convertMutation.isPending;

  // Parse input amount to satang
  const parsedSatang = Math.round((parseFloat(inputAmount) || 0) * 100);

  const isValidAmount =
    parsedSatang >= 100 && parsedSatang <= earningsSatang && earningsSatang > 0;

  const handleSetMax = () => {
    if (earningsSatang <= 0) return;
    const bahtValue = (earningsSatang / 100).toFixed(2);
    setInputAmount(bahtValue);
    setErrorMsg(null);
  };

  const handleSelectPreset = (baht: number) => {
    const satang = baht * 100;
    if (satang > earningsSatang) {
      handleSetMax();
      return;
    }
    setInputAmount(baht.toFixed(2));
    setErrorMsg(null);
  };

  const handleTransfer = async () => {
    if (!isValidAmount || loading) return;

    setErrorMsg(null);

    try {
      await convertMutation.mutateAsync(parsedSatang);
      Alert.alert(
        m.transferSuccessTitle,
        m.transferSuccessDesc(formatSatang(parsedSatang))
      );
      onSuccess(parsedSatang);
      onClose();
      setInputAmount("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : m.convertError;
      setErrorMsg(message);
    }
  };

  const newSpendingSatang = spendingSatang + (isValidAmount ? parsedSatang : 0);
  const newEarningsSatang = earningsSatang - (isValidAmount ? parsedSatang : 0);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityLabel={m.closeButton}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="transfer-earnings-backdrop"
        />

        <View style={styles.modalCard} testID="transfer-earnings-modal">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <ArrowRightLeft
                  color={colors.primaryDeep}
                  size={18}
                  strokeWidth={2.4}
                />
              </View>
              <Text style={styles.headerTitle}>{m.transferEarningsTitle}</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={m.closeButton}
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
              testID="transfer-modal-close-btn"
            >
              <X color={colors.textSecondary} size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Description */}
            <Text style={styles.modalDesc}>{m.transferEarningsDesc}</Text>

            {/* Compartment Flow Card */}
            <View style={styles.flowCard}>
              {/* From: Earnings */}
              <View style={styles.flowRow}>
                <View style={styles.flowIconBoxEarnings}>
                  <Sparkles color={colors.primary} size={18} strokeWidth={2} />
                </View>
                <View style={styles.flowInfo}>
                  <Text style={styles.flowLabel}>{m.fromEarnings}</Text>
                  <Text
                    style={styles.flowAmount}
                    testID="transfer-current-earnings"
                  >
                    {formatSatang(earningsSatang, "en", "exact")}
                  </Text>
                </View>
              </View>

              {/* Arrow Divider */}
              <View style={styles.flowDivider}>
                <View style={styles.flowLine} />
                <View style={styles.flowArrowCircle}>
                  <ArrowDown
                    color={colors.primaryDeep}
                    size={14}
                    strokeWidth={2.5}
                  />
                </View>
                <View style={styles.flowLine} />
              </View>

              {/* To: Spending */}
              <View style={styles.flowRow}>
                <View style={styles.flowIconBoxSpending}>
                  <Wallet
                    color={colors.primaryDeep}
                    size={18}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.flowInfo}>
                  <Text style={styles.flowLabel}>{m.toSpending}</Text>
                  <Text
                    style={styles.flowAmount}
                    testID="transfer-current-spending"
                  >
                    {formatSatang(spendingSatang, "en", "exact")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>{m.transferAmountLabel}</Text>
              <View
                style={[
                  styles.inputWrap,
                  errorMsg ? styles.inputWrapError : null,
                  earningsSatang <= 0 ? styles.inputWrapDisabled : null,
                ]}
              >
                <Text style={styles.inputPrefix}>฿</Text>
                <TextInput
                  editable={earningsSatang > 0 && !loading}
                  keyboardType="decimal-pad"
                  onChangeText={(val) => {
                    setInputAmount(val.replace(/[^0-9.]/g, ""));
                    setErrorMsg(null);
                  }}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  style={styles.textInput}
                  testID="transfer-amount-input"
                  value={inputAmount}
                />
                <TouchableOpacity
                  accessibilityLabel={m.transferAll}
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  disabled={earningsSatang <= 0 || loading}
                  onPress={handleSetMax}
                  style={[
                    styles.maxButton,
                    earningsSatang <= 0 ? styles.maxButtonDisabled : null,
                  ]}
                  testID="transfer-amount-max-btn"
                >
                  <Text style={styles.maxButtonText}>{m.transferAll}</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Presets */}
              {earningsSatang > 0 ? (
                <View style={styles.presetRow}>
                  {[50, 100, 500].map((presetBaht) => {
                    const presetSatang = presetBaht * 100;
                    const isAvailable = presetSatang <= earningsSatang;
                    return (
                      <TouchableOpacity
                        disabled={!isAvailable || loading}
                        key={presetBaht}
                        onPress={() => handleSelectPreset(presetBaht)}
                        style={[
                          styles.presetChip,
                          !isAvailable ? styles.presetChipDisabled : null,
                        ]}
                        testID={`transfer-preset-${presetBaht}`}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            !isAvailable ? styles.presetChipTextDisabled : null,
                          ]}
                        >
                          {formatSatang(presetSatang, "en")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    disabled={earningsSatang <= 0 || loading}
                    onPress={handleSetMax}
                    style={styles.presetChip}
                    testID="transfer-preset-all"
                  >
                    <Text style={styles.presetChipText}>{m.transferAll}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Validation / Helper text */}
              {errorMsg ? (
                <Text style={styles.hintError}>{errorMsg}</Text>
              ) : earningsSatang <= 0 ? (
                <Text
                  style={styles.hintWarning}
                  testID="transfer-no-earnings-hint"
                >
                  {m.noEarningsAvailable}
                </Text>
              ) : inputAmount.length > 0 && parsedSatang < 100 ? (
                <Text style={styles.hintWarning}>{m.minTransferHint}</Text>
              ) : inputAmount.length > 0 && parsedSatang > earningsSatang ? (
                <Text style={styles.hintError}>{m.insufficientEarnings}</Text>
              ) : null}
            </View>

            {/* Rulebook Guarantee Callout */}
            <View style={styles.policyCard}>
              <View style={styles.policyHeader}>
                <CheckCircle2
                  color={colors.success}
                  size={16}
                  strokeWidth={2.4}
                />
                <Text style={styles.policyTitle}>{m.transferFeeFree}</Text>
              </View>
              <View style={styles.policyBody}>
                <Info
                  color={colors.textSecondary}
                  size={14}
                  strokeWidth={2}
                  style={styles.policyInfoIcon}
                />
                <Text style={styles.policyNote}>{m.transferPolicyNote}</Text>
              </View>
            </View>

            {/* Calculation Preview if amount entered */}
            {isValidAmount ? (
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>
                    ยอดเงินพร้อมใช้หลังโอน:
                  </Text>
                  <Text style={styles.previewValueSuccess}>
                    {formatSatang(newSpendingSatang, "en", "exact")}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>รายได้สะสมคงเหลือ:</Text>
                  <Text style={styles.previewValue}>
                    {formatSatang(newEarningsSatang, "en", "exact")}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                accessibilityLabel={m.transferConfirmBtn}
                accessibilityRole="button"
                activeOpacity={0.8}
                disabled={!isValidAmount || loading}
                onPress={handleTransfer}
                style={[
                  styles.confirmBtn,
                  !isValidAmount || loading ? styles.confirmBtnDisabled : null,
                ]}
                testID="transfer-confirm-btn"
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <ArrowRightLeft
                      color={colors.white}
                      size={17}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.confirmBtnText}>
                      {m.transferConfirmBtn}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel={m.closeButton}
                accessibilityRole="button"
                activeOpacity={0.7}
                disabled={loading}
                onPress={onClose}
                style={styles.cancelBtn}
                testID="transfer-cancel-btn"
              >
                <Text style={styles.cancelBtnText}>{m.closeButton}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingBottom: 24,
    elevation: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: colors.textStrong,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  modalDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  flowCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 14,
    marginBottom: 18,
  },
  flowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flowIconBoxEarnings: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  flowIconBoxSpending: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceSuccess,
    alignItems: "center",
    justifyContent: "center",
  },
  flowInfo: {
    flex: 1,
  },
  flowLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  flowAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textStrong,
  },
  flowDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  flowLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  flowArrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceAccent,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textStrong,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapError: {
    borderColor: colors.danger,
  },
  inputWrapDisabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.7,
  },
  inputPrefix: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textStrong,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textStrong,
    paddingVertical: 0,
  },
  maxButton: {
    backgroundColor: colors.surfaceAccent,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  maxButtonDisabled: {
    opacity: 0.4,
  },
  maxButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.primaryDeep,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  presetChipDisabled: {
    opacity: 0.35,
  },
  presetChipText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  presetChipTextDisabled: {
    color: colors.textMuted,
  },
  hintWarning: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: "#B45309",
    marginTop: 6,
  },
  hintError: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.danger,
    marginTop: 6,
  },
  policyCard: {
    backgroundColor: colors.surfaceSuccess,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSuccess,
    padding: 12,
    marginBottom: 16,
  },
  policyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  policyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.success,
  },
  policyBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  policyInfoIcon: {
    marginTop: 2,
  },
  policyNote: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  previewCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    gap: 6,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  previewValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: colors.textStrong,
  },
  previewValueSuccess: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.success,
  },
  actionRow: {
    gap: 10,
    marginTop: 4,
  },
  confirmBtn: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnDisabled: {
    backgroundColor: colors.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.white,
  },
  cancelBtn: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
