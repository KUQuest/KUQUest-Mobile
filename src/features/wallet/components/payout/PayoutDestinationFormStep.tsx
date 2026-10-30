import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { SupportedLocale } from "@/locales/locale";
import type { WalletMessages } from "@/locales/walletMessages";
import { getLocalizedErrorMessage } from "@/utils/error";
import { useSavePayoutDestinationMutation } from "../../api/walletQueries";
import { BankLogo } from "./BankLogo";
import { ButtonContent, ErrorText, StepLayout } from "./PayoutParts";
import { getThaiBankOptions } from "./thaiBanks";

const MAX_ACCOUNT_DIGITS = 15;

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

interface PayoutDestinationFormStepProps {
  messages: WalletMessages;
  locale: SupportedLocale;
  saveMutation: ReturnType<typeof useSavePayoutDestinationMutation>;
  busy: boolean;
  onSaved: () => void;
  onCancel: () => void;
}

/** Adds a Payout Destination; the API replaces the active one. */
export function PayoutDestinationFormStep({
  messages: m,
  locale,
  saveMutation,
  busy,
  onSaved,
  onCancel,
}: PayoutDestinationFormStepProps) {
  const [form, setForm] = useState<DestinationForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [actionError, setActionError] = useState<string | null>(null);

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
      onSaved();
    } catch (err: unknown) {
      setActionError(
        getLocalizedErrorMessage(err, locale, {
          fallback: m.destinationSaveError,
        })
      );
    }
  };

  return (
    <StepLayout
      footer={
        <>
          <Button
            accessibilityLabel={m.destinationSave}
            accessibilityState={{ disabled: busy, busy }}
            disabled={busy}
            onPress={() => void handleSave()}
            testID="payout-destination-save-btn"
          >
            <ButtonContent
              busy={busy}
              label={
                saveMutation.isPending ? m.destinationSaving : m.destinationSave
              }
            />
          </Button>
          <Button
            accessibilityLabel={m.destinationBackToDetails}
            disabled={busy}
            onPress={onCancel}
            testID="payout-destination-cancel-edit-btn"
            variant="secondary"
          >
            <ButtonContent
              label={m.destinationBackToDetails}
              variant="secondary"
            />
          </Button>
        </>
      }
    >
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
      {actionError ? (
        <ErrorText
          message={actionError}
          testID="payout-destination-action-error"
        />
      ) : null}
    </StepLayout>
  );
}
