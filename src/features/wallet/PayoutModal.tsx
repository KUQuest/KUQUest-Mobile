import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  walletApi,
  type PayoutDestination,
  type PayoutRecord,
} from "@/api/WalletApi";
import type { SupportedLocale } from "@/locales/LocaleProvider";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

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

function formatBaht(satang: number): string {
  return (satang / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
  const [destinations, setDestinations] = useState<PayoutDestination[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [addingDestination, setAddingDestination] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [promptPayAccount, setPromptPayAccount] = useState("");
  const [savingDestination, setSavingDestination] = useState(false);
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [successfulPayout, setSuccessfulPayout] = useState<PayoutRecord | null>(
    null
  );

  const amountSatang = parseAmountSatang(amountText);
  /* eslint-disable react-hooks/set-state-in-effect -- resetting payout modal state on open/close */
  useEffect(() => {
    if (!visible) {
      setAccountHolderName("");
      setPromptPayAccount("");
      setSuccessfulPayout(null);
      return;
    }

    let active = true;
    setLoadingDestinations(true);
    setAddingDestination(false);
    setSelectedDestinationId(null);
    setSuccessfulPayout(null);

    walletApi
      .listPayoutDestinations()
      .then((loadedDestinations) => {
        if (!active) return;

        setDestinations(loadedDestinations);
        const defaultDestination =
          loadedDestinations.find((destination) => destination.isDefault) ??
          loadedDestinations[0];
        setSelectedDestinationId(defaultDestination?.id ?? null);
        setAddingDestination(loadedDestinations.length === 0);
      })
      .catch((error: unknown) => {
        if (!active) return;
        Alert.alert(
          isThai
            ? "ไม่สามารถโหลดบัญชีรับเงินได้"
            : "Unable to load destinations",
          errorMessage(
            isThai
              ? "ระบบไม่สามารถโหลดบัญชีรับเงินได้ โปรดลองอีกครั้งหลังจากบริการพร้อมใช้งาน"
              : "Payout destinations could not be loaded. The payout service may not be deployed yet.",
            error
          )
        );
      })
      .finally(() => {
        if (active) setLoadingDestinations(false);
      });

    return () => {
      active = false;
    };
  }, [isThai, visible]);
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

    setSavingDestination(true);
    try {
      const names = holderName.split(/\s+/);
      const givenName = names[0] || "Member";
      const surname = names.slice(1).join(" ") || "Student";
      const destination = await walletApi.createPayoutDestination({
        type: "PROMPTPAY",
        routingType: "PROMPTPAY",
        givenName,
        surname,
        accountHolderName: holderName,
        bankCode: "PROMPTPAY",
        accountNumber,
      });
      setDestinations((current) => [...current, destination]);
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
    } finally {
      setSavingDestination(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!selectedDestinationId) {
      Alert.alert(
        isThai ? "กรุณาเลือกบัญชีรับเงิน" : "Select a payout destination",
        isThai
          ? "กรุณาเลือกบัญชีรับเงินก่อนส่งคำขอถอนเงิน"
          : "Choose where to receive this payout before submitting."
      );
      return;
    }

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

    setSubmittingPayout(true);
    try {
      let payout: PayoutRecord;
      if (
        typeof walletApi.quotePayout === "function" &&
        typeof walletApi.createPayout === "function"
      ) {
        try {
          const quote = await walletApi.quotePayout(amountSatang);
          payout = await walletApi.createPayout(quote.id);
        } catch {
          payout = await walletApi.requestPayout(
            amountSatang,
            selectedDestinationId
          );
        }
      } else {
        payout = await walletApi.requestPayout(
          amountSatang,
          selectedDestinationId
        );
      }
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
    } finally {
      setSubmittingPayout(false);
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
        style={styles.overlay}
      >
        <View style={styles.card} testID="payout-modal">
          <View style={styles.header}>
            <Text style={styles.title}>
              {isThai ? "ถอนเงินจากรายได้" : "Withdraw Earnings"}
            </Text>
            <Pressable
              accessibilityLabel={isThai ? "ปิด" : "Close"}
              accessibilityRole="button"
              onPress={handleClose}
              style={styles.closeButton}
              testID="payout-close-button"
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          {successfulPayout ? (
            <View style={styles.successView} testID="payout-success-view">
              <Text style={styles.successTitle}>
                {isThai ? "ส่งคำขอถอนเงินแล้ว" : "Payout request submitted"}
              </Text>
              <Text style={styles.successStatus}>
                {successfulPayout.status}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={handleClose}
                style={styles.primaryButton}
                testID="payout-done-button"
              >
                <Text style={styles.primaryButtonText}>
                  {isThai ? "เสร็จสิ้น" : "Done"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>
                  {isThai ? "ยอดรายได้ที่ถอนได้" : "Available earnings"}
                </Text>
                <Text
                  style={styles.balanceAmount}
                  testID="payout-available-balance"
                >
                  ฿{formatBaht(earningsSatang)}
                </Text>
                <Text style={styles.hint}>
                  {isThai
                    ? "ยอดถอนขั้นต่ำ ฿100.00"
                    : "Minimum withdrawal: ฿100.00"}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>
                  {isThai ? "จำนวนเงิน (บาท)" : "Withdrawal amount (THB)"}
                </Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setAmountText}
                  placeholder="100.00"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  testID="payout-amount-input"
                  value={amountText}
                />
              </View>

              <View style={styles.section}>
                <View style={styles.destinationHeading}>
                  <Text style={styles.label}>
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
                      <Text style={styles.addDestinationText}>
                        {isThai ? "+ เพิ่มพร้อมเพย์" : "+ Add PromptPay"}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {loadingDestinations ? (
                  <ActivityIndicator color={colors.primary} />
                ) : addingDestination ? (
                  <View style={styles.destinationForm}>
                    <Text style={styles.fieldLabel}>
                      {isThai ? "ชื่อเจ้าของบัญชี" : "Account holder name"}
                    </Text>
                    <TextInput
                      autoCapitalize="words"
                      onChangeText={setAccountHolderName}
                      placeholder={isThai ? "สมชาย ใจดี" : "Somchai Jaidee"}
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      testID="payout-holder-name-input"
                      value={accountHolderName}
                    />
                    <Text style={styles.fieldLabel}>
                      {isThai
                        ? "เบอร์โทรศัพท์หรือหมายเลขพร้อมเพย์"
                        : "PromptPay phone or account number"}
                    </Text>
                    <TextInput
                      keyboardType="number-pad"
                      onChangeText={setPromptPayAccount}
                      placeholder="0812345678"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      testID="payout-account-number-input"
                      value={promptPayAccount}
                    />
                    <View style={styles.formActions}>
                      {destinations.length > 0 ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setAddingDestination(false)}
                          style={styles.secondaryButton}
                        >
                          <Text style={styles.secondaryButtonText}>
                            {isThai ? "ยกเลิก" : "Cancel"}
                          </Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        disabled={savingDestination}
                        onPress={handleCreateDestination}
                        style={styles.primaryButton}
                        testID="payout-save-destination-button"
                      >
                        {savingDestination ? (
                          <ActivityIndicator
                            color={colors.white}
                            size="small"
                          />
                        ) : (
                          <Text style={styles.primaryButtonText}>
                            {isThai ? "บันทึกพร้อมเพย์" : "Save PromptPay"}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.destinationList}>
                    {destinations.map((destination) => {
                      const selected = destination.id === selectedDestinationId;
                      return (
                        <Pressable
                          key={destination.id}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          onPress={() =>
                            setSelectedDestinationId(destination.id)
                          }
                          style={[
                            styles.destination,
                            selected && styles.destinationSelected,
                          ]}
                          testID={`payout-destination-item-${destination.id}`}
                        >
                          <View>
                            <Text style={styles.destinationName}>
                              {destination.accountHolderName}
                            </Text>
                            <Text style={styles.destinationAccount}>
                              {destination.type}
                            </Text>
                            <Text style={styles.destinationAccount}>
                              {destination.maskedAccount}
                            </Text>
                          </View>
                          <Text style={styles.selectionMark}>
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
                style={[
                  styles.primaryButton,
                  styles.submitButton,
                  (submittingPayout ||
                    savingDestination ||
                    addingDestination) &&
                    styles.disabledButton,
                ]}
                testID="payout-submit-button"
              >
                {submittingPayout ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>
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

const styles = StyleSheet.create({
  addDestinationText: {
    color: colors.primary,
    fontFamily: fontFamily.medium,
    fontSize: 14,
  },
  balanceAmount: {
    color: colors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: 28,
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: colors.surfaceAccent,
    borderColor: colors.borderAccent,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  balanceLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    maxHeight: "90%",
    overflow: "hidden",
    width: "100%",
  },
  closeButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: 28,
    lineHeight: 28,
  },
  content: {
    gap: 20,
    padding: 20,
  },
  destination: {
    alignItems: "center",
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },
  destinationAccount: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    marginTop: 2,
  },
  destinationForm: {
    gap: 8,
  },
  destinationHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  destinationList: {
    gap: 8,
  },
  destinationName: {
    color: colors.textStrong,
    fontFamily: fontFamily.medium,
    fontSize: 15,
  },
  destinationSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAccent,
  },
  disabledButton: {
    opacity: 0.55,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    marginTop: 4,
  },
  formActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.borderSubtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.textStrong,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  label: {
    color: colors.textStrong,
    fontFamily: fontFamily.medium,
    fontSize: 15,
  },
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: fontFamily.medium,
    fontSize: 15,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: 15,
  },
  section: {
    gap: 8,
  },
  selectionMark: {
    color: colors.primary,
    fontFamily: fontFamily.bold,
    fontSize: 20,
  },
  submitButton: {
    flex: undefined,
  },
  successStatus: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: 14,
  },
  successTitle: {
    color: colors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: 20,
    textAlign: "center",
  },
  successView: {
    alignItems: "center",
    gap: 16,
    padding: 20,
  },
  title: {
    color: colors.textStrong,
    fontFamily: fontFamily.bold,
    fontSize: 18,
  },
});
