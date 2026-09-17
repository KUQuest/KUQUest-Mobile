import React from "react";
import { ScrollView } from "@/tw";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useLocale } from "@/locales/LocaleProvider";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";

import { HomeWalletOverview } from "./HomeWalletOverview";

export default function WalletScreen() {
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const metrics = getAppChromeMetrics(width, fontScale);

  return (
    <ScreenLayout edges={["top", "left", "right"]} className="bg-ku-background">
      <ScrollView
        contentContainerStyle={{
          paddingBottom:
            getBottomNavigationInset(metrics, insets.bottom) + spacing.xl,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
        testID="money-screen"
      >
        <HomeWalletOverview locale={locale} />
      </ScrollView>
    </ScreenLayout>
  );
}
