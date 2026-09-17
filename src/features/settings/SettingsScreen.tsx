import React, { useState } from "react";
import { useRouter } from "expo-router";
import { Modal } from "react-native";
import { Host, Switch } from "@expo/ui";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  FileText,
  Globe2,
  Info,
  LockKeyhole,
  LogOut,
  Moon,
  Pencil,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressable, ScrollView, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useLocale } from "@/locales/LocaleProvider";
import { settingsMessages } from "@/locales/settingsMessages";
import { authService } from "@/features/auth/AuthService";
import { authEnvironment } from "@/features/auth/authEnvironment";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import styles from "./styles/settingsStyles";

function SettingsRow({
  icon: Icon,
  title,
  description,
  value,
  onPress,
  trailing,
  last = false,
  testID,
}: {
  icon: typeof Bell;
  title: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  last?: boolean;
  testID?: string;
}) {
  const content = (
    <>
      <View className={styles.iconContainer}>
        <Icon color={colors.primary} size={20} strokeWidth={2} />
      </View>
      <View className={styles.rowContent}>
        <Text className={styles.rowTitle}>{title}</Text>
        {description ? (
          <Text className={styles.rowDescription}>{description}</Text>
        ) : null}
      </View>
      {value ? <Text className={styles.rowValue}>{value}</Text> : null}
      {trailing ??
        (onPress ? (
          <ChevronRight
            color={colors.textMuted}
            size={20}
            strokeWidth={2}
            className={styles.chevron}
          />
        ) : null)}
    </>
  );

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`${styles.row} ${last ? "" : styles.rowWithDivider}`}
      testID={testID}
    >
      {content}
    </Pressable>
  ) : (
    <View
      className={`${styles.row} ${last ? "" : styles.rowWithDivider}`}
      testID={testID}
    >
      {content}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const messages = settingsMessages[locale];
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom + spacing.lg;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const devOverlayEnabled = authEnvironment.isDemoEnabled();

  const switchAccount = () => {
    if (switchingAccount) return;
    setSwitchingAccount(true);
    void authService
      .signOut()
      .catch(() => undefined)
      .finally(() => router.replace("/"));
  };

  const logout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    void authService
      .signOut()
      .catch(() => undefined)
      .finally(() => router.replace("/"));
  };

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <View className="items-center flex-row h-[56px] px-[12px]">
        <Pressable
          accessibilityLabel={messages.back}
          accessibilityRole="button"
          className="items-center h-[48px] justify-center w-[48px]"
          onPress={() => router.back()}
          testID="settings-back"
        >
          <ChevronLeft color={colors.primaryDeep} size={26} strokeWidth={2.3} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="text-ku-text-strong font-ku-bold text-ku-title-small ml-[4px]"
        >
          {messages.title}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        testID="settings-scroll"
      >
        <View className={styles.content} testID="settings-content">
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>{messages.account}</Text>
            <View className={styles.sectionBody}>
              <SettingsRow
                description={messages.editProfileDescription}
                icon={Pencil}
                onPress={() => router.push("/profile/edit")}
                title={messages.editProfile}
                testID="settings-edit-profile"
                last={!devOverlayEnabled}
              />
              {devOverlayEnabled ? (
                <SettingsRow
                  description={
                    switchingAccount
                      ? messages.switchingAccount
                      : messages.devOverlayDescription
                  }
                  icon={Code2}
                  onPress={switchAccount}
                  title={messages.devOverlay}
                  testID="settings-dev-overlay"
                  last
                />
              ) : null}
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>{messages.preferences}</Text>
            <View className={styles.sectionBody}>
              <SettingsRow
                description={messages.notificationsDescription}
                icon={Bell}
                title={messages.notifications}
                trailing={
                  <View className={styles.switchHost}>
                    <Host matchContents seedColor={colors.primary}>
                      <Switch
                        testID="settings-notifications"
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                      />
                    </Host>
                  </View>
                }
              />
              <SettingsRow
                description={messages.languageDescription}
                icon={Globe2}
                onPress={() => setLanguageModalVisible(true)}
                title={messages.language}
                value={
                  locale === "th"
                    ? messages.thaiLanguage
                    : messages.englishLanguage
                }
                testID="settings-language"
              />
              <SettingsRow
                description={messages.appearanceDescription}
                icon={Moon}
                title={messages.appearance}
                value={messages.systemAppearance}
                last
              />
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>{messages.support}</Text>
            <View className={styles.sectionBody}>
              <SettingsRow
                description={messages.helpDescription}
                icon={CircleHelp}
                onPress={() => undefined}
                title={messages.help}
              />
              <SettingsRow
                icon={FileText}
                onPress={() => undefined}
                title={messages.terms}
              />
              <SettingsRow
                icon={LockKeyhole}
                onPress={() => undefined}
                title={messages.privacy}
                last
              />
            </View>
          </View>

          <View className={styles.footer}>
            <Info color={colors.textMuted} size={18} strokeWidth={2} />
            <Text className={styles.version}>{messages.version}</Text>
            <Text className={styles.version}>{messages.aboutDescription}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: loggingOut }}
            className="border-ku-danger items-center flex-row justify-center min-h-[52px] rounded-[16px] border px-[16px] active:bg-ku-danger/10"
            disabled={loggingOut}
            onPress={logout}
            testID="settings-logout"
          >
            <LogOut color={colors.danger} size={20} strokeWidth={2} />
            <Text className="text-ku-danger font-ku-semibold text-ku-control ml-[8px]">
              {messages.logout}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <Modal
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
        testID="settings-language-modal"
      >
        <View className="flex-1 items-center justify-center px-[24px]">
          <Pressable
            accessibilityLabel={messages.cancel}
            accessibilityRole="button"
            className="absolute inset-0"
            onPress={() => setLanguageModalVisible(false)}
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          />
          <View
            accessibilityViewIsModal
            className="bg-white max-w-[420px] rounded-[20px] p-[20px] w-full"
          >
            <Text
              accessibilityRole="header"
              className="text-ku-text-strong font-ku-bold text-ku-title-small"
            >
              {messages.selectLanguage}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: locale === "th" }}
              className={`items-center border flex-row justify-between min-h-[52px] mt-[16px] px-[16px] rounded-[14px] ${
                locale === "th"
                  ? "bg-ku-primary/10 border-ku-primary"
                  : "border-ku-border"
              }`}
              onPress={async () => {
                await setLocale("th");
                setLanguageModalVisible(false);
              }}
              testID="settings-language-th"
            >
              <Text className="text-ku-text-strong font-ku-semibold text-ku-control">
                {messages.thaiLanguage}
              </Text>
              {locale === "th" ? (
                <Check color={colors.primary} size={20} strokeWidth={2.5} />
              ) : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: locale === "en" }}
              className={`items-center border flex-row justify-between min-h-[52px] mt-[8px] px-[16px] rounded-[14px] ${
                locale === "en"
                  ? "bg-ku-primary/10 border-ku-primary"
                  : "border-ku-border"
              }`}
              onPress={async () => {
                await setLocale("en");
                setLanguageModalVisible(false);
              }}
              testID="settings-language-en"
            >
              <Text className="text-ku-text-strong font-ku-semibold text-ku-control">
                {messages.englishLanguage}
              </Text>
              {locale === "en" ? (
                <Check color={colors.primary} size={20} strokeWidth={2.5} />
              ) : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="items-center justify-center min-h-[48px] mt-[12px] rounded-[14px] active:bg-ku-surface"
              onPress={() => setLanguageModalVisible(false)}
              testID="settings-language-modal-cancel"
            >
              <Text className="text-ku-primary font-ku-semibold text-ku-control">
                {messages.cancel}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}
