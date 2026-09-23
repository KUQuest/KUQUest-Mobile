import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Modal } from "react-native";
import { Host, Switch } from "@expo/ui";
import {
  ArrowRightLeft,
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
import { useLocale } from "@/features/preferences/localeStore";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";
import { settingsMessages } from "@/locales/settingsMessages";
import { authService } from "@/features/auth/AuthService";
import { authEnvironment } from "@/features/auth/authEnvironment";
import { clearSessionCache } from "@/features/auth/sessionQueries";
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
  const queryClient = useQueryClient();
  const { locale, setLocale } = useLocale();
  const messages = settingsMessages[locale];
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom + spacing.lg;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const { workspace, switchWorkspace } = useRoleWorkspace();
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const devOverlayEnabled = authEnvironment.isDemoEnabled();
  const completeSignOut = () => {
    void authService
      .signOut()
      .catch(() => undefined)
      .finally(() => {
        clearSessionCache(queryClient);
        router.replace("/");
      });
  };

  const switchAccount = () => {
    if (switchingAccount) return;
    setSwitchingAccount(true);
    completeSignOut();
  };

  const handleSwitchWorkspace = () => {
    if (switchingWorkspace) return;
    setSwitchingWorkspace(true);
    void switchWorkspace().finally(() => {
      router.replace("/(tabs)");
    });
  };

  const logout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    completeSignOut();
  };

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <View className="h-[56px] flex-row items-center px-ku-12">
        <Pressable
          accessibilityLabel={messages.back}
          accessibilityRole="button"
          className="h-[48px] w-[48px] items-center justify-center"
          onPress={() => router.back()}
          testID="settings-back"
        >
          <ChevronLeft color={colors.primaryDeep} size={26} strokeWidth={2.3} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="ml-ku-xs font-ku-bold text-ku-title-small text-ku-text-strong"
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
              />
              <SettingsRow
                description={messages.workspaceDescription}
                icon={ArrowRightLeft}
                onPress={handleSwitchWorkspace}
                title={messages.workspace}
                value={
                  switchingWorkspace
                    ? messages.switchingWorkspace
                    : workspace === "worker"
                      ? messages.workerWorkspace
                      : messages.hirerWorkspace
                }
                testID="settings-workspace"
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
            className="min-h-[52px] flex-row items-center justify-center rounded-[16px] border border-ku-danger px-ku-md active:bg-ku-danger/10"
            disabled={loggingOut}
            onPress={logout}
            testID="settings-logout"
          >
            <LogOut color={colors.danger} size={20} strokeWidth={2} />
            <Text className="ml-ku-sm font-ku-semibold text-ku-control text-ku-danger">
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
        <View className="flex-1 items-center justify-center px-ku-lg">
          <Pressable
            accessibilityLabel={messages.cancel}
            accessibilityRole="button"
            className="absolute inset-0 bg-ku-overlay"
            onPress={() => setLanguageModalVisible(false)}
          />
          <View
            accessibilityViewIsModal
            className="w-full max-w-[420px] rounded-[20px] bg-ku-surface p-ku-20"
          >
            <Text
              accessibilityRole="header"
              className="font-ku-bold text-ku-title-small text-ku-text-strong"
            >
              {messages.selectLanguage}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: locale === "th" }}
              className={`mt-ku-md min-h-[52px] flex-row items-center justify-between rounded-[14px] border px-ku-md ${
                locale === "th"
                  ? "border-ku-primary bg-ku-primary/10"
                  : "border-ku-border"
              }`}
              onPress={async () => {
                await setLocale("th");
                setLanguageModalVisible(false);
              }}
              testID="settings-language-th"
            >
              <Text className="font-ku-semibold text-ku-control text-ku-text-strong">
                {messages.thaiLanguage}
              </Text>
              {locale === "th" ? (
                <Check color={colors.primary} size={20} strokeWidth={2.5} />
              ) : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: locale === "en" }}
              className={`mt-ku-sm min-h-[52px] flex-row items-center justify-between rounded-[14px] border px-ku-md ${
                locale === "en"
                  ? "border-ku-primary bg-ku-primary/10"
                  : "border-ku-border"
              }`}
              onPress={async () => {
                await setLocale("en");
                setLanguageModalVisible(false);
              }}
              testID="settings-language-en"
            >
              <Text className="font-ku-semibold text-ku-control text-ku-text-strong">
                {messages.englishLanguage}
              </Text>
              {locale === "en" ? (
                <Check color={colors.primary} size={20} strokeWidth={2.5} />
              ) : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="mt-ku-12 min-h-[48px] items-center justify-center rounded-[14px] active:bg-ku-surface"
              onPress={() => setLanguageModalVisible(false)}
              testID="settings-language-modal-cancel"
            >
              <Text className="font-ku-semibold text-ku-control text-ku-primary">
                {messages.cancel}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}
