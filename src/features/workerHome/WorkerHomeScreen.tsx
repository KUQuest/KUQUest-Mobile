import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRightLeft, Search } from "lucide-react-native";

import { Pressable, ScrollView, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { useNavigationVisibility } from "@/components/navigation/NavigationVisibilityContext";
import { useRoleWorkspace } from "@/components/navigation/RoleWorkspaceContext";
import { questApi, type TagItem } from "@/api/QuestApi";
import type {
  QuestV2Assignment,
  QuestV2BoardCard,
} from "@/api/questV2Contracts";
import { useLocale } from "@/locales/LocaleProvider";
import { getThemeColors } from "@/theme/colors";
import { getAppChromeMetrics, getBottomNavigationInset } from "@/theme/layout";
import { spacing } from "@/theme/spacing";

import { WorkerQuestFeedCard } from "./components/WorkerQuestFeedCard";
import { WorkerQuickAccessBar } from "./components/WorkerQuickAccessBar";
import { WorkerSearchBar } from "./components/WorkerSearchBar";
import { workerHomeMessages } from "./workerHomeMessages";
import { workerHomeStyles as styles } from "./workerHomeStyles";

export default function WorkerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
  const metrics = getAppChromeMetrics(width, fontScale);
  const { handleScroll } = useNavigationVisibility();
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];
  const { switchWorkspace } = useRoleWorkspace();

  const [activeAssignments, setActiveAssignments] = useState<
    QuestV2Assignment[]
  >([]);
  const [availableQuests, setAvailableQuests] = useState<QuestV2BoardCard[]>(
    []
  );
  const [tags, setTags] = useState<TagItem[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  // Active ongoing quest for Grab-like floating bar
  const activeOngoingAssignment = useMemo(() => {
    return (
      activeAssignments.find((a) => a.state === "ASSIGNMENT_ACTIVE") ?? null
    );
  }, [activeAssignments]);

  const loadData = useCallback(
    async (q?: string, tagId?: string | null) => {
      setError(false);
      try {
        const [activeResult, boardResult, tagsResult] =
          await Promise.allSettled([
            questApi.listMyAssignments("active"),
            questApi.listBoard({
              q: q !== undefined ? q : searchQuery || undefined,
              tagId:
                tagId !== undefined
                  ? (tagId ?? undefined)
                  : (selectedTagId ?? undefined),
              limit: 20,
            }),
            tags.length === 0 ? questApi.listTags() : Promise.resolve(tags),
          ]);

        if (activeResult.status === "fulfilled") {
          setActiveAssignments(activeResult.value);
        }
        if (boardResult.status === "fulfilled") {
          setAvailableQuests(boardResult.value.items);
        }
        if (
          tagsResult.status === "fulfilled" &&
          Array.isArray(tagsResult.value)
        ) {
          setTags(tagsResult.value);
        }

        if (
          activeResult.status === "rejected" &&
          boardResult.status === "rejected"
        ) {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, selectedTagId, tags]
  );

  /* eslint-disable react-hooks/set-state-in-effect -- initial async load updates worker home state */
  useEffect(() => {
    void loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      void loadData(text, selectedTagId);
    },
    [loadData, selectedTagId]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    void loadData("", selectedTagId);
  }, [loadData, selectedTagId]);

  const handleSelectTag = useCallback(
    (tagId: string | null) => {
      setSelectedTagId(tagId);
      void loadData(searchQuery, tagId);
    },
    [loadData, searchQuery]
  );

  const handleSwitchToHirer = useCallback(() => {
    void switchWorkspace("hirer");
  }, [switchWorkspace]);

  const bottomNavInset = getBottomNavigationInset(metrics, insets.bottom);

  // Extra padding when the Grab-like quick access bar is showing
  const scrollBottomPadding =
    bottomNavInset + (activeOngoingAssignment ? 76 : 16) + spacing.xl;

  return (
    <ScreenLayout edges={["top", "left", "right"]} className="bg-ku-background">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: scrollBottomPadding,
        }}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            colors={[themeColors.primaryDeep]}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            tintColor={themeColors.primaryDeep}
          />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        testID="worker-home-scroll"
      >
        <View style={styles.screenContent}>
          {/* Header with Title: Work */}
          <View style={styles.screenHeader}>
            <View style={styles.headerTopRow}>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: themeColors.surfaceSuccess,
                    borderColor: themeColors.borderSuccess,
                  },
                ]}
                testID="worker-workspace-badge"
              >
                <View
                  style={[
                    styles.roleBadgeDot,
                    { backgroundColor: themeColors.success },
                  ]}
                />
                <Text
                  style={[styles.roleBadgeText, { color: themeColors.success }]}
                >
                  {messages.badge}
                </Text>
              </View>

              <Pressable
                accessibilityHint="Switches role to Hirer workspace"
                accessibilityLabel={messages.switchToHirer}
                accessibilityRole="button"
                onPress={handleSwitchToHirer}
                style={[
                  styles.switchRoleButton,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                  },
                ]}
                testID="switch-to-hirer-button"
              >
                <ArrowRightLeft size={13} color={themeColors.primaryDeep} />
                <Text
                  style={[
                    styles.switchRoleText,
                    { color: themeColors.primaryDeep },
                  ]}
                >
                  {messages.switchToHirer}
                </Text>
              </Pressable>
            </View>

            <Text
              accessibilityRole="header"
              style={[styles.screenTitle, { color: themeColors.textStrong }]}
              testID="worker-home-title"
            >
              {messages.workTitle}
            </Text>
            <Text
              style={[
                styles.screenSubtitle,
                { color: themeColors.textSecondary },
              ]}
            >
              {messages.subtitle}
            </Text>
          </View>

          {/* Search / Filter & Quick Tag Filter */}
          <WorkerSearchBar
            onClearQuery={handleClearSearch}
            onOpenFilter={() => {
              // Open filter or toggle search options
            }}
            onQueryChange={handleSearchChange}
            onSelectTag={handleSelectTag}
            query={searchQuery}
            selectedTagId={selectedTagId}
            tags={tags}
          />

          {/* Error Notice */}
          {error ? (
            <View
              style={[
                styles.errorState,
                {
                  backgroundColor: themeColors.surfaceMuted,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
              testID="worker-home-error"
            >
              <Text
                style={[styles.errorText, { color: themeColors.textStrong }]}
              >
                {messages.errorTitle}
              </Text>
              <Pressable
                accessibilityLabel={messages.errorRetry}
                accessibilityRole="button"
                onPress={handleRefresh}
                style={[
                  styles.retryButton,
                  { backgroundColor: themeColors.primaryDeep },
                ]}
                testID="worker-home-retry-btn"
              >
                <Text style={[styles.retryText, { color: themeColors.white }]}>
                  {messages.errorRetry}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Quests from Quest Board */}
          {loading && availableQuests.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={themeColors.primaryDeep} />
            </View>
          ) : availableQuests.length > 0 ? (
            <View style={styles.cardList} testID="worker-feed-quests-list">
              {availableQuests.map((quest) => (
                <WorkerQuestFeedCard
                  key={quest.id}
                  onPress={() => {
                    router.push({
                      pathname: "/quest/[id]",
                      params: { id: quest.id },
                    });
                  }}
                  quest={quest}
                />
              ))}
            </View>
          ) : (
            <View
              accessibilityRole="text"
              style={[
                styles.emptyState,
                {
                  backgroundColor: themeColors.surfaceMuted,
                  borderColor: themeColors.borderSubtle,
                },
              ]}
              testID="worker-feed-empty"
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: themeColors.surface },
                ]}
              >
                <Search size={22} color={themeColors.textSecondary} />
              </View>
              <Text
                style={[styles.emptyTitle, { color: themeColors.textStrong }]}
              >
                {messages.noAvailableQuestsTitle}
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  { color: themeColors.textSecondary },
                ]}
              >
                {messages.noAvailableQuestsDesc}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Grab-like Quick Access Floating Bar: (only pops up if quest that user accepted is going on) */}
      <WorkerQuickAccessBar
        assignment={activeOngoingAssignment}
        bottomInset={bottomNavInset}
        onPress={() => {
          if (activeOngoingAssignment) {
            router.push({
              pathname: "/quest/[id]/proof",
              params: { id: activeOngoingAssignment.questId },
            });
          }
        }}
      />
    </ScreenLayout>
  );
}
