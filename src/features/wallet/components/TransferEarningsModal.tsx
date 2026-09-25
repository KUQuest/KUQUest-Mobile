import React, { useState } from "react";
import { Modal, StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/tw";
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
import { spacing } from "@/theme/spacing";
import { cn } from "@/tw/cn";
import { showSweetAlert, SweetAlertVariant } from "@/components/ui/SweetAlert";
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
      showSweetAlert({
        title: m.transferSuccessTitle,
        message: m.transferSuccessDesc(formatSatang(parsedSatang)),
        variant: SweetAlertVariant.Success,
      });
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
  const confirmDisabled = !isValidAmount || loading;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View className={styles.modalOverlay}>
        <Pressable
          accessibilityLabel={m.closeButton}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="transfer-earnings-backdrop"
        />

        <View
          className={styles.modalCard}
          style={modalCardShadow}
          testID="transfer-earnings-modal"
        >
          <View className={styles.header}>
            <View className={styles.headerTitleRow}>
              <View className={styles.headerIconWrap}>
                <ArrowRightLeft
                  color={colors.workerDeep}
                  size={18}
                  strokeWidth={2.4}
                />
              </View>
              <Text className={styles.headerTitle}>
                {m.transferEarningsTitle}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={m.closeButton}
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={onClose}
              className={styles.closeBtn}
              testID="transfer-modal-close-btn"
            >
              <X color={colors.textSecondary} size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerClassName={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className={styles.modalDesc}>{m.transferEarningsDesc}</Text>

            <View className={styles.flowCard}>
              <View className={styles.flowRow}>
                <View className={styles.flowIconBoxEarnings}>
                  <Sparkles color={colors.worker} size={18} strokeWidth={2} />
                </View>
                <View className={styles.flowInfo}>
                  <Text className={styles.flowLabel}>{m.fromEarnings}</Text>
                  <Text
                    className={styles.flowAmount}
                    testID="transfer-current-earnings"
                  >
                    {formatSatang(earningsSatang, "en", "exact")}
                  </Text>
                </View>
              </View>

              <View className={styles.flowDivider}>
                <View className={styles.flowLine} />
                <View className={styles.flowArrowCircle}>
                  <ArrowDown
                    color={colors.workerDeep}
                    size={14}
                    strokeWidth={2.5}
                  />
                </View>
                <View className={styles.flowLine} />
              </View>

              <View className={styles.flowRow}>
                <View className={styles.flowIconBoxSpending}>
                  <Wallet color={colors.workerDeep} size={18} strokeWidth={2} />
                </View>
                <View className={styles.flowInfo}>
                  <Text className={styles.flowLabel}>{m.toSpending}</Text>
                  <Text
                    className={styles.flowAmount}
                    testID="transfer-current-spending"
                  >
                    {formatSatang(spendingSatang, "en", "exact")}
                  </Text>
                </View>
              </View>
            </View>

            <View className={styles.inputSection}>
              <Text className={styles.inputLabel}>{m.transferAmountLabel}</Text>
              <View
                className={cn(
                  styles.inputWrap,
                  errorMsg && styles.inputWrapError,
                  earningsSatang <= 0 && styles.inputWrapDisabled
                )}
              >
                <Text className={styles.inputPrefix}>฿</Text>
                <TextInput
                  editable={earningsSatang > 0 && !loading}
                  keyboardType="decimal-pad"
                  onChangeText={(val) => {
                    setInputAmount(val.replace(/[^0-9.]/g, ""));
                    setErrorMsg(null);
                  }}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  className={styles.textInput}
                  testID="transfer-amount-input"
                  value={inputAmount}
                />
                <TouchableOpacity
                  accessibilityLabel={m.transferAll}
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  disabled={earningsSatang <= 0 || loading}
                  onPress={handleSetMax}
                  className={cn(
                    styles.maxButton,
                    earningsSatang <= 0 && styles.maxButtonDisabled
                  )}
                  testID="transfer-amount-max-btn"
                >
                  <Text className={styles.maxButtonText}>{m.transferAll}</Text>
                </TouchableOpacity>
              </View>

              {earningsSatang > 0 ? (
                <View className={styles.presetRow}>
                  {[50, 100, 500].map((presetBaht) => {
                    const presetSatang = presetBaht * 100;
                    const isAvailable = presetSatang <= earningsSatang;
                    return (
                      <TouchableOpacity
                        disabled={!isAvailable || loading}
                        key={presetBaht}
                        onPress={() => handleSelectPreset(presetBaht)}
                        className={cn(
                          styles.presetChip,
                          !isAvailable && styles.presetChipDisabled
                        )}
                        testID={`transfer-preset-${presetBaht}`}
                      >
                        <Text
                          className={cn(
                            styles.presetChipText,
                            !isAvailable && styles.presetChipTextDisabled
                          )}
                        >
                          {formatSatang(presetSatang, "en")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    disabled={earningsSatang <= 0 || loading}
                    onPress={handleSetMax}
                    className={styles.presetChip}
                    testID="transfer-preset-all"
                  >
                    <Text className={styles.presetChipText}>
                      {m.transferAll}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {errorMsg ? (
                <Text className={styles.hintError}>{errorMsg}</Text>
              ) : earningsSatang <= 0 ? (
                <Text
                  className={styles.hintWarning}
                  testID="transfer-no-earnings-hint"
                >
                  {m.noEarningsAvailable}
                </Text>
              ) : inputAmount.length > 0 && parsedSatang < 100 ? (
                <Text className={styles.hintWarning}>{m.minTransferHint}</Text>
              ) : inputAmount.length > 0 && parsedSatang > earningsSatang ? (
                <Text className={styles.hintError}>
                  {m.insufficientEarnings}
                </Text>
              ) : null}
            </View>

            <View className={styles.policyCard}>
              <View className={styles.policyHeader}>
                <CheckCircle2
                  color={colors.success}
                  size={16}
                  strokeWidth={2.4}
                />
                <Text className={styles.policyTitle}>{m.transferFeeFree}</Text>
              </View>
              <View className={styles.policyBody}>
                <Info
                  color={colors.textSecondary}
                  size={14}
                  strokeWidth={2}
                  style={policyInfoIcon}
                />
                <Text className={styles.policyNote}>
                  {m.transferPolicyNote}
                </Text>
              </View>
            </View>

            {isValidAmount ? (
              <View className={styles.previewCard}>
                <View className={styles.previewRow}>
                  <Text className={styles.previewLabel}>
                    ยอดเงินพร้อมใช้หลังโอน:
                  </Text>
                  <Text className={styles.previewValueSuccess}>
                    {formatSatang(newSpendingSatang, "en", "exact")}
                  </Text>
                </View>
                <View className={styles.previewRow}>
                  <Text className={styles.previewLabel}>
                    รายได้สะสมคงเหลือ:
                  </Text>
                  <Text className={styles.previewValue}>
                    {formatSatang(newEarningsSatang, "en", "exact")}
                  </Text>
                </View>
              </View>
            ) : null}

            <View className={styles.actionRow}>
              <TouchableOpacity
                accessibilityLabel={m.transferConfirmBtn}
                accessibilityRole="button"
                activeOpacity={0.8}
                disabled={confirmDisabled}
                onPress={handleTransfer}
                className={cn(
                  styles.confirmBtn,
                  confirmDisabled && styles.confirmBtnDisabled
                )}
                style={confirmDisabled ? confirmShadowDisabled : confirmShadow}
                testID="transfer-confirm-btn"
              >
                {loading ? (
                  <ActivityIndicator color={colors.onWorker} size="small" />
                ) : (
                  <>
                    <ArrowRightLeft
                      color={colors.onWorker}
                      size={17}
                      strokeWidth={2.4}
                    />
                    <Text className={styles.confirmBtnText}>
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
                className={styles.cancelBtn}
                testID="transfer-cancel-btn"
              >
                <Text className={styles.cancelBtnText}>{m.closeButton}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  modalOverlay: "flex-1 justify-end bg-ku-overlay",
  modalCard:
    "max-h-[88%] rounded-tl-[24px] rounded-tr-[24px] bg-ku-surface pb-ku-lg",
  header:
    "flex-row items-center justify-between border-b border-ku-border-subtle px-ku-20 pb-ku-14 pt-ku-18",
  headerTitleRow: "flex-row items-center gap-ku-10",
  headerIconWrap:
    "h-[32px] w-[32px] items-center justify-center rounded-[16px] bg-ku-surface-accent",
  headerTitle: "font-ku-bold text-ku-emphasis text-ku-text-strong",
  closeBtn:
    "h-[34px] w-[34px] items-center justify-center rounded-[17px] bg-ku-surface-muted",
  scrollContent: "px-ku-20 pb-ku-md pt-ku-md",
  modalDesc:
    "mb-ku-md font-ku-regular text-[13px] leading-[18px] text-ku-text-secondary",
  flowCard:
    "mb-ku-18 rounded-[16px] border border-ku-border-subtle bg-ku-surface-muted p-ku-14",
  flowRow: "flex-row items-center gap-ku-sm",
  flowIconBoxEarnings:
    "h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-ku-surface-accent",
  flowIconBoxSpending:
    "h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-ku-surface-success",
  flowInfo: "flex-1",
  flowLabel: "mb-ku-2 font-ku-medium text-[12px] text-ku-text-secondary",
  flowAmount: "font-ku-bold text-ku-body text-ku-text-strong",
  flowDivider: "my-ku-sm flex-row items-center px-ku-10",
  flowLine: "h-[1px] flex-1 bg-ku-border-subtle",
  flowArrowCircle:
    "mx-ku-sm h-[24px] w-[24px] items-center justify-center rounded-[12px] bg-ku-surface-accent",
  inputSection: "mb-ku-md",
  inputLabel:
    "mb-ku-sm font-ku-semibold text-ku-body-small text-ku-text-strong",
  inputWrap:
    "h-[52px] flex-row items-center rounded-[14px] border-[1.5px] border-ku-border bg-ku-surface px-ku-14",
  inputWrapError: "border-ku-danger",
  inputWrapDisabled: "bg-ku-surface-muted opacity-70",
  inputPrefix: "mr-ku-6 font-ku-bold text-ku-subtitle text-ku-text-strong",
  textInput: "flex-1 py-ku-0 font-ku-bold text-ku-subtitle text-ku-text-strong",
  maxButton: "rounded-[8px] bg-ku-surface-accent px-ku-10 py-ku-6",
  maxButtonDisabled: "opacity-40",
  maxButtonText: "font-ku-semibold text-[12px] text-ku-worker-deep",
  presetRow: "mt-ku-10 flex-row gap-ku-sm",
  presetChip:
    "flex-1 items-center justify-center rounded-[10px] border border-ku-border-subtle bg-ku-surface-muted py-ku-7",
  presetChipDisabled: "opacity-35",
  presetChipText: "font-ku-medium text-[12px] text-ku-text-secondary",
  presetChipTextDisabled: "text-ku-text-muted",
  hintWarning: "mt-ku-6 font-ku-medium text-[12px] text-ku-warning-dark",
  hintError: "mt-ku-6 font-ku-medium text-[12px] text-ku-danger",
  policyCard:
    "mb-ku-md rounded-[14px] border border-ku-border-success bg-ku-surface-success p-ku-sm",
  policyHeader: "mb-ku-xs flex-row items-center gap-ku-6",
  policyTitle: "font-ku-semibold text-[13px] text-ku-success",
  policyBody: "flex-row items-start gap-ku-6",
  policyNote:
    "flex-1 font-ku-regular text-[12px] leading-[16px] text-ku-text-secondary",
  previewCard: "mb-ku-18 gap-ku-6 rounded-[12px] bg-ku-surface-muted p-ku-sm",
  previewRow: "flex-row items-center justify-between",
  previewLabel: "font-ku-medium text-[12px] text-ku-text-secondary",
  previewValue: "font-ku-semibold text-[13px] text-ku-text-strong",
  previewValueSuccess: "font-ku-bold text-[13px] text-ku-success",
  actionRow: "mt-ku-xs gap-ku-10",
  confirmBtn:
    "h-[50px] flex-row items-center justify-center gap-ku-sm rounded-[14px] bg-ku-worker-deep",
  confirmBtnDisabled: "bg-ku-text-muted",
  confirmBtnText: "font-ku-semibold text-ku-control text-ku-on-worker",
  cancelBtn:
    "h-[44px] items-center justify-center rounded-[14px] bg-ku-surface-muted",
  cancelBtnText: "font-ku-medium text-ku-body-small text-ku-text-secondary",
} as const;

const modalCardShadow = {
  elevation: 24,
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.2,
  shadowRadius: 12,
} satisfies ViewStyle;

const confirmShadow = {
  shadowColor: colors.workerDeep,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 3,
} satisfies ViewStyle;

const confirmShadowDisabled = {
  shadowColor: colors.workerDeep,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0,
  shadowRadius: 6,
  elevation: 0,
} satisfies ViewStyle;

const policyInfoIcon = { marginTop: spacing.px2 } as const;
