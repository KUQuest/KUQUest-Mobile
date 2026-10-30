import React, { useState } from "react";
import { Modal, Platform, StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "@/tw";
import { Landmark, X } from "lucide-react-native";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { showConfirmModal } from "@/components/ui/SweetAlert";
import { useLocale } from "@/features/preferences/localeStore";
import type { WalletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { cn } from "@/tw/cn";
import { getLocalizedErrorMessage } from "@/utils/error";
import {
  usePayoutDestinationQuery,
  useRetirePayoutDestinationMutation,
  useSavePayoutDestinationMutation,
} from "../../api/walletQueries";
import { BankLogo } from "./BankLogo";
import payoutStyles from "./payoutStyles";
import { getThaiBankLabel, getThaiBankOptions } from "./thaiBanks";

const MAX_ACCOUNT_DIGITS = 15;

interface PayoutDestinationModalProps {
  visible: boolean;
  messages: WalletMessages;
  onClose: () => void;
}

interface DestinationForm {
  givenName: string;
  surname: string;
  accountHolderName: string;
  bankCode: string;
  accountNumber: string;
}

const EMPTY_FORM: DestinationForm = {
  givenName: "",
  surname: "",
  accountHolderName: "",
  bankCode: "",
  accountNumber: "",
};

type FormErrors = Partial<Record<keyof DestinationForm, string>>;

/**
 * Views, adds (the API replaces the active destination), and retires the
 * Student's active Thai bank Payout Destination. Only masked values are shown.
 */
export function PayoutDestinationModal({
  visible,
  messages: m,
  onClose,
}: PayoutDestinationModalProps) {
  const { locale } = useLocale();
  const destinationQuery = usePayoutDestinationQuery(visible);
  const saveMutation = useSavePayoutDestinationMutation();
  const retireMutation = useRetirePayoutDestinationMutation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DestinationForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const destination = destinationQuery.data ?? null;
  const busy = saveMutation.isPending || retireMutation.isPending;

  const reset = () => {
    setEditing(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setActionError(null);
  };
  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const setField = (field: keyof DestinationForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setActionError(null);
  };

  const handleSave = async () => {
    if (busy) return;
    const trimmed: DestinationForm = {
      givenName: form.givenName.trim(),
      surname: form.surname.trim(),
      accountHolderName: form.accountHolderName.trim(),
      bankCode: form.bankCode,
      accountNumber: form.accountNumber,
    };
    const nextErrors: FormErrors = {};
    for (const field of Object.keys(trimmed) as (keyof DestinationForm)[]) {
      if (!trimmed[field]) nextErrors[field] = m.destinationFieldRequired;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setActionError(null);
    try {
      await saveMutation.mutateAsync({
        ...trimmed,
        recipientType: "SELF",
        relationship: "SELF",
        accountCountry: "TH",
        accountCurrency: "THB",
        routingType: "BANK_ACCOUNT",
      });
      reset();
    } catch (err: unknown) {
      setActionError(
        getLocalizedErrorMessage(err, locale, {
          fallback: m.destinationSaveError,
        })
      );
    }
  };

  const retire = async () => {
    setActionError(null);
    try {
      await retireMutation.mutateAsync();
    } catch (err: unknown) {
      setActionError(
        getLocalizedErrorMessage(err, locale, {
          fallback: m.destinationRetireError,
        })
      );
    }
  };
  const handleRetire = () => {
    if (busy) return;
    showConfirmModal({
      title: m.destinationRetireConfirmTitle,
      message: m.destinationRetireConfirmDesc,
      confirmLabel: m.destinationRetire,
      cancelLabel: m.cancel,
      onConfirm: () => void retire(),
    });
  };

  const renderForm = () => (
    <View className={payoutStyles.card} testID="payout-destination-form">
      <Input
        autoCapitalize="words"
        editable={!busy}
        error={errors.givenName}
        label={m.destinationGivenNameLabel}
        onChangeText={setField("givenName")}
        testID="payout-destination-given-name"
        textContentType="givenName"
        value={form.givenName}
      />
      <Input
        autoCapitalize="words"
        editable={!busy}
        error={errors.surname}
        label={m.destinationSurnameLabel}
        onChangeText={setField("surname")}
        testID="payout-destination-surname"
        textContentType="familyName"
        value={form.surname}
      />
      <Input
        autoCapitalize="words"
        editable={!busy}
        error={errors.accountHolderName}
        label={m.destinationHolderNameLabel}
        onChangeText={setField("accountHolderName")}
        testID="payout-destination-holder-name"
        value={form.accountHolderName}
      />
      <Select
        clearSearchLabel={m.clearSearch}
        closeLabel={m.closeButton}
        disabled={busy}
        error={errors.bankCode}
        label={m.destinationBankLabel}
        noResultsMessage={m.destinationBankNoResults}
        onValueChange={setField("bankCode")}
        options={getThaiBankOptions(locale).map((option) => ({
          ...option,
          icon: <BankLogo code={option.value} size={28} />,
        }))}
        placeholder={m.destinationBankPlaceholder}
        searchable
        searchPlaceholder={m.destinationBankSearch}
        value={form.bankCode}
      />
      <Input
        autoComplete="off"
        autoCorrect={false}
        editable={!busy}
        error={errors.accountNumber}
        inputMode="numeric"
        keyboardType="number-pad"
        label={m.destinationAccountNumberLabel}
        maxLength={MAX_ACCOUNT_DIGITS}
        onChangeText={(value) =>
          setField("accountNumber")(value.replace(/\D/g, ""))
        }
        testID="payout-destination-account-number"
        value={form.accountNumber}
      />
    </View>
  );

  const renderDestination = () => {
    if (destinationQuery.isPending) {
      return (
        <View
          accessibilityLabel={m.payoutDestinationLoading}
          accessibilityLiveRegion="polite"
          className={payoutStyles.centered}
          testID="payout-destination-loading"
        >
          <ActivityIndicator color={colors.worker} size="small" />
        </View>
      );
    }
    if (destinationQuery.isError) {
      return (
        <View
          accessibilityRole="alert"
          className={payoutStyles.card}
          testID="payout-destination-error"
        >
          <Text className={payoutStyles.hintError}>
            {getLocalizedErrorMessage(destinationQuery.error, locale, {
              fallback: m.destinationLoadError,
            })}
          </Text>
          <TouchableOpacity
            accessibilityLabel={m.retry}
            accessibilityRole="button"
            className={payoutStyles.secondaryBtn}
            onPress={() => void destinationQuery.refetch()}
            testID="payout-destination-retry"
          >
            <Text className={payoutStyles.secondaryBtnText}>{m.retry}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!destination) {
      return (
        <View className={payoutStyles.card} testID="payout-destination-empty">
          <Text className={payoutStyles.cardTitle}>
            {m.destinationEmptyTitle}
          </Text>
          <Text className={payoutStyles.note}>{m.destinationEmptyDesc}</Text>
        </View>
      );
    }
    return (
      <View className={payoutStyles.card} testID="payout-destination-active">
        <Text accessibilityRole="header" className={payoutStyles.cardTitle}>
          {m.destinationActiveTitle}
        </Text>
        <View className={payoutStyles.row}>
          <Text className={payoutStyles.rowLabel}>
            {m.destinationBankLabel}
          </Text>
          <View className="flex-1 flex-row items-center justify-end gap-ku-sm">
            <BankLogo code={destination.bankCode} size={24} />
            <Text className={payoutStyles.rowValue}>
              {destination.bankCode
                ? getThaiBankLabel(destination.bankCode, locale)
                : "-"}
            </Text>
          </View>
        </View>
        <View className={payoutStyles.row}>
          <Text className={payoutStyles.rowLabel}>
            {m.destinationHolderLabel}
          </Text>
          <Text className={payoutStyles.rowValue}>
            {destination.accountHolderName}
          </Text>
        </View>
        <View className={payoutStyles.row}>
          <Text className={payoutStyles.rowLabel}>
            {m.destinationAccountLabel}
          </Text>
          <Text
            className={payoutStyles.rowValue}
            testID="payout-destination-masked"
          >
            {destination.maskedAccount}
          </Text>
        </View>
      </View>
    );
  };

  const showForm = editing;
  const canAdd =
    !destinationQuery.isPending && !destinationQuery.isError && !destination;

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <View className={payoutStyles.modalOverlay}>
        <Pressable
          accessibilityLabel={m.closeButton}
          onPress={handleClose}
          style={StyleSheet.absoluteFill}
          testID="payout-destination-backdrop"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="w-full"
        >
          <View
            accessibilityViewIsModal
            className={payoutStyles.modalCard}
            style={modalCardShadow}
            testID="payout-destination-modal"
          >
            <View className={payoutStyles.header}>
              <Landmark color={colors.workerDeep} size={20} strokeWidth={2.2} />
              <Text
                accessibilityRole="header"
                className={payoutStyles.headerTitle}
              >
                {m.destinationTitle}
              </Text>
              <TouchableOpacity
                accessibilityLabel={m.closeButton}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                className={payoutStyles.closeBtn}
                disabled={busy}
                onPress={handleClose}
                testID="payout-destination-close-btn"
              >
                <X color={colors.textSecondary} size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerClassName={payoutStyles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text className={payoutStyles.desc}>{m.destinationDesc}</Text>

              {showForm ? renderForm() : renderDestination()}

              {actionError ? (
                <Text
                  accessibilityRole="alert"
                  className={payoutStyles.hintError}
                  testID="payout-destination-action-error"
                >
                  {actionError}
                </Text>
              ) : null}

              <View className={payoutStyles.actionRow}>
                {showForm ? (
                  <>
                    <TouchableOpacity
                      accessibilityLabel={m.destinationSave}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: busy, busy }}
                      className={cn(
                        payoutStyles.primaryBtn,
                        busy && payoutStyles.primaryBtnDisabled
                      )}
                      disabled={busy}
                      onPress={() => void handleSave()}
                      testID="payout-destination-save-btn"
                    >
                      {busy ? (
                        <ActivityIndicator
                          color={colors.onWorker}
                          size="small"
                        />
                      ) : null}
                      <Text className={payoutStyles.primaryBtnText}>
                        {saveMutation.isPending
                          ? m.destinationSaving
                          : m.destinationSave}
                      </Text>
                    </TouchableOpacity>
                    {
                      <TouchableOpacity
                        accessibilityLabel={m.destinationBackToDetails}
                        accessibilityRole="button"
                        className={payoutStyles.secondaryBtn}
                        disabled={busy}
                        onPress={reset}
                        testID="payout-destination-cancel-edit-btn"
                      >
                        <Text className={payoutStyles.secondaryBtnText}>
                          {m.destinationBackToDetails}
                        </Text>
                      </TouchableOpacity>
                    }
                  </>
                ) : destination ? (
                  <>
                    <TouchableOpacity
                      accessibilityLabel={m.destinationReplace}
                      accessibilityRole="button"
                      className={payoutStyles.secondaryBtn}
                      disabled={busy}
                      onPress={() => setEditing(true)}
                      testID="payout-destination-replace-btn"
                    >
                      <Text className={payoutStyles.secondaryBtnText}>
                        {m.destinationReplace}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityLabel={m.destinationRetire}
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled: busy,
                        busy: retireMutation.isPending,
                      }}
                      className={payoutStyles.dangerBtn}
                      disabled={busy}
                      onPress={handleRetire}
                      testID="payout-destination-retire-btn"
                    >
                      <Text className={payoutStyles.dangerBtnText}>
                        {retireMutation.isPending
                          ? m.destinationRetiring
                          : m.destinationRetire}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : canAdd ? (
                  <TouchableOpacity
                    accessibilityLabel={m.destinationAdd}
                    accessibilityRole="button"
                    className={payoutStyles.primaryBtn}
                    onPress={() => setEditing(true)}
                    testID="payout-destination-add-btn"
                  >
                    <Text className={payoutStyles.primaryBtnText}>
                      {m.destinationAdd}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const modalCardShadow = {
  elevation: 24,
  shadowColor: colors.black,
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.2,
  shadowRadius: 12,
} satisfies ViewStyle;
