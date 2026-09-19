import { BriefcaseBusiness } from "lucide-react-native";
import { Text, View } from "@/tw";
import { colors } from "../../../theme/colors";
import type { SupportedLocale } from "@/locales/locale";
import styles from "../styles/profileComponentStyles";
import type { ProfileExperience } from "./profileTypes";
import { EmptyState, Section, type SectionNoticeProps } from "./ProfileSection";

const monthFormatters: Record<SupportedLocale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
  }),
  th: new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
  }),
};

function formatMonth(value: string, locale: SupportedLocale = "en"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return monthFormatters[locale].format(date);
}

export function Experience({
  experiences,
  sectionTitle,
  emptyText,
  presentLabel,
  locale,
  emptyActionLabel,
  onEditPress,
  sectionBottomMargin,
  errorText,
  retryLabel,
  onRetry,
}: {
  experiences: ProfileExperience[];
  sectionTitle: string;
  emptyText: string;
  presentLabel: string;
  locale?: SupportedLocale;
  emptyActionLabel?: string;
  onEditPress?: () => void;
  sectionBottomMargin?: number;
} & SectionNoticeProps) {
  return (
    <Section
      title={sectionTitle}
      bottomMargin={sectionBottomMargin}
      errorText={errorText}
      retryLabel={retryLabel}
      onRetry={onRetry}
    >
      {() =>
        experiences.length > 0 ? (
          experiences.map((experience) => (
            <View
              key={
                experience.id ?? `${experience.title}-${experience.startedAt}`
              }
              className={styles.experience}
            >
              <View className={styles.timelineIcon}>
                <BriefcaseBusiness
                  color={colors.primaryDark}
                  size={16}
                  strokeWidth={2}
                />
              </View>
              <View className={styles.experienceContent}>
                <Text className={styles.itemTitle} maxFontSizeMultiplier={2}>
                  {experience.title}
                </Text>
                {experience.employmentType ? (
                  <Text className={styles.itemMeta} maxFontSizeMultiplier={2}>
                    {experience.employmentType}
                  </Text>
                ) : null}
                {experience.organization ? (
                  <Text className={styles.itemMeta} maxFontSizeMultiplier={2}>
                    {experience.organization}
                  </Text>
                ) : null}
                <Text className={styles.itemMeta} maxFontSizeMultiplier={2}>
                  {formatMonth(experience.startedAt, locale)} –{" "}
                  {experience.endedAt
                    ? formatMonth(experience.endedAt, locale)
                    : presentLabel}
                </Text>
                {experience.description ? (
                  <Text
                    className={styles.itemDescription}
                    maxFontSizeMultiplier={2}
                  >
                    {experience.description}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            message={emptyText}
            actionLabel={emptyActionLabel}
            onAction={onEditPress}
          />
        )
      }
    </Section>
  );
}
