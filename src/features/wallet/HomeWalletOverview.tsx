import React, { useState } from "react";
import { Alert } from "react-native";
import { ActivityIndicator, Text, TouchableOpacity, View } from "@/tw";
import {
  ArrowRightLeft,
  ArrowUpRight,
  History,
  Plus,
  RefreshCw,
  WalletCards,
} from "lucide-react-native";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/locale";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import {
  useConvertEarningsMutation,
  useWalletQuery,
} from "./api/walletQueries";
import { TransactionHistoryModal } from "./TransactionHistoryModal";
import { WalletPaymentModal } from "./WalletPaymentModal";
import { checkConversionAmount, toCompartments } from "./walletModule";
import { PayoutModal } from "./PayoutModal";
import { walletStyles as s } from "./walletStyles";

interface HomeWalletOverviewProps {
  locale: SupportedLocale;
}

export function HomeWalletOverview({ locale }: HomeWalletOverviewProps) {
  const m = walletMessages[locale];
  const walletQuery = useWalletQuery();
  const balances = walletQuery.data ?? null;
  const loading = walletQuery.isPending || walletQuery.isRefetching;
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const convertMutation = useConvertEarningsMutation();
  const converting = convertMutation.isPending;

  const refreshWallet = () => {
    void walletQuery.refetch();
  };

  const handleRefresh = refreshWallet;

  const handleConvertEarnings = () => {
    if (!balances || balances.earningsBalanceSatang <= 0 || converting) return;
    Alert.alert(m.convertEarnings, m.convertPrompt, [
      { text: m.cancel, style: "cancel" },
      {
        text: m.confirm,
        onPress: async () => {
          const compartments = toCompartments(balances);
          const result = checkConversionAmount(
            balances.earningsBalanceSatang,
            compartments
          );
          if (!result.ok) {
            Alert.alert(m.convertEarnings, m.convertError);
            return;
          }
          try {
            await convertMutation.mutateAsync(balances.earningsBalanceSatang);
            Alert.alert(m.convertEarnings, m.convertSuccess);
          } catch (err: unknown) {
            Alert.alert(
              m.convertEarnings,
              err instanceof Error ? err.message : m.convertError
            );
          }
        },
      },
    ]);
  };

  return (
    <View
      className={`${s.card} border-ku-border-subtle bg-ku-surface`}
      testID="home-wallet-overview"
    >
      {/* Header */}
      <View className={s.headerRow}>
        <View className={s.headerLeading}>
          <View className={`${s.iconBox} bg-ku-surface-accent`}>
            <WalletCards color={colors.primary} size={20} strokeWidth={2.2} />
          </View>
          <View className={s.headerTextWrap}>
            <Text className={`${s.headerTitle} text-ku-text-strong`}>
              {m.walletTitle}
            </Text>
            <Text className={`${s.headerSubtitle} text-ku-text-secondary`}>
              {m.walletSubtitle}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          accessibilityLabel={m.refresh}
          accessibilityRole="button"
          className={`${s.refreshButton} bg-ku-surface-muted`}
          disabled={loading}
          onPress={handleRefresh}
          testID="wallet-refresh-button"
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <RefreshCw color={colors.textSecondary} size={17} />
          )}
        </TouchableOpacity>
      </View>

      {/* Primary Balance: Spending Balance */}
      <View
        className={`${s.balanceSection} border border-ku-border-accent bg-ku-surface-accent`}
      >
        <Text className={`${s.balanceLabel} text-ku-primary-dark`}>
          {m.spendingBalance}
        </Text>
        <Text
          className={`${s.spendingAmount} text-ku-primary-dark`}
          testID="wallet-spending-balance"
        >
          {balances
            ? formatSatang(balances.spendingBalanceSatang, locale, "exact")
            : "฿0.00"}
        </Text>
      </View>

      {/* Sub-compartments: Earnings, In Escrow, Reserved for Payouts */}
      <View className={s.compartmentRow}>
        <View className={`${s.compartmentCol} bg-ku-surface-muted`}>
          <Text className={`${s.compartmentLabel} text-ku-text-muted`}>
            {m.earningsBalance}
          </Text>
          <Text
            className={`${s.compartmentValue} text-ku-text-strong`}
            testID="wallet-earnings-balance"
          >
            {balances
              ? formatSatang(balances.earningsBalanceSatang, locale, "exact")
              : "฿0.00"}
          </Text>
        </View>

        <View className={`${s.compartmentCol} bg-ku-surface-muted`}>
          <Text className={`${s.compartmentLabel} text-ku-text-muted`}>
            {m.escrowReserved}
          </Text>
          <Text
            className={`${s.compartmentValue} text-ku-text-strong`}
            testID="wallet-escrow-balance"
          >
            {balances
              ? formatSatang(balances.fundingReservedSatang, locale, "exact")
              : "฿0.00"}
          </Text>
        </View>

        <View className={`${s.compartmentCol} bg-ku-surface-muted`}>
          <Text className={`${s.compartmentLabel} text-ku-text-muted`}>
            {m.payoutReserved}
          </Text>
          <Text
            className={`${s.compartmentValue} text-ku-text-strong`}
            testID="wallet-payout-balance"
          >
            {balances
              ? formatSatang(balances.reservedForPayoutsSatang, locale, "exact")
              : "฿0.00"}
          </Text>
        </View>
      </View>

      {/* Actions Row */}
      <View className={s.actionsRow}>
        <TouchableOpacity
          accessibilityLabel={m.topUp}
          accessibilityRole="button"
          className={`${s.actionButtonPrimary} bg-ku-primary`}
          onPress={() => setPaymentModalOpen(true)}
          testID="wallet-topup-button"
        >
          <Plus color={colors.onPrimary} size={17} strokeWidth={2.4} />
          <Text className={`${s.actionButtonLabelPrimary} text-ku-on-primary`}>
            {m.topUp}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel={locale === "th" ? "ถอนเงิน" : "Withdraw"}
          accessibilityRole="button"
          className={`${s.actionButtonSecondary} border-ku-border-accent bg-ku-surface`}
          onPress={() => setPayoutModalOpen(true)}
          testID="wallet-withdraw-button"
        >
          <ArrowUpRight color={colors.primary} size={15} />
          <Text className={`${s.actionButtonLabelSecondary} text-ku-primary`}>
            {locale === "th" ? "ถอนเงิน" : "Withdraw"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel={m.transactions}
          accessibilityRole="button"
          className={`${s.actionButtonSecondary} border-ku-border-accent bg-ku-surface`}
          onPress={() => setHistoryModalOpen(true)}
          testID="wallet-history-button"
        >
          <History color={colors.textStrong} size={17} />
          <Text
            className={`${s.actionButtonLabelSecondary} text-ku-text-strong`}
          >
            {m.transactions}
          </Text>
        </TouchableOpacity>

        {balances && balances.earningsBalanceSatang > 0 ? (
          <TouchableOpacity
            accessibilityLabel={m.convertEarnings}
            accessibilityRole="button"
            className={`${s.actionButtonSecondary} border-ku-border-accent bg-ku-surface`}
            disabled={converting}
            onPress={handleConvertEarnings}
            testID="wallet-convert-button"
          >
            {converting ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <ArrowRightLeft color={colors.primary} size={15} />
                <Text
                  className={`${s.actionButtonLabelSecondary} text-ku-primary`}
                >
                  {m.convertEarnings}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Modals */}
      <WalletPaymentModal
        locale={locale}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={refreshWallet}
        visible={paymentModalOpen}
      />

      <TransactionHistoryModal
        locale={locale}
        onClose={() => setHistoryModalOpen(false)}
        visible={historyModalOpen}
      />

      <PayoutModal
        earningsSatang={balances?.earningsBalanceSatang ?? 0}
        locale={locale}
        onClose={() => setPayoutModalOpen(false)}
        onPayoutSuccess={refreshWallet}
        visible={payoutModalOpen}
      />
    </View>
  );
}
