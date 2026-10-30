import React, { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { PayoutDestination } from "@/api/WalletApi";
import { Button } from "@/components/ui/Button";
import { showConfirmModal } from "@/components/ui/SweetAlert";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { SupportedLocale } from "@/locales/locale";
import type { WalletMessages } from "@/locales/walletMessages";
import { ActivityIndicator, Text, TouchableOpacity, View } from "@/tw";
import { getLocalizedErrorMessage } from "@/utils/error";
import { useRetirePayoutDestinationMutation } from "../../api/walletQueries";
import {
  ButtonContent,
  DestinationIdentity,
  ErrorText,
  StepLayout,
} from "./PayoutParts";
import payoutStyles from "./payoutStyles";

interface PayoutDestinationStepProps {
  messages: WalletMessages;
  locale: SupportedLocale;
  destinationQuery: UseQueryResult<PayoutDestination | null>;
  retireMutation: ReturnType<typeof useRetirePayoutDestinationMutation>;
  busy: boolean;
  onReplace: () => void;
  onAdd: () => void;
}

/** The active Payout Destination, shown masked, with replace and remove. */
export function PayoutDestinationStep({
  messages: m,
  locale,
  destinationQuery,
  retireMutation,
  busy,
  onReplace,
  onAdd,
}: PayoutDestinationStepProps) {
  const { colors } = useAppTheme();
  const [actionError, setActionError] = useState<string | null>(null);
  const destination = destinationQuery.data ?? null;
  const canAdd =
    !destinationQuery.isPending && !destinationQuery.isError && !destination;

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

  const renderBody = () => {
    if (destinationQuery.isPending) {
      return (
        <View
          accessibilityLabel={m.payoutDestinationLoading}
          accessibilityLiveRegion="polite"
          className={payoutStyles.centered}
          testID="payout-destination-loading"
        >
          <ActivityIndicator color={colors.primary} size="small" />
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
          <Button
            accessibilityLabel={m.retry}
            onPress={() => void destinationQuery.refetch()}
            testID="payout-destination-retry"
            variant="secondary"
          >
            <ButtonContent label={m.retry} variant="secondary" />
          </Button>
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
      <View
        className={payoutStyles.destinationRow}
        testID="payout-destination-active"
      >
        <DestinationIdentity
          destination={destination}
          locale={locale}
          logoSize={48}
        />
      </View>
    );
  };

  return (
    <StepLayout
      footer={
        destination ? (
          <>
            <Button
              accessibilityLabel={m.destinationReplace}
              disabled={busy}
              onPress={onReplace}
              testID="payout-destination-replace-btn"
              variant="secondary"
            >
              <ButtonContent label={m.destinationReplace} variant="secondary" />
            </Button>
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
          <Button
            accessibilityLabel={m.destinationAdd}
            onPress={onAdd}
            testID="payout-destination-add-btn"
          >
            <ButtonContent label={m.destinationAdd} />
          </Button>
        ) : null
      }
    >
      {renderBody()}
      {actionError ? (
        <ErrorText
          message={actionError}
          testID="payout-destination-action-error"
        />
      ) : null}
    </StepLayout>
  );
}
