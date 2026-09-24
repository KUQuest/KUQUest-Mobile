import React, { useState } from "react";
import { Animated } from "react-native";

import { Text, TouchableOpacity, View } from "@/tw";
import {
  ArrowRightLeft,
  Clock,
  Lock,
  Plus,
  Sparkles,
  Wallet,
} from "lucide-react-native";
import { formatSatang } from "@/domain/satang";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";

const AnimatedView = Animated.createAnimatedComponent(View);

interface HirerBalanceCardsProps {
  spendingBalanceSatang: number;
  fundingReservedSatang: number;
  earningsBalanceSatang: number;
  reservedForPayoutsSatang: number;
  spendingTitle: string;
  spendingDesc: string;
  escrowTitle: string;
  escrowDesc: string;
  earningsTitle: string;
  earningsDesc: string;
  payoutTitle: string;
  payoutDesc: string;
  balanceCardsHint: string;
  swapAllButton: string;
  swapHint: string;
  topUpLabel: string;
  onTopUp: () => void;
  transferButtonLabel: string;
  onTransferEarnings: () => void;
}

/** Dips a card out and back in; the content swap happens at the midpoint. */
function animateCard(anim: Animated.Value, onMidpoint: () => void) {
  Animated.timing(anim, {
    toValue: 0.5,
    duration: 120,
    useNativeDriver: true,
  }).start(() => {
    onMidpoint();
    Animated.timing(anim, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
    }).start(() => anim.setValue(0));
  });
}

function cardMotion(anim: Animated.Value) {
  const range = [0, 0.5, 1];
  return {
    opacity: anim.interpolate({ inputRange: range, outputRange: [1, 0.25, 1] }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: range,
          outputRange: [1, 0.96, 1],
        }),
      },
      {
        translateY: anim.interpolate({
          inputRange: range,
          outputRange: [0, 4, 0],
        }),
      },
    ],
  };
}

export function HirerBalanceCards({
  spendingBalanceSatang,
  fundingReservedSatang,
  earningsBalanceSatang,
  reservedForPayoutsSatang,
  spendingTitle,
  spendingDesc,
  escrowTitle,
  escrowDesc,
  earningsTitle,
  earningsDesc,
  payoutTitle,
  payoutDesc,
  balanceCardsHint,
  swapAllButton,
  swapHint,
  topUpLabel,
  onTopUp,
  transferButtonLabel,
  onTransferEarnings,
}: HirerBalanceCardsProps) {
  const { colors } = useAppTheme();
  const { isWorker } = useRoleWorkspace();
  const [isCard1Earnings, setCard1Earnings] = useState(isWorker);
  const [isCard2Payout, setCard2Payout] = useState(isWorker);
  const [card1Anim] = useState(() => new Animated.Value(0));
  const [card2Anim] = useState(() => new Animated.Value(0));

  const toggleCard1 = () =>
    animateCard(card1Anim, () => setCard1Earnings((prev) => !prev));
  const toggleCard2 = () =>
    animateCard(card2Anim, () => setCard2Payout((prev) => !prev));
  const toggleAll = () => {
    const nextCard1 = !isCard1Earnings;
    const nextCard2 = !isCard2Payout;
    animateCard(card1Anim, () => setCard1Earnings(nextCard1));
    animateCard(card2Anim, () => setCard2Payout(nextCard2));
  };

  const card1Title = isCard1Earnings ? earningsTitle : spendingTitle;
  const card1Amount = formatSatang(
    isCard1Earnings ? earningsBalanceSatang : spendingBalanceSatang,
    "en",
    "exact"
  );
  const card1Desc = isCard1Earnings ? earningsDesc : spendingDesc;
  const Card1Icon = isCard1Earnings ? Sparkles : Wallet;

  const card2Title = isCard2Payout ? payoutTitle : escrowTitle;
  const card2Amount = formatSatang(
    isCard2Payout ? reservedForPayoutsSatang : fundingReservedSatang,
    "en",
    "exact"
  );
  const card2Desc = isCard2Payout ? payoutDesc : escrowDesc;
  const Card2Icon = isCard2Payout ? Clock : Lock;

  return (
    <View className={styles.container} testID="hirer-balance-cards">
      <View className={styles.switcherBar}>
        <View className={styles.hint}>
          <ArrowRightLeft
            color={colors.textSecondary}
            size={14}
            strokeWidth={2.2}
          />
          <Text className={styles.hintText}>{balanceCardsHint}</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel={swapAllButton}
          accessibilityRole="button"
          activeOpacity={0.7}
          className={styles.swapAllButton}
          onPress={toggleAll}
          testID="hirer-balance-swap-all-btn"
        >
          <Text className={styles.swapAllText}>{swapAllButton}</Text>
        </TouchableOpacity>
      </View>

      <AnimatedView className={styles.hero} style={cardMotion(card1Anim)}>
        <TouchableOpacity
          accessibilityHint={swapHint}
          accessibilityLabel={`${card1Title}, ${card1Amount}`}
          accessibilityRole="button"
          activeOpacity={0.85}
          className={styles.heroContent}
          onPress={toggleCard1}
          testID="hirer-card-1"
        >
          <View className={styles.cardHeader}>
            <Card1Icon color={colors.onPrimary} size={18} strokeWidth={2} />
            <Text className={styles.heroLabel} testID="hirer-card1-title">
              {card1Title}
            </Text>
            <View className={styles.heroSwapIcon}>
              <ArrowRightLeft
                color={colors.onPrimary}
                size={14}
                strokeWidth={2.4}
              />
            </View>
          </View>
          <Text
            adjustsFontSizeToFit
            className={styles.heroAmount}
            numberOfLines={1}
            testID="hirer-spending-balance"
          >
            {card1Amount}
          </Text>
          <Text className={styles.heroDesc}>{card1Desc}</Text>
        </TouchableOpacity>
        <View className={styles.heroActions}>
          <TouchableOpacity
            accessibilityLabel={topUpLabel}
            accessibilityRole="button"
            activeOpacity={0.85}
            className={styles.topUpButton}
            onPress={onTopUp}
            testID="hirer-wallet-top-up"
          >
            <Plus color={colors.primaryDark} size={18} strokeWidth={2.6} />
            <Text className={styles.topUpText}>{topUpLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={transferButtonLabel}
            accessibilityRole="button"
            activeOpacity={0.85}
            className={styles.transferButton}
            onPress={onTransferEarnings}
            testID="hirer-balance-transfer-btn"
          >
            <ArrowRightLeft
              color={colors.onPrimary}
              size={16}
              strokeWidth={2.4}
            />
            <Text className={styles.transferText}>{transferButtonLabel}</Text>
          </TouchableOpacity>
        </View>
      </AnimatedView>

      <AnimatedView style={cardMotion(card2Anim)}>
        <TouchableOpacity
          accessibilityHint={swapHint}
          accessibilityLabel={`${card2Title}, ${card2Amount}`}
          accessibilityRole="button"
          activeOpacity={0.85}
          className={styles.reservedCard}
          onPress={toggleCard2}
          testID="hirer-card-2"
        >
          <View className={styles.reservedIcon}>
            <Card2Icon color={colors.gold} size={20} strokeWidth={2.2} />
          </View>
          <View className={styles.reservedBody}>
            <Text className={styles.reservedLabel} testID="hirer-card2-title">
              {card2Title}
            </Text>
            <Text
              adjustsFontSizeToFit
              className={styles.reservedAmount}
              numberOfLines={1}
              testID="hirer-escrow-balance"
            >
              {card2Amount}
            </Text>
            <Text className={styles.reservedDesc}>{card2Desc}</Text>
          </View>
          <ArrowRightLeft
            color={colors.textMuted}
            size={16}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </AnimatedView>
    </View>
  );
}

const styles = {
  container: "mb-ku-xl gap-ku-12",
  switcherBar: "flex-row items-center justify-between gap-ku-sm",
  hint: "flex-1 flex-row items-center gap-ku-6",
  hintText: "shrink font-ku-medium text-ku-label text-ku-text-secondary",
  swapAllButton:
    "min-h-[48px] items-center justify-center rounded-ku-pill px-ku-md",
  swapAllText: "font-ku-semibold text-ku-body-small text-ku-primary-dark",
  hero: "gap-ku-lg rounded-ku-card bg-ku-primary p-ku-lg",
  heroContent: "gap-ku-xs",
  cardHeader: "flex-row items-center gap-ku-sm",
  heroLabel: "flex-1 font-ku-semibold text-ku-body-small text-ku-on-primary",
  heroSwapIcon:
    "h-[32px] w-[32px] items-center justify-center rounded-ku-pill bg-ku-primary-dark",
  heroAmount: "font-ku-bold text-ku-display-small text-ku-on-primary",
  heroDesc: "font-ku-regular text-ku-meta text-ku-on-primary opacity-[0.85]",
  heroActions: "flex-row flex-wrap gap-ku-sm",
  topUpButton:
    "min-h-[48px] flex-1 flex-row items-center justify-center gap-ku-6 rounded-ku-pill bg-ku-surface px-ku-md",
  topUpText: "font-ku-semibold text-ku-body-small text-ku-primary-dark",
  transferButton:
    "min-h-[48px] flex-1 flex-row items-center justify-center gap-ku-6 rounded-ku-pill border border-ku-on-primary px-ku-md",
  transferText: "font-ku-semibold text-ku-body-small text-ku-on-primary",
  reservedCard:
    "min-h-[48px] flex-row items-center gap-ku-12 rounded-ku-card border border-ku-border bg-ku-surface p-ku-md",
  reservedIcon:
    "h-[44px] w-[44px] items-center justify-center rounded-ku-pill bg-ku-cream",
  reservedBody: "flex-1 gap-ku-2",
  reservedLabel: "font-ku-semibold text-ku-body-small text-ku-text-strong",
  reservedAmount: "font-ku-bold text-ku-section text-ku-text-strong",
  reservedDesc: "font-ku-regular text-ku-label text-ku-text-secondary",
} as const;
