import React, { useEffect, useState } from "react";
import { Alert, Modal, Platform } from "react-native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "@/tw";
import type { PayoutRecord } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { colors } from "@/theme/colors";
import {
  useCreatePayoutDestinationMutation,
  usePayoutDestinationsQuery,
  useRequestPayoutMutation,
} from "./api/walletQueries";

export interface PayoutModalProps {
  visible: boolean;
  earningsSatang: number;
  onClose: () => void;
  onPayoutSuccess: () => void;
  locale?: SupportedLocale;
}

const MINIMUM_PAYOUT_SATANG = 10_000;

function parseAmountSatang(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;

  const baht = Number(match[1]);
  const satang = Number((match[2] ?? "").padEnd(2, "0"));
  const amountSatang = baht * 100 + satang;

  return Number.isSafeInteger(amountSatang) && amountSatang > 0
    ? amountSatang
    : null;
}

function errorMessage(prefix: string, error: unknown): string {
  return error instanceof Error && error.message
    ? `${prefix}\n\n${error.message}`
    : prefix;
}

export function PayoutModal({
  visible,
  earningsSatang,
  onClose,
  onPayoutSuccess,
  locale = "en",
}: PayoutModalProps) {
  const isThai = locale === "th";
  const [amountText, setAmountText] = useState("");
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);
  const [addingDestination, setAddingDestination] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [promptPayAccount, setPromptPayAccount] = useState("");
  const [successfulPayout, setSuccessfulPayout] = useState<PayoutRecord | null>(
    null
  );
  const destinationsQuery = usePayoutDestinationsQuery(visible);
  const destinations = destinationsQuery.data ?? [];
  const loadingDestinations =
    destinationsQuery.isPending || destinationsQuery.isRefetching;
  const createDestinationMutation = useCreatePayoutDestinationMutation();
  const requestPayoutMutation = useRequestPayoutMutation();
  const savingDestination = createDestinationMutation.isPending;
  const submittingPayout = requestPayoutMutation.isPending;
  const amountSatang = parseAmountSatang(amountText);
  const effectiveDestinationId =
    selectedDestinationId ??
    destinations.find((destination) => destination.isDefault)?.id ??
    destinations[0]?.id ??
    null;
  /* eslint-disable react-hooks/set-state-in-effect -- resetting payout modal state on open/close */
  useEffect(() => {
    if (!visible) {
      setAccountHolderName("");
      setPromptPayAccount("");
      setSuccessfulPayout(null);
      return;
    }

    setAddingDestination(false);
    setSelectedDestinationId(null);
    setSuccessfulPayout(null);
  }, [visible]);

  useEffect(() => {
    const loaded = destinationsQuery.data;
    if (!visible || !loaded) return;
    const defaultDestination =
      loaded.find((destination) => destination.isDefault) ?? loaded[0];
    setSelectedDestinationId(defaultDestination?.id ?? null);
    setAddingDestination(loaded.length === 0);
  }, [destinationsQuery.data, visible]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCreateDestination = async () => {
    const holderName = accountHolderName.trim();
    const accountNumber = promptPayAccount.trim();

    if (!holderName) {
      Alert.alert(
        isThai ? "กรอกข้อมูลไม่ครบ" : "Missing account holder name",
        isThai ? "กรุณาระบุชื่อเจ้าของบัญชี" : "Enter the account holder name."
      );
      return;
    }

    if (!accountNumber) {
      Alert.alert(
        isThai ? "กรอกข้อมูลไม่ครบ" : "Missing PromptPay number",
        isThai
          ? "กรุณาระบุเบอร์โทรศัพท์หรือหมายเลขพร้อมเพย์"
          : "Enter a PromptPay phone or account number."
      );
      return;
    }

    try {
      const names = holderName.split(/\s+/);
      const givenName = names[0] || "Member";
      const surname = names.slice(1).join(" ") || "Student";
      const destination = await createDestinationMutation.mutateAsync({
        type: "PROMPTPAY",
        routingType: "PROMPTPAY",
        givenName,
        surname,
        accountHolderName: holderName,
        bankCode: "PROMPTPAY",
        accountNumber,
      });
      setSelectedDestinationId(destination.id);
      setAccountHolderName("");
      setPromptPayAccount("");
      setAddingDestination(false);
    } catch (error: unknown) {
      Alert.alert(
        isThai
          ? "ไม่สามารถบันทึกบัญชีรับเงินได้"
          : "Unable to save destination",
        errorMessage(
          isThai
            ? "ระบบไม่สามารถบันทึกบัญชีรับเงินได้ โปรดลองอีกครั้งหลังจากบริการพร้อมใช้งาน"
            : "The payout destination could not be saved. The payout service may not be deployed yet.",
          error
        )
      );
    }
  };

  const handleRequestPayout = async () => {
    if (!effectiveDestinationId) {
      Alert.alert(
        isThai ? "กรุณาเลือกบัญชีรับเงิน" : "Select a payout destination",
        isThai
          ? "กรุณาเลือกบัญชีรับเงินก่อนส่งคำขอถอนเงิน"
          : "Choose where to receive this payout before submitting."
      );
      return;
    }
    const destinationId = effectiveDestinationId;

    if (amountSatang === null) {
      Alert.alert(
        isThai ? "จำนวนเงินไม่ถูกต้อง" : "Invalid withdrawal amount",
        isThai
          ? "กรอกจำนวนเงินบาทที่มากกว่าศูนย์ โดยระบุทศนิยมได้ไม่เกินสองตำแหน่ง"
          : "Enter a positive Baht amount with no more than two decimal places."
      );
      return;
    }

    if (amountSatang < MINIMUM_PAYOUT_SATANG) {
      Alert.alert(
        isThai ? "จำนวนเงินไม่ถึงขั้นต่ำ" : "Minimum withdrawal is ฿100.00",
        isThai
          ? "ยอดถอนขั้นต่ำคือ ฿100.00"
          : "Request at least ฿100.00 (10,000 satang)."
      );
      return;
    }

    if (amountSatang > earningsSatang) {
      Alert.alert(
        isThai ? "ยอดเงินไม่เพียงพอ" : "Amount exceeds available earnings",
        isThai
          ? "ยอดถอนต้องไม่เกินยอดรายได้ที่ถอนได้"
          : "The withdrawal amount cannot exceed your available earnings."
      );
      return;
    }

    try {
      const payout = await requestPayoutMutation.mutateAsync({
        amountSatang,
        destinationId,
      });
      setSuccessfulPayout(payout);
      onPayoutSuccess();
    } catch (error: unknown) {
      Alert.alert(
        isThai ? "ไม่สามารถส่งคำขอถอนเงินได้" : "Unable to submit payout",
        errorMessage(
          isThai
            ? "ระบบไม่สามารถส่งคำขอถอนเงินได้ โปรดลองอีกครั้งหลังจากบริการพร้อมใช้งาน"
            : "The payout request could not be submitted. The payout service may not be deployed yet.",
          error
        )
      );
    }
  };

  const handleClose = () => {
    setSuccessfulPayout(null);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className={styles.overlay}
      >
        <View className={styles.card} testID="payout-modal">
          <View className={styles.header}>
            <Text className={styles.title}>
              {isThai ? "ถอนเงินจากรายได้" : "Withdraw Earnings"}
            </Text>
            <Pressable
              accessibilityLabel={isThai ? "ปิด" : "Close"}
              accessibilityRole="button"
              onPress={handleClose}
              className={styles.closeButton}
              testID="payout-close-button"
            >
              <Text className={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          {successfulPayout ? (
            <View className={styles.successView} testID="payout-success-view">
              <Text className={styles.successTitle}>
                {isThai ? "ส่งคำขอถอนเงินแล้ว" : "Payout request submitted"}
              </Text>
              <Text className={styles.successStatus}>
                {successfulPayout.status}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={handleClose}
                className={styles.primaryButton}
                testID="payout-done-button"
              >
                <Text className={styles.primaryButtonText}>
                  {isThai ? "เสร็จสิ้น" : "Done"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              contentContainerClassName={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <View className={styles.balanceCard}>
                <Text className={styles.balanceLabel}>
                  {isThai ? "ยอดรายได้ที่ถอนได้" : "Available earnings"}
                </Text>
                <Text
                  className={styles.balanceAmount}
                  testID="payout-available-balance"
                >
                  {formatSatang(earningsSatang, locale, "exact")}
                </Text>
                <Text className={styles.hint}>
                  {isThai
                    ? "ยอดถอนขั้นต่ำ ฿100.00"
                    : "Minimum withdrawal: ฿100.00"}
                </Text>
              </View>

              <View className={styles.section}>
                <Text className={styles.label}>
                  {isThai ? "จำนวนเงิน (บาท)" : "Withdrawal amount (THB)"}
                </Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setAmountText}
                  placeholder="100.00"
                  placeholderTextColor={colors.textMuted}
                  className={styles.input}
                  testID="payout-amount-input"
                  value={amountText}
                />
              </View>

              <View className={styles.section}>
                <View className={styles.destinationHeading}>
                  <Text className={styles.label}>
                    {isThai ? "บัญชีรับเงิน" : "Payout destination"}
                  </Text>
                  {!addingDestination && (
                    <Pressable
                      accessibilityLabel={
                        isThai
                          ? "เพิ่มบัญชีพร้อมเพย์"
                          : "Add PromptPay destination"
                      }
                      accessibilityRole="button"
                      onPress={() => setAddingDestination(true)}
                      testID="payout-add-destination-button"
                    >
                      <Text className={styles.addDestinationText}>
                        {isThai ? "+ เพิ่มพร้อมเพย์" : "+ Add PromptPay"}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {loadingDestinations ? (
                  <ActivityIndicator color={colors.primary} />
                ) : addingDestination ? (
                  <View className={styles.destinationForm}>
                    <Text className={styles.fieldLabel}>
                      {isThai ? "ชื่อเจ้าของบัญชี" : "Account holder name"}
                    </Text>
                    <TextInput
                      autoCapitalize="words"
                      onChangeText={setAccountHolderName}
                      placeholder={isThai ? "สมชาย ใจดี" : "Somchai Jaidee"}
                      placeholderTextColor={colors.textMuted}
                      className={styles.input}
                      testID="payout-holder-name-input"
                      value={accountHolderName}
                    />
                    <Text className={styles.fieldLabel}>
                      {isThai
                        ? "เบอร์โทรศัพท์หรือหมายเลขพร้อมเพย์"
                        : "PromptPay phone or account number"}
                    </Text>
                    <TextInput
                      keyboardType="number-pad"
                      onChangeText={setPromptPayAccount}
                      placeholder="0812345678"
                      placeholderTextColor={colors.textMuted}
                      className={styles.input}
                      testID="payout-account-number-input"
                      value={promptPayAccount}
                    />
                    <View className={styles.formActions}>
                      {destinations.length > 0 ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setAddingDestination(false)}
                          className={styles.secondaryButton}
                        >
                          <Text className={styles.secondaryButtonText}>
                            {isThai ? "ยกเลิก" : "Cancel"}
                          </Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        disabled={savingDestination}
                        onPress={handleCreateDestination}
                        className={styles.primaryButton}
                        testID="payout-save-destination-button"
                      >
                        {savingDestination ? (
                          <ActivityIndicator
                            color={colors.onPrimary}
                            size="small"
                          />
                        ) : (
                          <Text className={styles.primaryButtonText}>
                            {isThai ? "บันทึกพร้อมเพย์" : "Save PromptPay"}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className={styles.destinationList}>
                    {destinations.map((destination) => {
                      const selected =
                        destination.id === effectiveDestinationId;
                      return (
                        <Pressable
                          key={destination.id}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          onPress={() =>
                            setSelectedDestinationId(destination.id)
                          }
                          className={`${styles.destination} ${selected ? styles.destinationSelected : ""}`}
                          testID={`payout-destination-item-${destination.id}`}
                        >
                          <View>
                            <Text className={styles.destinationName}>
                              {destination.accountHolderName}
                            </Text>
                            <Text className={styles.destinationAccount}>
                              {destination.type}
                            </Text>
                            <Text className={styles.destinationAccount}>
                              {destination.maskedAccount}
                            </Text>
                          </View>
                          <Text className={styles.selectionMark}>
                            {selected ? "✓" : "○"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <Pressable
                accessibilityLabel={
                  isThai ? "ยืนยันการถอนเงิน" : "Submit payout"
                }
                accessibilityRole="button"
                disabled={
                  submittingPayout || savingDestination || addingDestination
                }
                onPress={handleRequestPayout}
                className={`${styles.primaryButton} ${styles.submitButton} ${
                  (submittingPayout ||
                    savingDestination ||
                    addingDestination) &&
                  styles.disabledButton
                }`}
                testID="payout-submit-button"
              >
                {submittingPayout ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text className={styles.primaryButtonText}>
                    {isThai ? "ส่งคำขอถอนเงิน" : "Submit payout"}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = {
  addDestinationText: "font-ku-medium text-ku-control text-ku-primary",
  balanceAmount: "mt-ku-xs font-ku-bold text-[28px] text-ku-text-strong",
  balanceCard:
    "rounded-[12px] border border-ku-border-accent bg-ku-surface-accent p-ku-md",
  balanceLabel: "font-ku-medium text-ku-body-small text-ku-text-secondary",
  card: "w-full max-h-[90%] overflow-hidden rounded-[20px] bg-ku-surface",
  closeButton: "h-[32px] w-[32px] items-center justify-center",
  closeButtonText: "text-[28px] leading-[28px] text-ku-text-secondary",
  content: "gap-ku-lg p-ku-lg",
  destination:
    "items-center flex-row justify-between rounded-[10px] border border-ku-border-subtle p-ku-14",
  destinationAccount:
    "mt-ku-2 font-ku-regular text-ku-meta text-ku-text-secondary",
  destinationForm: "gap-ku-sm",
  destinationHeading: "items-center flex-row justify-between",
  destinationList: "gap-ku-sm",
  destinationName: "font-ku-medium text-ku-control text-ku-text-strong",
  destinationSelected: "border-ku-primary bg-ku-surface-accent",
  disabledButton: "opacity-[0.55]",
  fieldLabel: "mt-ku-xs font-ku-medium text-ku-meta text-ku-text-secondary",
  formActions: "mt-ku-sm flex-row gap-ku-sm",
  header:
    "items-center flex-row justify-between border-b border-ku-border-subtle px-ku-lg py-ku-md",
  hint: "mt-ku-xs font-ku-regular text-ku-label text-ku-text-muted",
  input:
    "rounded-[10px] border border-ku-border-subtle px-ku-12 py-ku-11 font-ku-regular text-ku-body text-ku-text-strong",
  label: "font-ku-medium text-ku-control text-ku-text-strong",
  overlay: "flex-1 items-center justify-center bg-ku-overlay p-ku-md",
  primaryButton:
    "min-h-[46px] flex-1 items-center justify-center rounded-[10px] bg-ku-primary px-ku-md",
  primaryButtonText: "font-ku-medium text-ku-control text-ku-on-primary",
  secondaryButton:
    "min-h-[46px] flex-1 items-center justify-center rounded-[10px] border border-ku-border-subtle px-ku-md",
  secondaryButtonText: "font-ku-medium text-ku-control text-ku-text-secondary",
  section: "gap-ku-sm",
  selectionMark: "font-ku-bold text-[20px] text-ku-primary",
  submitButton: "",
  successStatus: "font-ku-medium text-ku-body-small text-ku-text-secondary",
  successTitle: "text-center font-ku-bold text-ku-title text-ku-text-strong",
  successView: "items-center gap-ku-md p-ku-md",
  title: "font-ku-bold text-ku-subtitle text-ku-text-strong",
} as const;
