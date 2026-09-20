import React, { useState } from "react";
import { Animated } from "react-native";

import { Text, TouchableOpacity, View } from "@/tw";
import {
  ArrowRightLeft,
  Clock,
  Lock,
  Sparkles,
  Wallet,
} from "lucide-react-native";
import { colors } from "@/theme/colors";
import { formatSatang } from "@/domain/satang";

// `Animated.View` from react-native does not pass through `className`; wrapping
// the NativeWind `View` keeps the class path while the animation stays on the
// RN Animated driver these cards already use.
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
  hirerViewLabel: string;
  workerViewLabel: string;
  onTransferEarnings?: () => void;
  transferButtonLabel?: string;
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
  onTransferEarnings,
  transferButtonLabel,
}: HirerBalanceCardsProps) {
  const [card1Mode, setCard1Mode] = useState<"spending" | "earnings">(
    "spending"
  );
  const [card2Mode, setCard2Mode] = useState<"escrow" | "payout">("escrow");

  const [card1Anim] = useState(() => new Animated.Value(0));
  const [card2Anim] = useState(() => new Animated.Value(0));
  const isCard1Earnings = card1Mode === "earnings";
  const isCard2Payout = card2Mode === "payout";

  const animateCard = (anim: Animated.Value, onMidpoint: () => void) => {
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
      }).start(() => {
        anim.setValue(0);
      });
    });
  };

  const toggleCard1 = () => {
    animateCard(card1Anim, () => {
      setCard1Mode((prev) => (prev === "spending" ? "earnings" : "spending"));
    });
  };

  const toggleCard2 = () => {
    animateCard(card2Anim, () => {
      setCard2Mode((prev) => (prev === "escrow" ? "payout" : "escrow"));
    });
  };

  const toggleAll = () => {
    const nextCard1 = isCard1Earnings ? "spending" : "earnings";
    const nextCard2 = isCard2Payout ? "escrow" : "payout";

    animateCard(card1Anim, () => {
      setCard1Mode(nextCard1);
    });
    animateCard(card2Anim, () => {
      setCard2Mode(nextCard2);
    });
  };

  const card1Scale = card1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.94, 1],
  });

  const card1Opacity = card1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.25, 1],
  });

  const card1TranslateY = card1Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 4, 0],
  });

  const card2Scale = card2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.94, 1],
  });

  const card2Opacity = card2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.25, 1],
  });

  const card2TranslateY = card2Anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 4, 0],
  });

  const currentCard1Title = isCard1Earnings ? earningsTitle : spendingTitle;
  const currentCard1Amount = isCard1Earnings
    ? earningsBalanceSatang
    : spendingBalanceSatang;
  const currentCard1Desc = isCard1Earnings ? earningsDesc : spendingDesc;

  const currentCard2Title = isCard2Payout ? payoutTitle : escrowTitle;
  const currentCard2Amount = isCard2Payout
    ? reservedForPayoutsSatang
    : fundingReservedSatang;
  const currentCard2Desc = isCard2Payout ? payoutDesc : escrowDesc;

  return (
    <View className={styles.container} testID="hirer-balance-cards">
      {/* Top hint & Swap All bar */}
      <View className={styles.switcherBar}>
        <View className={styles.hintBadge}>
          <ArrowRightLeft color={colors.primary} size={12} strokeWidth={2.4} />
          <Text className={styles.hintText}>{balanceCardsHint}</Text>
        </View>

        <View className={styles.switcherActions}>
          {onTransferEarnings ? (
            <TouchableOpacity
              accessibilityLabel={transferButtonLabel ?? "โอนรายได้"}
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={onTransferEarnings}
              className={styles.transferShortcutBtn}
              testID="hirer-balance-transfer-shortcut-btn"
            >
              <ArrowRightLeft
                color={colors.primaryDeep}
                size={11}
                strokeWidth={2.4}
              />
              <Text className={styles.transferShortcutBtnText}>
                {transferButtonLabel ?? "โอนรายได้"}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            accessibilityLabel={swapAllButton}
            accessibilityRole="button"
            activeOpacity={0.7}
            onPress={toggleAll}
            className={styles.swapAllButton}
            testID="hirer-balance-swap-all-btn"
          >
            <Text className={styles.swapAllButtonText}>{swapAllButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className={styles.row}>
        {/* Card 1: Spending Balance <-> Earnings */}
        <AnimatedView
          className={styles.cardWrapper}
          style={{
            opacity: card1Opacity,
            transform: [{ scale: card1Scale }, { translateY: card1TranslateY }],
          }}
        >
          <View
            className={`${styles.card} ${
              isCard1Earnings ? styles.earningsCard : styles.spendingCard
            }`}
          >
            <TouchableOpacity
              accessibilityHint={swapHint}
              accessibilityLabel={`${currentCard1Title}, ${formatSatang(currentCard1Amount, "en", "exact")}`}
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={toggleCard1}
              className={styles.cardContent}
              testID="hirer-card-1"
            >
              <View className={styles.cardHeader}>
                <Text
                  numberOfLines={1}
                  className={styles.cardLabel}
                  testID="hirer-card1-title"
                >
                  {currentCard1Title}
                </Text>
                <View className={styles.iconGroup}>
                  <View
                    className={styles.cardSwapChip}
                    style={cardSwapChipColor}
                    testID="hirer-card-1-swap-btn"
                  >
                    <ArrowRightLeft
                      color={colors.primaryDeep}
                      size={11}
                      strokeWidth={2.4}
                    />
                  </View>
                  {isCard1Earnings ? (
                    <Sparkles
                      color={colors.primary}
                      size={18}
                      strokeWidth={2}
                    />
                  ) : (
                    <Wallet color={colors.primary} size={18} strokeWidth={2} />
                  )}
                </View>
              </View>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                className={styles.spendingAmount}
                testID="hirer-spending-balance"
              >
                {formatSatang(currentCard1Amount, "en", "exact")}
              </Text>
              <Text numberOfLines={1} className={styles.spendingDesc}>
                {currentCard1Desc}
              </Text>
            </TouchableOpacity>
            {isCard1Earnings && onTransferEarnings ? (
              <TouchableOpacity
                accessibilityLabel={
                  transferButtonLabel ?? "โอนเข้าเงินพร้อมใช้"
                }
                accessibilityRole="button"
                activeOpacity={0.8}
                onPress={onTransferEarnings}
                className={styles.cardTransferBtn}
                testID="hirer-card1-transfer-btn"
              >
                <ArrowRightLeft
                  color={colors.onPrimary}
                  size={11}
                  strokeWidth={2.4}
                />
                <Text className={styles.cardTransferBtnText}>
                  {transferButtonLabel ?? "โอนเข้าเงินพร้อมใช้"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </AnimatedView>
        {/* Card 2: Escrow <-> Pending Payout */}
        <AnimatedView
          className={styles.cardWrapper}
          style={{
            opacity: card2Opacity,
            transform: [{ scale: card2Scale }, { translateY: card2TranslateY }],
          }}
        >
          <TouchableOpacity
            accessibilityHint={swapHint}
            accessibilityLabel={`${currentCard2Title}, ${formatSatang(currentCard2Amount, "en", "exact")}`}
            accessibilityRole="button"
            activeOpacity={0.85}
            className={`${styles.card} ${styles.escrowCard}`}
            onPress={toggleCard2}
            testID="hirer-card-2"
          >
            <View className={styles.cardHeader}>
              <Text
                numberOfLines={1}
                className={styles.cardLabel}
                testID="hirer-card2-title"
              >
                {currentCard2Title}
              </Text>
              <View className={styles.iconGroup}>
                <View
                  className={styles.cardSwapChip}
                  style={cardSwapChipColor}
                  testID="hirer-card-2-swap-btn"
                >
                  <ArrowRightLeft
                    color={colors.textSecondary}
                    size={11}
                    strokeWidth={2.4}
                  />
                </View>
                {isCard2Payout ? (
                  <Clock color={colors.primary} size={18} strokeWidth={2} />
                ) : (
                  <Lock color={colors.primary} size={18} strokeWidth={2} />
                )}
              </View>
            </View>
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              className={styles.escrowAmount}
              testID="hirer-escrow-balance"
            >
              {formatSatang(currentCard2Amount, "en", "exact")}
            </Text>
            <Text numberOfLines={1} className={styles.escrowDesc}>
              {currentCard2Desc}
            </Text>
          </TouchableOpacity>
        </AnimatedView>
      </View>
    </View>
  );
}

const styles = {
  container: "mb-ku-lg",
  switcherBar: "mb-[10px] flex-row items-center justify-between px-[2px]",
  hintBadge: "flex-row items-center gap-[6px]",
  hintText: "font-ku-medium text-ku-label text-ku-text-secondary",
  switcherActions: "flex-row items-center gap-[6px]",
  transferShortcutBtn:
    "flex-row items-center gap-ku-xs rounded-ku-pill border border-ku-border-success bg-ku-surface-success px-[9px] py-[3px]",
  transferShortcutBtnText:
    "font-ku-medium text-ku-caption text-ku-primary-dark",
  swapAllButton:
    "flex-row items-center rounded-ku-pill border border-ku-border-success bg-ku-surface-success px-[9px] py-[3px]",
  swapAllButtonText: "font-ku-medium text-ku-caption text-ku-primary-dark",
  cardTransferBtn:
    "mt-ku-xs flex-row items-center justify-center gap-ku-xs rounded-[8px] bg-ku-primary-dark px-ku-sm py-[5px]",
  cardTransferBtnText: "font-ku-semibold text-ku-caption text-ku-on-primary",
  cardContent: "flex-1 justify-between",
  row: "flex-row gap-[12px]",
  cardWrapper: "flex-1",
  cardHeader: "mb-[6px] flex-row items-center justify-between",
  card: "min-h-[126px] flex-1 justify-between rounded-[16px] border p-ku-md",
  spendingCard: "border-ku-border-success bg-ku-surface-success",
  earningsCard: "border-ku-border-success bg-ku-surface-success",
  escrowCard: "border-ku-border-subtle bg-ku-surface-muted",
  cardLabel: "mr-ku-xs flex-1 font-ku-medium text-ku-meta text-ku-text-strong",
  iconGroup: "flex-row items-center gap-ku-sm",
  cardSwapChip: "h-[22px] w-[22px] items-center justify-center rounded-[11px]",
  spendingAmount:
    "my-ku-xs font-ku-bold text-[22px] leading-[28px] text-ku-primary-dark",
  escrowAmount:
    "my-ku-xs font-ku-bold text-[22px] leading-[28px] text-ku-text-strong",
  spendingDesc:
    "font-ku-regular text-ku-caption leading-[15px] text-ku-success",
  escrowDesc:
    "font-ku-regular text-ku-caption leading-[15px] text-ku-text-muted",
} as const;

const cardSwapChipColor = {
  backgroundColor: "rgba(0,0,0,0.05)",
} as const;
