import { StyleSheet, useColorScheme } from 'react-native';
import { useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronUp, Plus, ReceiptText, ShieldCheck, WalletCards } from 'lucide-react-native';

import { Pressable, Text, View } from '@/tw';
import type { SupportedLocale } from '@/locales/LocaleProvider';
import { questBoardMessages } from '@/locales/questBoardMessages';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

const fundingLayout = StyleSheet.create({
  summary: {
    marginBottom: 16,
  },
  expandedSummary: {
    borderRadius: 20,
  },
  collapsedSummary: {
    borderRadius: 16,
    borderWidth: 1,
  },
  toggle: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 64,
    paddingVertical: 10,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionButton: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    opacity: 0.72,
  },
  information: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 12,
  },
});

export function QuestFundingSummary({ locale }: { locale: SupportedLocale }) {
  const messages = questBoardMessages[locale];
  const [expanded, setExpanded] = useState(false);
  useColorScheme();

  return (
    <View
      style={[
        fundingLayout.summary,
        expanded ? fundingLayout.expandedSummary : fundingLayout.collapsedSummary,
        expanded ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.borderAccent },
      ]}
      testID="quest-funding-summary"
    >
      <Pressable
        accessibilityHint={expanded ? messages.fundingCollapse : messages.fundingExpand}
        accessibilityLabel={`${messages.fundingTitle}: ${messages.fundingHeld} ฿0`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="flex-row items-center min-h-[64px] py-[10px]"
        style={[fundingLayout.toggle, { paddingHorizontal: expanded ? 16 : 12 }]}
        onPress={() => setExpanded((current) => !current)}
        testID="quest-funding-summary-toggle"
      >
        <View className="flex-1 flex-row items-center min-w-0">
          <View
            className="items-center justify-center"
            style={[
              fundingLayout.icon,
              { borderRadius: expanded ? 20 : 12, height: expanded ? 40 : 36, width: expanded ? 40 : 36 },
              expanded ? { borderColor: colors.white + '66', borderWidth: 1 } : { backgroundColor: colors.surfaceAccent },
            ]}
          >
            <WalletCards color={expanded ? colors.white : colors.primary} size={expanded ? 22 : 20} />
          </View>
          <View className="flex-1 min-w-0 ml-[10px]">
            <Text
              numberOfLines={1}
              style={{
                color: expanded ? colors.white : colors.textStrong,
                fontFamily: expanded ? fontFamily.bold : fontFamily.semiBold,
                fontSize: expanded ? 24 : 14,
                lineHeight: expanded ? 29 : 21,
              }}
            >
              {messages.fundingTitle}
            </Text>
            {!expanded ? <Text className="text-ku-text-secondary font-ku-regular text-ku-caption" numberOfLines={1}>{messages.fundingHeld}</Text> : null}
          </View>
        </View>
        {!expanded ? <Text className="text-ku-primary font-ku-bold text-ku-emphasis" selectable>฿0</Text> : null}
        <View
          className="items-center justify-center"
          style={[fundingLayout.chevron, { backgroundColor: expanded ? colors.white + '26' : colors.surfaceAccent, borderRadius: 9999, height: 44, width: 44 }]}
        >
          {expanded ? <ChevronUp color={colors.white} size={21} strokeWidth={2.4} /> : <ChevronDown color={colors.primary} size={21} strokeWidth={2.4} />}
        </View>
      </Pressable>
      {expanded ? (
        <View testID="quest-funding-summary-details">
          <View className="mx-[12px] mb-[12px] rounded-[16px] p-[16px]" style={{ backgroundColor: colors.surface }}>
            <View>
              <Text className="text-ku-text-secondary font-ku-medium text-ku-label">{messages.fundingHeld}</Text>
              <Text className="text-ku-text-strong font-ku-bold text-[32px] mt-[4px]" selectable>฿0</Text>
            </View>
            <Text className="text-ku-text-secondary font-ku-regular text-ku-label mt-[8px]">{messages.fundingEmpty}</Text>
            <View className="flex-row gap-[8px] mt-[16px]" testID="quest-funding-actions">
              <Pressable
                accessibilityHint={messages.fundingActionsUnavailable}
                accessibilityLabel={`${messages.fundingTopUp}: ${messages.fundingActionsUnavailable}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                className="flex-1 flex-row items-center justify-center"
                disabled
                style={[fundingLayout.actionButton, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderMuted }]}
                testID="quest-funding-top-up"
              >
                <Plus color={colors.textMuted} size={18} strokeWidth={2.2} />
                <Text className="text-ku-text-muted font-ku-semibold text-ku-label ml-[4px]">{messages.fundingTopUp}</Text>
              </Pressable>
              <Pressable
                accessibilityHint={messages.fundingActionsUnavailable}
                accessibilityLabel={`${messages.fundingTransfer}: ${messages.fundingActionsUnavailable}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                className="flex-1 flex-row items-center justify-center"
                disabled
                style={[fundingLayout.actionButton, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderMuted }]}
                testID="quest-funding-transfer"
              >
                <ArrowUpRight color={colors.textMuted} size={18} strokeWidth={2.2} />
                <Text className="text-ku-text-muted font-ku-semibold text-ku-label ml-[4px]">{messages.fundingTransfer}</Text>
              </Pressable>
            </View>
            <Text className="text-ku-text-muted font-ku-regular text-ku-caption mt-[8px] text-center" testID="quest-funding-actions-unavailable">{messages.fundingActionsUnavailable}</Text>
          </View>
          <View
            accessibilityRole="text"
            className="flex-row gap-[8px]"
            style={[fundingLayout.information, { borderTopColor: colors.borderSubtle }]}
            testID="quest-funding-information"
          >
            <View className="flex-1 flex-row items-start gap-[8px]" testID="quest-funding-settlement-info">
              <ReceiptText color={colors.primary} size={20} />
              <View className="flex-1">
                <Text className="text-ku-text-strong font-ku-semibold text-ku-label">{messages.settlement}</Text>
                <Text className="text-ku-text-secondary font-ku-regular text-ku-label">{messages.viewHistory}</Text>
              </View>
            </View>
            <View className="flex-1 flex-row items-start gap-[8px]" testID="quest-funding-refund-info">
              <ShieldCheck color={colors.primary} size={20} />
              <View className="flex-1">
                <Text className="text-ku-text-strong font-ku-semibold text-ku-label">{messages.refunds}</Text>
                <Text className="text-ku-text-secondary font-ku-regular text-ku-label">{messages.policy}</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
