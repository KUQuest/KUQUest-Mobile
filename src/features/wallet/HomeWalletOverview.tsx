import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowRightLeft,
  ArrowUpRight,
  History,
  Plus,
  RefreshCw,
  WalletCards,
} from "lucide-react-native";
import { walletApi, type WalletBalances } from "@/api/WalletApi";
import { formatSatang } from "@/domain/satang";
import type { SupportedLocale } from "@/locales/LocaleProvider";
import { walletMessages } from "@/locales/walletMessages";
import { colors } from "@/theme/colors";
import { TransactionHistoryModal } from "./TransactionHistoryModal";
import { WalletPaymentModal } from "./WalletPaymentModal";
import { convertEarnings, toCompartments } from "./walletModule";
import { PayoutModal } from "./PayoutModal";
import { walletStyles as s } from "./walletStyles";

interface HomeWalletOverviewProps {
  locale: SupportedLocale;
  onBalanceChange?: (balances: WalletBalances) => void;
}

export function HomeWalletOverview({
  locale,
  onBalanceChange,
}: HomeWalletOverviewProps) {
  const m = walletMessages[locale];
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    walletApi
      .getWallet()
      .then((data) => {
        if (active) {
          setBalances(data);
          onBalanceChange?.(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onBalanceChange, refreshIndex]);

  const refreshWallet = () => {
    setLoading(true);
    setRefreshIndex((idx) => idx + 1);
  };

  const handleRefresh = refreshWallet;

  const handleConvertEarnings = () => {
    if (!balances || balances.earningsBalanceSatang <= 0 || converting) return;
    Alert.alert(m.convertEarnings, m.convertPrompt, [
      { text: m.cancel, style: "cancel" },
      {
        text: m.confirm,
        onPress: async () => {
          setConverting(true);
          try {
            const compartments = toCompartments(balances);
            const result = await convertEarnings(
              balances.earningsBalanceSatang,
              compartments
            );
            if (!result.ok) {
              Alert.alert(m.convertEarnings, m.convertError);
              return;
            }
            Alert.alert(m.convertEarnings, m.convertSuccess);
            setRefreshIndex((idx) => idx + 1);
          } catch (err: unknown) {
            Alert.alert(
              m.convertEarnings,
              err instanceof Error ? err.message : m.convertError
            );
          } finally {
            setConverting(false);
          }
        },
      },
    ]);
  };

  return (
    <View
      style={[
        s.card,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
      testID="home-wallet-overview"
    >
      {/* Header */}
      <View style={s.headerRow}>
        <View style={s.headerLeading}>
          <View style={[s.iconBox, { backgroundColor: colors.surfaceAccent }]}>
            <WalletCards color={colors.primary} size={20} strokeWidth={2.2} />
          </View>
          <View style={s.headerTextWrap}>
            <Text style={[s.headerTitle, { color: colors.textStrong }]}>
              {m.walletTitle}
            </Text>
            <Text style={[s.headerSubtitle, { color: colors.textSecondary }]}>
              {m.walletSubtitle}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          accessibilityLabel={m.refresh}
          accessibilityRole="button"
          disabled={loading}
          onPress={handleRefresh}
          style={[s.refreshButton, { backgroundColor: colors.surfaceMuted }]}
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
        style={[
          s.balanceSection,
          {
            backgroundColor: colors.surfaceAccent,
            borderColor: colors.borderAccent,
            borderWidth: 1,
          },
        ]}
      >
        <Text style={[s.balanceLabel, { color: colors.primaryDeep }]}>
          {m.spendingBalance}
        </Text>
        <Text
          style={[s.spendingAmount, { color: colors.primaryDeep }]}
          testID="wallet-spending-balance"
        >
          {balances
            ? formatSatang(balances.spendingBalanceSatang, locale, "exact")
            : "฿0.00"}
        </Text>
      </View>

      {/* Sub-compartments: Earnings, In Escrow, Reserved for Payouts */}
      <View style={s.compartmentRow}>
        <View
          style={[s.compartmentCol, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={[s.compartmentLabel, { color: colors.textMuted }]}>
            {m.earningsBalance}
          </Text>
          <Text
            style={[s.compartmentValue, { color: colors.textStrong }]}
            testID="wallet-earnings-balance"
          >
            {balances
              ? formatSatang(balances.earningsBalanceSatang, locale, "exact")
              : "฿0.00"}
          </Text>
        </View>

        <View
          style={[s.compartmentCol, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={[s.compartmentLabel, { color: colors.textMuted }]}>
            {m.escrowReserved}
          </Text>
          <Text
            style={[s.compartmentValue, { color: colors.textStrong }]}
            testID="wallet-escrow-balance"
          >
            {balances
              ? formatSatang(balances.fundingReservedSatang, locale, "exact")
              : "฿0.00"}
          </Text>
        </View>

        <View
          style={[s.compartmentCol, { backgroundColor: colors.surfaceMuted }]}
        >
          <Text style={[s.compartmentLabel, { color: colors.textMuted }]}>
            {m.payoutReserved}
          </Text>
          <Text
            style={[s.compartmentValue, { color: colors.textStrong }]}
            testID="wallet-payout-balance"
          >
            {balances
              ? formatSatang(balances.reservedForPayoutsSatang, locale, "exact")
              : "฿0.00"}
          </Text>
        </View>
      </View>

      {/* Actions Row */}
      <View style={s.actionsRow}>
        <TouchableOpacity
          accessibilityLabel={m.topUp}
          accessibilityRole="button"
          onPress={() => setPaymentModalOpen(true)}
          style={[s.actionButtonPrimary, { backgroundColor: colors.primary }]}
          testID="wallet-topup-button"
        >
          <Plus color={colors.white} size={17} strokeWidth={2.4} />
          <Text style={[s.actionButtonLabelPrimary, { color: colors.white }]}>
            {m.topUp}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel={locale === "th" ? "ถอนเงิน" : "Withdraw"}
          accessibilityRole="button"
          onPress={() => setPayoutModalOpen(true)}
          style={[
            s.actionButtonSecondary,
            {
              borderColor: colors.borderAccent,
              backgroundColor: colors.surface,
            },
          ]}
          testID="wallet-withdraw-button"
        >
          <ArrowUpRight color={colors.primary} size={15} />
          <Text
            style={[s.actionButtonLabelSecondary, { color: colors.primary }]}
          >
            {locale === "th" ? "ถอนเงิน" : "Withdraw"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel={m.transactions}
          accessibilityRole="button"
          onPress={() => setHistoryModalOpen(true)}
          style={[
            s.actionButtonSecondary,
            {
              borderColor: colors.borderAccent,
              backgroundColor: colors.surface,
            },
          ]}
          testID="wallet-history-button"
        >
          <History color={colors.textStrong} size={17} />
          <Text
            style={[s.actionButtonLabelSecondary, { color: colors.textStrong }]}
          >
            {m.transactions}
          </Text>
        </TouchableOpacity>

        {balances && balances.earningsBalanceSatang > 0 ? (
          <TouchableOpacity
            accessibilityLabel={m.convertEarnings}
            accessibilityRole="button"
            disabled={converting}
            onPress={handleConvertEarnings}
            style={[
              s.actionButtonSecondary,
              {
                borderColor: colors.borderAccent,
                backgroundColor: colors.surface,
              },
            ]}
            testID="wallet-convert-button"
          >
            {converting ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <ArrowRightLeft color={colors.primary} size={15} />
                <Text
                  style={[
                    s.actionButtonLabelSecondary,
                    { color: colors.primary },
                  ]}
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
        onSuccess={() => {
          setRefreshIndex((idx) => idx + 1);
        }}
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
