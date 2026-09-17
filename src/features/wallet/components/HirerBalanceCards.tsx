import React, { useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowRightLeft,
  Clock,
  Lock,
  Sparkles,
  Wallet,
} from "lucide-react-native";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { formatHirerCardAmount } from "../walletModule";

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
    <View style={styles.container} testID="hirer-balance-cards">
      {/* Top hint & Swap All bar */}
      <View style={styles.switcherBar}>
        <View style={styles.hintBadge}>
          <ArrowRightLeft color={colors.primary} size={12} strokeWidth={2.4} />
          <Text style={styles.hintText}>{balanceCardsHint}</Text>
        </View>

        <View style={styles.switcherActions}>
          {onTransferEarnings ? (
            <TouchableOpacity
              accessibilityLabel={transferButtonLabel ?? "โอนรายได้"}
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={onTransferEarnings}
              style={styles.transferShortcutBtn}
              testID="hirer-balance-transfer-shortcut-btn"
            >
              <ArrowRightLeft
                color={colors.primaryDeep}
                size={11}
                strokeWidth={2.4}
              />
              <Text style={styles.transferShortcutBtnText}>
                {transferButtonLabel ?? "โอนรายได้"}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            accessibilityLabel={swapAllButton}
            accessibilityRole="button"
            activeOpacity={0.7}
            onPress={toggleAll}
            style={styles.swapAllButton}
            testID="hirer-balance-swap-all-btn"
          >
            <Text style={styles.swapAllButtonText}>{swapAllButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.row}>
        {/* Card 1: Spending Balance <-> Earnings */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: card1Opacity,
              transform: [
                { scale: card1Scale },
                { translateY: card1TranslateY },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.card,
              isCard1Earnings ? styles.earningsCard : styles.spendingCard,
            ]}
          >
            <TouchableOpacity
              accessibilityHint={swapHint}
              accessibilityLabel={`${currentCard1Title}, ${formatHirerCardAmount(currentCard1Amount)}`}
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={toggleCard1}
              style={styles.cardContent}
              testID="hirer-card-1"
            >
              <View style={styles.cardHeader}>
                <Text
                  numberOfLines={1}
                  style={styles.cardLabel}
                  testID="hirer-card1-title"
                >
                  {currentCard1Title}
                </Text>
                <View style={styles.iconGroup}>
                  <View
                    style={styles.cardSwapChip}
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
                style={styles.spendingAmount}
                testID="hirer-spending-balance"
              >
                {formatHirerCardAmount(currentCard1Amount)}
              </Text>
              <Text numberOfLines={1} style={styles.spendingDesc}>
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
                style={styles.cardTransferBtn}
                testID="hirer-card1-transfer-btn"
              >
                <ArrowRightLeft
                  color={colors.white}
                  size={11}
                  strokeWidth={2.4}
                />
                <Text style={styles.cardTransferBtnText}>
                  {transferButtonLabel ?? "โอนเข้าเงินพร้อมใช้"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
        {/* Card 2: Escrow <-> Pending Payout */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: card2Opacity,
              transform: [
                { scale: card2Scale },
                { translateY: card2TranslateY },
              ],
            },
          ]}
        >
          <TouchableOpacity
            accessibilityHint={swapHint}
            accessibilityLabel={`${currentCard2Title}, ${formatHirerCardAmount(currentCard2Amount)}`}
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={toggleCard2}
            style={[styles.card, styles.escrowCard]}
            testID="hirer-card-2"
          >
            <View style={styles.cardHeader}>
              <Text
                numberOfLines={1}
                style={styles.cardLabel}
                testID="hirer-card2-title"
              >
                {currentCard2Title}
              </Text>
              <View style={styles.iconGroup}>
                <View
                  style={styles.cardSwapChip}
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
              style={styles.escrowAmount}
              testID="hirer-escrow-balance"
            >
              {formatHirerCardAmount(currentCard2Amount)}
            </Text>
            <Text numberOfLines={1} style={styles.escrowDesc}>
              {currentCard2Desc}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  switcherBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  hintBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hintText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  switcherActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  transferShortcutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: colors.surfaceSuccess,
    borderWidth: 1,
    borderColor: colors.borderSuccess,
  },
  transferShortcutBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.primaryDeep,
  },
  swapAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: colors.surfaceSuccess,
    borderWidth: 1,
    borderColor: colors.borderSuccess,
  },
  swapAllButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.primaryDeep,
  },
  cardTransferBtn: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  cardTransferBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.white,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: "space-between",
    minHeight: 126,
  },
  spendingCard: {
    backgroundColor: colors.surfaceSuccess,
    borderColor: colors.borderSuccess,
  },
  earningsCard: {
    backgroundColor: colors.surfaceSuccess,
    borderColor: colors.borderSuccess,
  },
  escrowCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.textStrong,
    flex: 1,
    marginRight: 4,
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardSwapChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  spendingAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primaryDeep,
    marginVertical: 4,
  },
  escrowAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textStrong,
    marginVertical: 4,
  },
  spendingDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.success,
  },
  escrowDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
});
