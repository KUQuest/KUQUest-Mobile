import React, { useEffect, useState } from "react";
import { cn } from "@/tw/cn";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleAlert,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  ImageOff,
  LogOut,
  MapPin,
  Pencil,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { AccessibilityInfo, Alert, BackHandler } from "react-native";
import { Image, Pressable, SafeAreaView, ScrollView, Text, View } from "@/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authService } from "../auth/AuthService";
import { liveQuestService } from "./liveQuestService";
import { TopBar } from "@/components/ui/TopBar";
import {
  LoadingSkeleton,
  SkeletonBlock,
} from "@/components/ui/LoadingSkeleton";
import { useLocale } from "@/locales/LocaleProvider";
import {
  questBoardMessages,
  type QuestBoardMessages,
} from "@/locales/questBoardMessages";
import { formatSatang } from "@/domain/satang";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import styles from "./questDetailStyles";
import {
  parseBoardPreviewState,
  type BoardPreviewState,
} from "./questBoardHarness";
import {
  parseQuestDetailMode,
  parseQuestJoinStatus,
  parseQuestRouteId,
  parseStudentId,
  type QuestDetailMode,
  type QuestJoinStatus,
} from "./questRoute";
import { MAX_QUEST_IMAGES, QuestStatus, type QuestBoardQuest } from "./types";
import {
  getQuestRewardSatang,
  questWorkflow,
  type QuestViewerApplicationStatus,
} from "./questWorkflow";

export interface QuestDetailScreenProps {
  previewState?: BoardPreviewState;
  questId?: string;
  studentId?: string;
  mode?: QuestDetailMode;
  joinStatus?: QuestJoinStatus;
}

type DisplayApplicationStatus = QuestViewerApplicationStatus;

function getActionBarPaddingBottom(bottomInset: number): number {
  return Math.max(spacing.md, bottomInset + spacing.sm);
}

function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

function formatDeadline(value: string, locale: "en" | "th"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function locationLabel(
  quest: QuestBoardQuest,
  messages: QuestBoardMessages
): string {
  return quest.locationMode === "online" ? messages.online : messages.onCampus;
}

function proofLabel(
  quest: QuestBoardQuest,
  messages: QuestBoardMessages
): string {
  if (quest.proofRequired === "required") return messages.required;
  if (quest.proofRequired === "optional") return messages.optional;
  return messages.notNeeded;
}

function proofDescription(
  quest: QuestBoardQuest,
  messages: QuestBoardMessages
): string {
  if (quest.proofRequired === "required")
    return messages.proofRequiredDescription;
  if (quest.proofRequired === "optional")
    return messages.proofOptionalDescription;
  return messages.proofNotNeededDescription;
}

function candidateDescription(
  quest: QuestBoardQuest,
  messages: QuestBoardMessages
): string {
  return quest.candidateMode === "NO_CANDIDATE"
    ? messages.firstComeDescription
    : messages.reviewCandidatesDescription;
}

function NotFoundState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View accessibilityRole="alert" className={styles.section}>
      <Text className={styles.sectionTitle}>{title}</Text>
      <Text className={styles.body}>{description}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        className={styles.primaryAction}
      >
        <Text className={styles.primaryActionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function QuestDetailSkeleton({ loadingLabel }: { loadingLabel: string }) {
  const insets = useSafeAreaInsets();
  return (
    <LoadingSkeleton
      loadingLabel={loadingLabel}
      style={{ flex: 1 }}
      contentStyle={{ flex: 1 }}
      testID="quest-detail-loading-skeleton"
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerClassName={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View className={styles.header} style={{ gap: spacing.xs }}>
            <SkeletonBlock height={34} width="86%" borderRadius={6} />
            <View
              style={{
                flexDirection: "row",
                gap: spacing.xs,
                marginTop: spacing.xs,
              }}
            >
              <SkeletonBlock height={24} width={64} borderRadius={12} />
              <SkeletonBlock height={24} width={82} borderRadius={12} />
            </View>
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: spacing.sm,
                marginTop: spacing.sm,
              }}
            >
              <SkeletonBlock
                variant="image"
                height={32}
                width={32}
                borderRadius={16}
              />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonBlock height={14} width="24%" borderRadius={4} />
                <SkeletonBlock height={17} width="58%" borderRadius={4} />
              </View>
            </View>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            <SkeletonBlock
              variant="image"
              height={196}
              borderRadius={16}
              testID="quest-detail-skeleton-featured-image"
            />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <SkeletonBlock
                variant="image"
                height={76}
                borderRadius={16}
                style={{ flex: 1 }}
              />
              <SkeletonBlock
                variant="image"
                height={76}
                borderRadius={16}
                style={{ flex: 1 }}
              />
            </View>
          </View>
          <View className={styles.heroCard} style={{ gap: spacing.md }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View style={{ gap: spacing.xs }}>
                <SkeletonBlock height={14} width={54} borderRadius={4} />
                <SkeletonBlock height={28} width={126} borderRadius={5} />
              </View>
              <SkeletonBlock height={52} width={78} borderRadius={12} />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
              <SkeletonBlock height={58} borderRadius={8} style={{ flex: 1 }} />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <SkeletonBlock height={20} width={20} borderRadius={10} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonBlock height={14} width="24%" borderRadius={4} />
                <SkeletonBlock height={18} width="74%" borderRadius={4} />
                <SkeletonBlock height={14} width="38%" borderRadius={4} />
              </View>
            </View>
          </View>
          <View className={styles.scheduleCard} style={{ gap: spacing.md }}>
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: spacing.sm,
              }}
            >
              <SkeletonBlock height={36} width={36} borderRadius={18} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonBlock height={20} width="34%" borderRadius={5} />
                <SkeletonBlock height={14} width="58%" borderRadius={4} />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <SkeletonBlock height={132} width={12} borderRadius={6} />
              <View style={{ flex: 1, gap: spacing.sm }}>
                <SkeletonBlock height={18} width="46%" borderRadius={4} />
                <SkeletonBlock height={22} width="64%" borderRadius={5} />
                <SkeletonBlock height={15} width="54%" borderRadius={4} />
                <SkeletonBlock height={18} width="42%" borderRadius={4} />
                <SkeletonBlock height={22} width="58%" borderRadius={5} />
              </View>
            </View>
          </View>
          {[1, 2].map((section) => (
            <View
              key={section}
              style={{ gap: spacing.sm, marginTop: spacing.lg }}
            >
              <SkeletonBlock
                height={22}
                width={section === 1 ? 126 : 112}
                borderRadius={5}
              />
              <View
                className={styles.descriptionCard}
                style={{ gap: spacing.sm }}
              >
                <SkeletonBlock height={16} width="94%" borderRadius={4} />
                <SkeletonBlock height={16} width="78%" borderRadius={4} />
                <SkeletonBlock height={16} width="58%" borderRadius={4} />
              </View>
            </View>
          ))}
        </ScrollView>
        <View
          className={styles.actionBar}
          style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }}
          testID="quest-detail-loading-action-bar"
        >
          <SkeletonBlock height={52} borderRadius={26} />
        </View>
      </View>
    </LoadingSkeleton>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <View className={styles.requirementRow}>
      <View className={styles.requirementIcon}>
        <Icon color={colors.primary} size={20} strokeWidth={2} />
      </View>
      <View className={styles.requirementCopy}>
        <Text className={styles.requirementLabel}>{label}</Text>
        <Text className={styles.requirementValue}>{value}</Text>
        {description ? (
          <Text className={styles.requirementDescription}>{description}</Text>
        ) : null}
      </View>
    </View>
  );
}

function QuestImage({
  uri,
  index,
  messages,
  featured = false,
}: {
  uri: string;
  index: number;
  messages: QuestBoardMessages;
  featured?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const label = messages.questImageLabel(index);
  const imageClassName = cn(
    styles.questImage,
    featured ? styles.questImageFeatured : styles.questImageThumbnail
  );

  if (failed) {
    return (
      <View
        accessibilityLabel={`${label}. ${messages.imageUnavailable}`}
        className={cn(
          styles.questImageFallback,
          featured
            ? styles.questImageFallbackFeatured
            : styles.questImageFallbackThumbnail
        )}
      >
        <ImageOff color={colors.textMuted} size={24} strokeWidth={1.8} />
        <Text className={styles.questImageFallbackText}>
          {messages.imageUnavailable}
        </Text>
      </View>
    );
  }

  return (
    <Image
      accessibilityLabel={label}
      cachePolicy="memory-disk"
      contentFit="cover"
      onError={() => setFailed(true)}
      source={{ uri }}
      className={imageClassName}
    />
  );
}

function ScheduleTimeline({
  locale,
  messages,
  quest,
}: {
  locale: "en" | "th";
  messages: QuestBoardMessages;
  quest: QuestBoardQuest;
}) {
  return (
    <View
      accessibilityLabel={messages.schedule}
      className={styles.scheduleCard}
      testID="quest-schedule-timeline"
    >
      <View className={styles.scheduleHeader}>
        <View className={styles.scheduleHeaderIcon}>
          <CalendarDays color={colors.primary} size={19} strokeWidth={2} />
        </View>
        <View className={styles.scheduleHeaderCopy}>
          <Text className={styles.scheduleTitle}>{messages.schedule}</Text>
          <Text className={styles.scheduleDescription}>
            {messages.scheduleDescription}
          </Text>
        </View>
      </View>
      <View className={styles.scheduleTimeline}>
        <View className={styles.timelineRail}>
          <View className={styles.timelineDotActive} />
          <View className={styles.timelineLine} />
          <View className={styles.timelineDot} />
        </View>
        <View className={styles.timelineEvents}>
          <View className={styles.timelineEvent}>
            <Text className={styles.timelineLabel}>{messages.startWork}</Text>
            <Text className={styles.timelineDate}>
              {formatDeadline(quest.startDate, locale)}
            </Text>
            <View className={styles.timelineTimeRow}>
              <Clock3 color={colors.primary} size={15} strokeWidth={2} />
              <Text className={styles.timelineTimeLabel}>
                {messages.workWindow}
              </Text>
              <Text className={styles.timelineTime}>
                {quest.timeRange ?? messages.timeNotSpecified}
              </Text>
            </View>
          </View>
          <View className={styles.timelineEvent}>
            <Text className={styles.timelineLabel}>{messages.finishBy}</Text>
            <Text className={styles.timelineDate}>
              {formatDeadline(quest.deadline, locale)}
            </Text>
            <Text className={styles.timelineDescription}>
              {messages.finishByDescription}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function QuestDetailScreen({
  previewState,
  questId,
  studentId,
  mode,
  joinStatus,
}: QuestDetailScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  }, [router]);
  useFocusEffect(
    React.useCallback(() => {
      // Native Modal surfaces consume Android Back through onRequestClose before this focused-screen listener.
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          handleBack();
          return true;
        }
      );
      return () => subscription.remove();
    }, [handleBack])
  );
  const params = useLocalSearchParams<{
    id?: string | string[];
    intent?: string | string[];
    preview?: string | string[];
    mode?: string | string[];
    joinStatus?: string | string[];
    studentId?: string | string[];
  }>();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];
  const resolvedQuestId = parseQuestRouteId(questId ?? params.id);
  const resolvedMode = mode ?? parseQuestDetailMode(params.mode);
  const resolvedJoinStatus =
    joinStatus ?? parseQuestJoinStatus(params.joinStatus);
  const routeStudentId = parseStudentId(params.studentId);
  const explicitStudentId = studentId ?? routeStudentId;
  const [sessionStudentId, setSessionStudentId] = useState<
    string | undefined
  >();
  const [liveQuest, setLiveQuest] = useState<QuestBoardQuest | null>(null);
  const [loadedQuestId, setLoadedQuestId] = useState<string | undefined>();
  const loadingQuest = Boolean(
    resolvedQuestId && loadedQuestId !== resolvedQuestId
  );
  useEffect(() => {
    if (explicitStudentId) return undefined;
    let active = true;
    void authService
      .getSession()
      .then((session) => {
        if (!active) return;
        const id = parseStudentId(session?.user.id);
        if (id) setSessionStudentId(id);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [explicitStudentId]);
  const resolvedPreview =
    previewState ?? parseBoardPreviewState(params.preview);
  useEffect(() => {
    if (!resolvedQuestId) return undefined;
    let active = true;
    void liveQuestService
      .getQuestDetail(resolvedQuestId)
      .then((nextQuest) => {
        if (active) {
          setLiveQuest(nextQuest);
          setLoadedQuestId(resolvedQuestId);
        }
      })
      .catch(() => {
        if (active) {
          setLiveQuest(null);
          setLoadedQuestId(resolvedQuestId);
        }
      });
    return () => {
      active = false;
    };
  }, [resolvedQuestId]);
  const applicationStudentId = explicitStudentId ?? sessionStudentId ?? "";
  const isJoinView = resolvedMode === "join";
  const isPostView = resolvedMode === "post";
  const liveQuestForRoute =
    liveQuest?.id === resolvedQuestId ? liveQuest : null;
  const quest = liveQuestForRoute;
  const applicationStatusHydrated = Boolean(liveQuestForRoute);
  const previewApplicationStatus: DisplayApplicationStatus =
    resolvedPreview === "application-pending"
      ? "pending"
      : resolvedPreview === "application-accepted"
        ? "accepted"
        : "none";
  const availability =
    resolvedPreview === "full"
      ? "full"
      : resolvedPreview === "closed"
        ? "closed"
        : liveQuestForRoute
          ? liveQuestForRoute.status === QuestStatus.QUEST_OPEN
            ? "available"
            : "closed"
          : undefined;
  const imageUris = quest?.imageUris?.slice(0, MAX_QUEST_IMAGES) ?? [];
  const joinedStatus: QuestJoinStatus | undefined =
    isJoinView && applicationStatusHydrated
      ? (resolvedJoinStatus ?? "accepted")
      : undefined;
  const firstCome = quest?.candidateMode === "NO_CANDIDATE";
  const [leftQuest, setLeftQuest] = useState(false);
  const statusTitle = isPostView
    ? messages.postOwnerView
    : isJoinView
      ? leftQuest
        ? messages.leftQuest
        : joinedStatus === "history"
          ? messages.historyQuest
          : joinedStatus === "accepted"
            ? messages.participationConfirmed
            : joinedStatus === "pending"
              ? messages.applicationPending
              : ""
      : previewApplicationStatus === "accepted"
        ? firstCome
          ? messages.participationConfirmed
          : messages.applicationAccepted
        : previewApplicationStatus === "pending"
          ? messages.applicationPending
          : availability === "full"
            ? messages.questFull
            : availability === "closed"
              ? messages.applicationsClosed
              : "";
  const statusIsUnavailable =
    !isJoinView &&
    !isPostView &&
    availability !== "available" &&
    previewApplicationStatus === "none";
  const statusDescription = isPostView
    ? messages.postOwnerViewDescription
    : isJoinView
      ? leftQuest
        ? messages.leftQuestDescription
        : joinedStatus === "history"
          ? messages.historyQuestDescription
          : joinedStatus === "accepted"
            ? messages.applicationAcceptedDescription
            : messages.applicationPendingDescription
      : previewApplicationStatus === "accepted"
        ? messages.applicationAcceptedDescription
        : previewApplicationStatus === "pending"
          ? messages.applicationPendingDescription
          : messages.unavailableApplication;
  const StatusIcon = statusIsUnavailable
    ? CircleAlert
    : isPostView
      ? BriefcaseBusiness
      : leftQuest
        ? LogOut
        : Check;
  const statusIconColor = statusIsUnavailable
    ? colors.textMuted
    : leftQuest
      ? colors.dangerDark
      : colors.primary;

  const handleLeaveQuest = () => {
    if (!quest || (joinedStatus !== "pending" && joinedStatus !== "accepted"))
      return;
    const isPending = joinedStatus === "pending";
    const label = isPending
      ? messages.withdrawApplication
      : messages.leaveQuest;
    const description = isPending
      ? messages.withdrawApplicationDescription
      : messages.leaveQuestDescription;
    Alert.alert(label, description, [
      { text: messages.cancel, style: "cancel" },
      {
        text: label,
        style: "destructive",
        onPress: () => {
          const result = isPending
            ? questWorkflow.dispatch({
                type: "WITHDRAW_APPLICATION",
                questId: quest.id,
                workerId: applicationStudentId,
              })
            : undefined;
          if (result && !result.ok) {
            Alert.alert(messages.details, result.error.message);
            return;
          }
          setLeftQuest(true);
          announce(messages.leftQuest);
        },
      },
    ]);
  };

  const handleEditPost = () => {
    if (!quest) return;
    router.push({ pathname: "/create", params: { editQuestId: quest.id } });
  };

  const applicationStatusPending = Boolean(quest) && !applicationStatusHydrated;
  const questPending =
    loadingQuest || resolvedPreview === "loading" || applicationStatusPending;
  if (questPending) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <TopBar
          backLabel={messages.back}
          onBackPress={handleBack}

          title={messages.details}
          variant="detail"
        />
        <QuestDetailSkeleton loadingLabel={messages.loading} />
      </SafeAreaView>
    );
  }

  if (!quest) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <TopBar
          backLabel={messages.back}
          onBackPress={handleBack}

          title={messages.details}
          variant="detail"
        />
        <NotFoundState
          title={messages.questNotFound}
          description={messages.questNotFoundDescription}
          actionLabel={messages.back}
          onAction={handleBack}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
      <TopBar
        backLabel={messages.back}
        onBackPress={handleBack}

        title={messages.details}
        variant="detail"
      />
      <ScrollView
        contentContainerClassName={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View className={styles.header}>
          <Text accessibilityRole="header" className={styles.title}>
            {quest.title}
          </Text>
          <View className={styles.creatorRow}>
            <View className={styles.creatorAvatar}>
              <CircleUserRound
                color={colors.primary}
                size={17}
                strokeWidth={2}
              />
            </View>
            <View className={styles.creatorCopy}>
              <Text className={styles.creatorLabel}>{messages.creator}</Text>
              <Text
                className={styles.creatorValue}
                numberOfLines={1}
              >{`${quest.creator.name}${quest.creator.faculty ? ` · ${quest.creator.faculty}` : ""}`}</Text>
            </View>
          </View>
          <View accessibilityLabel={messages.tags} className={styles.tagRow}>
            {quest.tags.map((tag) => (
              <Text key={tag} className={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        </View>
        {imageUris.length > 0 ? (
          <View
            accessibilityLabel={messages.imageCount(imageUris.length)}
            className={styles.imageGallery}
          >
            <QuestImage
              featured
              index={1}
              messages={messages}
              uri={imageUris[0]}
            />
            {imageUris.length > 1 ? (
              <View className={styles.imageThumbnailRow}>
                {imageUris.slice(1).map((uri, index) => (
                  <QuestImage
                    key={`${uri}-${index + 1}`}
                    index={index + 2}
                    messages={messages}
                    uri={uri}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
        <View className={styles.heroCard}>
          <View className={styles.heroPrimary}>
            <View>
              <Text className={styles.heroLabel}>{messages.reward}</Text>
              <Text
                className={styles.heroRewardValue}
              >{`${formatSatang(getQuestRewardSatang(quest), locale)} ${messages.perPerson}`}</Text>
            </View>
            <View className={styles.heroSpots}>
              <Text className={styles.heroSpotsLabel}>{messages.spots}</Text>
              <Text
                className={styles.heroSpotsValue}
              >{`${quest.acceptedParticipants}/${quest.headcount}`}</Text>
            </View>
          </View>
          <View className={styles.heroDetails}>
            <View className={styles.heroItem}>
              <View className={styles.heroItemIcon}>
                <UsersRound color={colors.primary} size={17} strokeWidth={2} />
              </View>
              <View className={styles.heroItemCopy}>
                <Text className={styles.heroLabel}>
                  {messages.participation}
                </Text>
                <Text className={styles.heroValue}>
                  {quest.participationMode === "team"
                    ? messages.team
                    : messages.singlePerson}
                </Text>
              </View>
            </View>
            <View className={cn(styles.heroItem, styles.heroItemDivider)}>
              <View className={styles.heroItemIcon}>
                <CircleUserRound
                  color={colors.primary}
                  size={17}
                  strokeWidth={2}
                />
              </View>
              <View className={styles.heroItemCopy}>
                <Text className={styles.heroLabel}>
                  {messages.candidateMode}
                </Text>
                <Text className={styles.heroValue}>
                  {quest.candidateMode === "NO_CANDIDATE"
                    ? messages.firstCome
                    : messages.reviewCandidates}
                </Text>
              </View>
            </View>
          </View>
          <View className={styles.heroLocation}>
            <MapPin color={colors.primary} size={20} strokeWidth={2} />
            <View className={styles.heroLocationCopy}>
              <Text className={styles.heroLabel}>{messages.location}</Text>
              <Text className={styles.heroLocationValue}>{quest.location}</Text>
              <Text className={styles.heroDetail}>
                {locationLabel(quest, messages)}
              </Text>
            </View>
          </View>
        </View>
        <ScheduleTimeline locale={locale} messages={messages} quest={quest} />
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>{messages.description}</Text>
          <View className={styles.descriptionCard}>
            <Text className={styles.body}>{quest.description}</Text>
          </View>
        </View>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>{messages.requirements}</Text>
          <View className={styles.requirementCard}>
            <DetailRow
              icon={ClipboardCheck}
              label={messages.completionCriteria}
              value={quest.completionCriteria}
            />
            <DetailRow
              icon={Check}
              label={messages.proofRequired}
              value={proofLabel(quest, messages)}
              description={proofDescription(quest, messages)}
            />
            <DetailRow
              icon={UsersRound}
              label={messages.candidateMode}
              value={
                quest.candidateMode === "NO_CANDIDATE"
                  ? messages.firstCome
                  : messages.reviewCandidates
              }
              description={candidateDescription(quest, messages)}
            />
            <DetailRow
              icon={BriefcaseBusiness}
              label={messages.participation}
              value={
                quest.participationMode === "team"
                  ? messages.team
                  : messages.singlePerson
              }
            />
          </View>
        </View>
        {statusTitle ? (
          <View
            accessibilityRole="alert"
            className={cn(
              styles.statusCard,
              statusIsUnavailable && styles.statusCardBlocked,
              isPostView && styles.statusCardOwner,
              (leftQuest || joinedStatus === "history") &&
                styles.statusCardMuted
            )}
          >
            <StatusIcon color={statusIconColor} size={25} strokeWidth={2.2} />
            <Text className={styles.statusTitle}>{statusTitle}</Text>
            <Text className={styles.statusDescription}>
              {statusDescription}
            </Text>
            {!statusIsUnavailable && !isPostView && !leftQuest ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/my-quests")}
                className={styles.statusAction}
                testID="view-my-quests"
              >
                <Text className={styles.statusActionText}>
                  {messages.viewMyQuests}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      {isPostView ? (
        <View
          className={styles.actionBar}
          style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={handleEditPost}
            className={styles.primaryAction}
            testID="quest-edit-post-button"
          >
            <Pencil color={colors.white} size={19} strokeWidth={2.2} />
            <Text className={styles.primaryActionText}>
              {messages.editPost}
            </Text>
          </Pressable>
        </View>
      ) : isJoinView && !leftQuest && joinedStatus !== "history" ? (
        <View
          className={styles.actionBar}
          style={{ paddingBottom: getActionBarPaddingBottom(insets.bottom) }}
          testID="quest-action-bar"
        >
          <View className={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={handleLeaveQuest}
              className={styles.leaveAction}
              testID="quest-leave-button"
            >
              <LogOut color={colors.dangerDark} size={19} strokeWidth={2.2} />
              <Text className={styles.leaveActionText}>
                {joinedStatus === "pending"
                  ? messages.withdrawApplication
                  : messages.leaveQuest}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
