import React from "react";
import type { PayoutDestination } from "@/api/WalletApi";
import { ActivityIndicator, ScrollView, Text, View } from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { SupportedLocale } from "@/locales/locale";
import { cn } from "@/tw/cn";
import { BankLogo } from "./BankLogo";
import payoutStyles from "./payoutStyles";
import { getThaiBankLabel } from "./thaiBanks";

interface StepLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** A scrolling body with the footer pinned below it, so actions stay visible. */
export function StepLayout({ children, footer }: StepLayoutProps) {
  return (
    <>
      <ScrollView
        contentContainerClassName={payoutStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? <View className={payoutStyles.footer}>{footer}</View> : null}
    </>
  );
}

export function ErrorText({
  message,
  testID,
}: {
  message: string;
  testID: string;
}) {
  return (
    <Text
      accessibilityRole="alert"
      className={payoutStyles.hintError}
      testID={testID}
    >
      {message}
    </Text>
  );
}

export function bankName(
  destination: PayoutDestination,
  locale: SupportedLocale
) {
  return destination.bankCode
    ? getThaiBankLabel(destination.bankCode, locale)
    : "";
}

export function destinationSummary(
  destination: PayoutDestination,
  locale: SupportedLocale
) {
  return `${bankName(destination, locale)} ${destination.maskedAccount ?? ""}`.trim();
}

/** Button label with an optional busy spinner, for the shared pill `Button`. */
export function ButtonContent({
  label,
  busy = false,
  variant = "primary",
}: {
  label: string;
  busy?: boolean;
  variant?: "primary" | "secondary";
}) {
  const { colors } = useAppTheme();
  const isPrimary = variant === "primary";
  return (
    <>
      {busy ? (
        <ActivityIndicator
          color={isPrimary ? colors.onPrimary : colors.primary}
          size="small"
        />
      ) : null}
      <Text
        className={cn(
          "font-ku-semibold text-ku-body",
          isPrimary ? "text-ku-on-primary" : "text-ku-primary"
        )}
        numberOfLines={1}
      >
        {label}
      </Text>
    </>
  );
}

/** Logo, bank name, masked account, and holder. Shared by every step that names the Payout Destination. */
export function DestinationIdentity({
  destination,
  locale,
  logoSize,
}: {
  destination: PayoutDestination;
  locale: SupportedLocale;
  logoSize: number;
}) {
  return (
    <>
      <BankLogo code={destination.bankCode} size={logoSize} />
      <View className="flex-1">
        <Text className={payoutStyles.cardTitle} numberOfLines={1}>
          {bankName(destination, locale)}
        </Text>
        <Text
          className={payoutStyles.note}
          numberOfLines={1}
          testID="payout-destination-masked"
        >
          {destination.maskedAccount}
        </Text>
        <Text className={payoutStyles.note} numberOfLines={1}>
          {destination.accountHolderName}
        </Text>
      </View>
    </>
  );
}
