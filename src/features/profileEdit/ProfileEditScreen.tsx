import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, Pencil, Plus } from "lucide-react-native";
import type { ProfileEditData } from "../../api/StudentApi";
import { useProfileEditDataQuery } from "../profile/api/profileQueries";
import { isPrototypeDemoEnabled } from "../auth/authEnvironment";
import { profileEditMessages } from "../../locales/profileEditMessages";
import { useLocale } from "@/features/preferences/localeStore";
import { Button } from "../../components/ui/Button";
import { Image, Pressable, ScrollView, Text, View } from "../../tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { ScreenLayout } from "../../components/layout/ScreenLayout";
import styles from "./profileEditStyles";
import type {
  CertificateEntry,
  ExperienceEntry,
  PortfolioEntry,
} from "../../api/contracts";
import { ScreenHeader } from "./components/ProfileEditFormParts";
import {
  ErrorState,
  ProfileEditLoadingState,
  UnavailableState,
  type ProfileEditLoadingVariant,
} from "./components/ProfileEditStates";
import {
  isProfileEditSessionExpired as isSessionExpired,
  useProfileEditSessionExpiryRedirect as useSessionExpiryRedirect,
} from "./sessionHandling";
import {
  BasicsEditorScreen,
  CertificateEditorScreen,
  ExperienceEditorScreen,
  PortfolioEditorScreen,
} from "./screens/ProfileEditEditorScreens";
type EditSection = "basics" | "experience" | "portfolio" | "certificates";
type HubSectionKey = EditSection | "academic-registration";

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function HubContent({ data }: { data: ProfileEditData }) {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const [academicUnavailable, setAcademicUnavailable] = useState(
    () =>
      isPrototypeDemoEnabled() ||
      process.env.EXPO_PUBLIC_PROFILE_DEMO === "true"
  );
  const openAcademicRegistration = () => {
    if (
      isPrototypeDemoEnabled() ||
      process.env.EXPO_PUBLIC_PROFILE_DEMO === "true"
    ) {
      setAcademicUnavailable(true);
      return;
    }
    router.push("/onboarding?mode=edit");
  };
  const sections: {
    key: HubSectionKey;
    title: string;
    summary: string;
    onPress: () => void;
  }[] = [
    {
      key: "basics",
      title: messages.basics,
      summary: messages.basicsSummary,
      onPress: () => router.push("/profile/edit/basics"),
    },
    {
      key: "academic-registration",
      title: messages.academicRegistration,
      summary: academicUnavailable
        ? messages.unavailable
        : messages.academicRegistrationSummary,
      onPress: openAcademicRegistration,
    },
    {
      key: "experience",
      title: messages.experience,
      summary:
        data.sectionUnavailable.experience || data.sectionErrors.experience
          ? messages.unavailable
          : messages.experienceSummary(data.experiences.length),
      onPress: () => router.push("/profile/edit/experience"),
    },
    {
      key: "portfolio",
      title: messages.portfolio,
      summary:
        data.sectionUnavailable.portfolio || data.sectionErrors.portfolio
          ? messages.unavailable
          : messages.portfolioSummary(data.portfolio.length),
      onPress: () => router.push("/profile/edit/portfolio"),
    },
    {
      key: "certificates",
      title: messages.certificates,
      summary:
        data.sectionUnavailable.certificates || data.sectionErrors.certificates
          ? messages.unavailable
          : messages.certificatesSummary(data.certificates.length),
      onPress: () => router.push("/profile/edit/certificates"),
    },
  ];

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <ScrollView
        contentContainerClassName={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={messages.title}
          backLabel={messages.back}
          onBack={() => router.back()}
        />
        <Text className={styles.intro}>{messages.basicsSummary}</Text>
        <View className={styles.sectionList}>
          {sections.map((section) => (
            <Pressable
              key={section.key}
              testID={`profile-edit-section-${section.key}`}
              accessibilityRole="button"
              className={styles.sectionRow}
              onPress={section.onPress}
            >
              <View className={styles.sectionRowContent}>
                <Text className={styles.sectionRowTitle}>{section.title}</Text>
                <Text className={styles.sectionRowSummary}>
                  {section.summary}
                </Text>
              </View>
              <ChevronRight
                color={colors.textMuted}
                size={22}
                strokeWidth={2}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

export function EditProfileHubScreen() {
  const router = useRouter();
  return (
    <ProfileEditDataLoader loadingVariant="hub" onBack={() => router.back()}>
      {(data) => <HubContent data={data} />}
    </ProfileEditDataLoader>
  );
}

function SectionListScreen({
  section,
  data,
  onBack,
}: {
  section: Exclude<EditSection, "basics">;
  data: ProfileEditData;
  onBack: () => void;
}) {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const title =
    section === "experience"
      ? messages.experienceSection
      : section === "portfolio"
        ? messages.portfolioSection
        : messages.certificatesSection;
  const items =
    section === "experience"
      ? data.experiences
      : section === "portfolio"
        ? data.portfolio
        : data.certificates;
  const openItem = (id?: string) =>
    router.push(
      `/profile/edit/${section}?itemId=${encodeURIComponent(id ?? "new")}`
    );

  return (
    <ScreenLayout edges={["top", "left", "right"]} className={styles.safeArea}>
      <ScrollView
        contentContainerClassName={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={title} backLabel={messages.back} onBack={onBack} />
        {data.sectionUnavailable[section] ? (
          <UnavailableState message={messages.unavailable} />
        ) : data.sectionErrors[section] ? (
          <ErrorState
            message={messages.sectionLoadError}
            retry={() => router.replace(`/profile/edit/${section}`)}
            retryLabel={messages.retry}
          />
        ) : items.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>{messages.noItems}</Text>
          </View>
        ) : (
          <View className={styles.sectionList}>
            {items.map((item) =>
              section === "experience" ? (
                <ExperienceRow
                  key={(item as ExperienceEntry).id}
                  entry={item as ExperienceEntry}
                  presentLabel={messages.present}
                  onPress={() => openItem((item as ExperienceEntry).id)}
                />
              ) : section === "portfolio" ? (
                <PortfolioRow
                  key={(item as PortfolioEntry).id}
                  entry={item as PortfolioEntry}
                  noImageLabel={messages.noImage}
                  onPress={() => openItem((item as PortfolioEntry).id)}
                />
              ) : (
                <CertificateRow
                  key={(item as CertificateEntry).id}
                  entry={item as CertificateEntry}
                  noImageLabel={messages.noImage}
                  onPress={() => openItem((item as CertificateEntry).id)}
                />
              )
            )}
          </View>
        )}
        {data.sectionUnavailable[section] ||
        data.sectionErrors[section] ? null : (
          <Button
            variant="secondary"
            className={styles.addButton}
            onPress={() => openItem()}
            accessibilityLabel={messages.add}
          >
            <Plus color={colors.primary} size={18} />
            <Text className={styles.addButtonText}>{messages.add}</Text>
          </Button>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

function ExperienceRow({
  entry,
  presentLabel,
  onPress,
}: {
  entry: ExperienceEntry;
  presentLabel: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      className={styles.itemRow}
      onPress={onPress}
    >
      <View className={styles.itemRowContent}>
        <Text className={styles.itemTitle}>{entry.title}</Text>
        <Text className={styles.itemMeta}>
          {entry.organization || entry.employmentType}
        </Text>
        <Text className={styles.itemDescription}>
          {entry.endedAt
            ? `${entry.startedAt} – ${entry.endedAt}`
            : `${entry.startedAt} – ${presentLabel}`}
        </Text>
      </View>
      <Pencil color={colors.primary} size={18} />
    </Pressable>
  );
}

function PortfolioRow({
  entry,
  noImageLabel,
  onPress,
}: {
  entry: PortfolioEntry;
  noImageLabel: string;
  onPress: () => void;
}) {
  const image = entry.images[0]?.url;
  const [imageFailed, setImageFailed] = useState(false);
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      className={styles.itemRow}
      onPress={onPress}
    >
      {image && !imageFailed ? (
        <Image
          source={{ uri: image }}
          onError={() => setImageFailed(true)}
          className={styles.itemImage}
          contentFit="cover"
        />
      ) : (
        <View className={styles.itemImageFallback}>
          <Text className={styles.itemImageFallbackText}>{noImageLabel}</Text>
        </View>
      )}
      <View className={styles.itemRowContent}>
        <Text className={styles.itemTitle}>{entry.title}</Text>
        {entry.description ? (
          <Text className={styles.itemDescription} numberOfLines={2}>
            {entry.description}
          </Text>
        ) : null}
      </View>
      <Pencil color={colors.primary} size={18} />
    </Pressable>
  );
}

function CertificateRow({
  entry,
  noImageLabel,
  onPress,
}: {
  entry: CertificateEntry;
  noImageLabel: string;
  onPress: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      className={styles.itemRow}
      onPress={onPress}
    >
      {entry.image && !imageFailed ? (
        <Image
          source={{ uri: entry.image.url }}
          onError={() => setImageFailed(true)}
          className={styles.itemImage}
          contentFit="cover"
        />
      ) : (
        <View className={styles.itemImageFallback}>
          <Text className={styles.itemImageFallbackText}>{noImageLabel}</Text>
        </View>
      )}
      <View className={styles.itemRowContent}>
        <Text className={styles.itemTitle}>{entry.name}</Text>
        <Text className={styles.itemMeta}>{entry.issuer}</Text>
        <Text className={styles.itemDescription}>{entry.issuedAt}</Text>
      </View>
      <Pencil color={colors.primary} size={18} />
    </Pressable>
  );
}

function ProfileEditDataLoader({
  children,
  loadingVariant,
  onBack,
}: {
  children: (data: ProfileEditData) => React.ReactNode;
  loadingVariant: ProfileEditLoadingVariant;
  onBack: () => void;
}) {
  const redirectIfSessionExpired = useSessionExpiryRedirect();
  const { locale } = useLocale();
  const messages = profileEditMessages[locale];
  const {
    data,
    error: queryError,
    isPending,
    refetch,
  } = useProfileEditDataQuery();
  const redirectedToRoot = useRef(false);
  useEffect(() => {
    if (
      !queryError ||
      redirectedToRoot.current ||
      !isSessionExpired(queryError)
    )
      return;
    redirectedToRoot.current = true;
    void redirectIfSessionExpired(queryError);
  }, [queryError, redirectIfSessionExpired]);
  if (queryError && !data && !isSessionExpired(queryError))
    return (
      <ScreenLayout
        edges={["top", "left", "right"]}
        className={styles.safeArea}
      >
        <ScrollView contentContainerClassName={styles.scrollContent}>
          <ScreenHeader
            title={messages.title}
            backLabel={messages.back}
            onBack={onBack}
          />
          <ErrorState
            message={messages.loadError}
            retry={() => void refetch()}
            retryLabel={messages.retry}
          />
        </ScrollView>
      </ScreenLayout>
    );
  if (isPending || !data)
    return (
      <ProfileEditLoadingState
        messages={messages}
        onBack={onBack}
        variant={loadingVariant}
      />
    );
  return <>{children(data)}</>;
}

export default function ProfileEditSectionScreen() {
  const router = useRouter();
  const { section: rawSection, itemId: rawItemId } = useLocalSearchParams<{
    section?: string | string[];
    itemId?: string | string[];
  }>();
  const section = getParam(rawSection) as EditSection | undefined;
  const itemId = getParam(rawItemId);
  const onBack = () => router.back();

  const loadingVariant: ProfileEditLoadingVariant =
    section === "basics"
      ? "basics-editor"
      : section === "experience"
        ? itemId
          ? "experience-editor"
          : "experience-list"
        : section === "portfolio"
          ? itemId
            ? "portfolio-editor"
            : "portfolio-list"
          : section === "certificates" && itemId
            ? "certificates-editor"
            : "certificates-list";

  return (
    <ProfileEditDataLoader loadingVariant={loadingVariant} onBack={onBack}>
      {(data) => {
        if (section === "basics")
          return <BasicsEditorScreen data={data} onBack={onBack} />;
        if (section === "experience") {
          if (data.sectionUnavailable.experience) {
            return (
              <SectionListScreen
                section="experience"
                data={data}
                onBack={onBack}
              />
            );
          }
          const entry = data.experiences.find((item) => item.id === itemId);
          return itemId === "new" ? (
            <ExperienceEditorScreen onBack={onBack} />
          ) : itemId && entry ? (
            <ExperienceEditorScreen entry={entry} onBack={onBack} />
          ) : (
            <SectionListScreen
              section="experience"
              data={data}
              onBack={onBack}
            />
          );
        }
        if (section === "portfolio") {
          if (data.sectionUnavailable.portfolio) {
            return (
              <SectionListScreen
                section="portfolio"
                data={data}
                onBack={onBack}
              />
            );
          }
          const entry = data.portfolio.find((item) => item.id === itemId);
          return itemId === "new" ? (
            <PortfolioEditorScreen onBack={onBack} />
          ) : itemId && entry ? (
            <PortfolioEditorScreen entry={entry} onBack={onBack} />
          ) : (
            <SectionListScreen
              section="portfolio"
              data={data}
              onBack={onBack}
            />
          );
        }
        if (section === "certificates") {
          if (data.sectionUnavailable.certificates) {
            return (
              <SectionListScreen
                section="certificates"
                data={data}
                onBack={onBack}
              />
            );
          }
          const entry = data.certificates.find((item) => item.id === itemId);
          return itemId === "new" ? (
            <CertificateEditorScreen onBack={onBack} />
          ) : itemId && entry ? (
            <CertificateEditorScreen entry={entry} onBack={onBack} />
          ) : (
            <SectionListScreen
              section="certificates"
              data={data}
              onBack={onBack}
            />
          );
        }
        return (
          <SectionListScreen section="experience" data={data} onBack={onBack} />
        );
      }}
    </ProfileEditDataLoader>
  );
}
