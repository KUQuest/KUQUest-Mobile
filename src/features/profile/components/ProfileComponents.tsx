import React, { useMemo, useState } from 'react';
import { cn } from '@/tw/cn';
import { Modal, useWindowDimensions } from 'react-native';
import { Image, Pressable, ScrollView, Text, View } from '@/tw';
import { Award, BriefcaseBusiness, Pencil, X } from 'lucide-react-native';

import { Button } from '../../../components/ui/Button';
import { getProfileLayoutMetrics } from '../../../theme/profileLayout';
import type { ProfileLayoutMetrics } from '../../../theme/profileLayout';
import { colors } from '../../../theme/colors';
import type { SupportedLocale } from '../../../locales/LocaleProvider';
import styles from '../styles/profileComponentStyles';

export interface ProfileTag {
  id?: string;
  name: string;
  questCount?: number;
}

export interface ProfileCertificate {
  id?: string;
  title: string;
  detail: string;
  link: string;
}

export interface ProfileWork {
  id?: string;
  title: string;
  detail: string;
  imageUri: string;
}

export interface ProfileExperience {
  id?: string;
  title: string;
  employmentType: string;
  organization: string;
  description: string;
  startedAt: string;
  endedAt: string | null;
}

export interface ProfileStatsData {
  totalQuests: number | null;
  ratingAverage: number | null;
  ratingCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ProfileReview {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  questTitle: string;
}

export interface ProfileViewData {
  name: string;
  faculty: string;
  university: string;
  occupation: string;
  academicYear: string;
  department: string;
  tags: ProfileTag[];
  profileImage: string;
  about: string;
  stats: ProfileStatsData;
  experiences: ProfileExperience[];
  certificates: ProfileCertificate[];
  works: ProfileWork[];
  reviews: ProfileReview[];
  sectionErrors: ProfileSectionErrors;
}

export type ProfileSection = 'experience' | 'works' | 'certificates' | 'reputation' | 'reviews';
export type ProfileSectionErrors = Partial<Record<ProfileSection, true>>;

interface SectionNoticeProps {
  errorText?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

interface ProfileHeaderProps {
  data: Pick<ProfileViewData, 'name' | 'faculty' | 'university' | 'occupation' | 'academicYear' | 'department' | 'profileImage'> & Partial<Pick<ProfileViewData, 'tags'>>;
  editProfileLabel: string;
  onEditPress: () => void;
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return initials.toUpperCase() || '?';
}

export function ProfileHeader({ data, editProfileLabel, onEditPress }: ProfileHeaderProps) {
  const { width } = useWindowDimensions();
  const metrics = getProfileLayoutMetrics(width);

  return (
    <View testID="profile-header" className={styles.heroCard} style={{ padding: metrics.cardPadding }}>
      <View className={styles.photoFrame} style={{ borderRadius: metrics.photoSize / 2, height: metrics.photoSize, width: metrics.photoSize }}>
        {data.profileImage ? <Image accessibilityLabel={`${data.name} profile image`} source={{ uri: data.profileImage }} className={styles.photo} /> : <Text className={styles.initials}>{getInitials(data.name)}</Text>}
      </View>
      <Text className={styles.name} style={{ fontSize: metrics.nameFontSize, lineHeight: Math.round(metrics.nameFontSize * 1.3), maxWidth: '100%' }}>{data.name}</Text>
      {[data.university, data.occupation, data.academicYear].filter(Boolean).length > 0 ? <Text className={styles.meta}>{[data.university, data.occupation, data.academicYear].filter(Boolean).join(' · ')}</Text> : null}
      {data.faculty ? <Text className={styles.meta}>{data.faculty}</Text> : null}
      {data.department ? <Text className={styles.subtleMeta}>{data.department}</Text> : null}
      {(data.tags ?? []).length > 0 ? <View className={styles.tagList} accessibilityLabel="Profile skills">{(data.tags ?? []).map((tag) => <View key={tag.id ?? tag.name} className={styles.tag}><Text className={styles.tagText}>{tag.name}</Text></View>)}</View> : null}
      <Button onPress={onEditPress} variant="primary" className={styles.editButton}>
        <Pencil color={colors.white} size={14} strokeWidth={2.5} />
        <Text className={styles.editButtonText}>{editProfileLabel}</Text>
      </Button>
    </View>
  );
}

interface SectionProps {
  title: string;
  children: (metrics: ProfileLayoutMetrics) => React.ReactNode;
}

function Section({ title, children, errorText, retryLabel, onRetry }: SectionProps & SectionNoticeProps) {
  const { width } = useWindowDimensions();
  const metrics = getProfileLayoutMetrics(width);

  return (
    <View testID={`profile-section-${title}`} className={styles.section} style={{ padding: metrics.cardPadding }}>
      <Text accessibilityRole="header" className={styles.sectionTitle} style={{ fontSize: metrics.sectionTitleFontSize, lineHeight: Math.round(metrics.sectionTitleFontSize * 1.3) }}>{title}</Text>
      <View className={styles.rule} />
      {errorText ? <SectionNotice errorText={errorText} retryLabel={retryLabel} onRetry={onRetry} /> : null}
      {children(metrics)}
    </View>
  );
}

function SectionNotice({ errorText, retryLabel, onRetry }: SectionNoticeProps) {
  return <View accessibilityRole="alert" className={styles.sectionNotice}><Text className={styles.sectionNoticeText}>{errorText}</Text>{onRetry ? <Pressable accessibilityRole="button" accessibilityLabel={retryLabel} onPress={onRetry} className={styles.sectionRetry}><Text className={styles.sectionRetryText}>{retryLabel}</Text></Pressable> : null}</View>;
}

export function ProfileStats({ stats, ratingLabel, questsLabel, errorText, retryLabel, onRetry }: { stats: ProfileStatsData; ratingLabel: string; questsLabel: string } & SectionNoticeProps) {
  return (
    <View testID="profile-stats" className={styles.statsCard} accessibilityLabel="Profile statistics">
      <View className={styles.statsTopRow}>
      <View className={styles.statItem}><View className={styles.statValueRow}><Text className={styles.statValue}>{stats.ratingAverage === null ? '—' : stats.ratingAverage.toFixed(1)}</Text>{stats.ratingAverage !== null ? <Text className={styles.statStar}>★</Text> : null}</View><Text className={styles.statLabel}>{ratingLabel}</Text></View>
      <View className={styles.statDivider} />
      <View className={styles.statItem}><Text className={styles.statValue}>{stats.totalQuests === null ? '—' : stats.totalQuests}</Text><Text className={styles.statLabel}>{questsLabel}</Text></View>
      </View>
      {errorText ? <SectionNotice errorText={errorText} retryLabel={retryLabel} onRetry={onRetry} /> : null}
    </View>
  );
}

export function AboutMe({ about, sectionTitle, emptyText }: { about: string; sectionTitle: string; emptyText: string }) {
  return <Section title={sectionTitle}>{(metrics) => <Text className={styles.body} style={{ lineHeight: metrics.bodyLineHeight }}>{about || emptyText}</Text>}</Section>;
}

function formatMonth(value: string, locale: SupportedLocale = 'en'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short' }).format(date);
}

function WorkImage({ title, uri, width, noImageText }: { title: string; uri: string; width: number; noImageText: string }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) return <View className={cn(styles.workImage, styles.imageFallback)} style={{ width }}><Text className={styles.imageFallbackText}>{noImageText}</Text></View>;
  return <Image accessibilityLabel={`${title} image`} source={{ uri }} onError={() => setFailed(true)} className={styles.workImage} style={{ width }} />;
}

function CertificateImage({ title, uri, unavailableText }: { title: string; uri: string; unavailableText: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Text className={styles.emptyText}>{unavailableText}</Text>;
  return <Image accessibilityLabel={`${title} certificate`} source={{ uri }} onError={() => setFailed(true)} className={styles.previewImage} resizeMode="contain" />;
}

function ReviewAvatar({ name, uri }: { name: string; uri: string }) {
  if (uri) return <Image accessibilityLabel={`${name} avatar`} source={{ uri }} className={styles.reviewAvatar} />;
  return <View accessibilityLabel={`${name} avatar`} className={styles.reviewAvatarFallback}><Text className={styles.reviewAvatarInitials}>{getInitials(name)}</Text></View>;
}

export function Experience({ experiences, sectionTitle, emptyText, presentLabel, locale, errorText, retryLabel, onRetry }: { experiences: ProfileExperience[]; sectionTitle: string; emptyText: string; presentLabel: string; locale?: SupportedLocale } & SectionNoticeProps) {
  return (
    <Section title={sectionTitle} errorText={errorText} retryLabel={retryLabel} onRetry={onRetry}>
      {() => experiences.length > 0 ? experiences.map((experience) => <View key={experience.id ?? `${experience.title}-${experience.startedAt}`} className={styles.experience}>
        <View className={styles.timelineIcon}><BriefcaseBusiness color={colors.primaryDark} size={16} strokeWidth={2} /></View>
        <View className={styles.experienceContent}>
          <Text className={styles.itemTitle}>{experience.title}</Text>
          {experience.employmentType ? <Text className={styles.itemMeta}>{experience.employmentType}</Text> : null}
          {experience.organization ? <Text className={styles.itemMeta}>{experience.organization}</Text> : null}
          <Text className={styles.itemMeta}>{formatMonth(experience.startedAt, locale)} – {experience.endedAt ? formatMonth(experience.endedAt, locale) : presentLabel}</Text>
          {experience.description ? <Text className={styles.itemDescription}>{experience.description}</Text> : null}
        </View>
      </View>) : <Text className={styles.emptyText}>{emptyText}</Text>}
    </Section>
  );
}

export function Certificates({ certificates, sectionTitle, emptyText, previewUnavailableText, closeLabel, unavailableText, errorText, retryLabel, onRetry }: { certificates: ProfileCertificate[]; sectionTitle: string; emptyText: string; previewUnavailableText: string; closeLabel: string; unavailableText: string } & SectionNoticeProps) {
  const [preview, setPreview] = useState<ProfileCertificate | null>(null);

  return <>
    <Section title={sectionTitle} errorText={errorText} retryLabel={retryLabel} onRetry={onRetry}>
      {() => certificates.length > 0 ? certificates.map((certificate) => {
        const content = <View className={styles.itemContent}><Text className={styles.itemTitle}>{certificate.title}</Text>{certificate.detail ? <Text className={styles.itemDescription}>{certificate.detail}</Text> : null}</View>;
        return <View key={certificate.id ?? `${certificate.title}-${certificate.link}`} className={styles.listItem}>
          <Pressable accessibilityRole="button" accessibilityLabel={certificate.link ? `${certificate.title} preview` : `${certificate.title} ${previewUnavailableText}`} disabled={!certificate.link} onPress={() => setPreview(certificate)} className={styles.badge}><Award color={colors.primaryDark} size={20} strokeWidth={2} /></Pressable>
          {content}
        </View>;
      }) : <Text className={styles.emptyText}>{emptyText}</Text>}
    </Section>
    <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
      <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} className={styles.previewOverlay} onPress={() => setPreview(null)}>
        <Pressable className={styles.previewCard} onPress={(event) => event.stopPropagation()}>
          <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} className={styles.previewClose} onPress={() => setPreview(null)}><X color={colors.text} size={24} /></Pressable>
          {preview?.link ? <CertificateImage title={preview.title} uri={preview.link} unavailableText={unavailableText} /> : null}
          <Text className={styles.previewTitle}>{preview?.title}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}

export function MyWork({ works, sectionTitle, emptyText, noImageText, errorText, retryLabel, onRetry }: { works: ProfileWork[]; sectionTitle: string; emptyText: string; noImageText: string } & SectionNoticeProps) {
  return <Section title={sectionTitle} errorText={errorText} retryLabel={retryLabel} onRetry={onRetry}>{(metrics) => works.length > 0 ? <ScrollView accessibilityLabel={sectionTitle} horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={styles.workList}>{works.map((work) => <View key={work.id ?? `${work.title}-${work.imageUri}`} className={styles.workCard} style={{ width: metrics.workCardWidth }}><WorkImage title={work.title} uri={work.imageUri} width={metrics.workCardWidth} noImageText={noImageText} /><Text className={styles.itemTitle}>{work.title}</Text>{work.detail ? <Text className={styles.itemDescription}>{work.detail}</Text> : null}</View>)}</ScrollView> : <Text className={styles.emptyText}>{emptyText}</Text>}</Section>;
}

function formatReviewDate(value: string, locale: SupportedLocale = 'en'): string {
  if (locale === 'th') return formatMonth(value, locale);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function Reviews({ reviews, stats, sectionTitle, emptyText, allLabel, reviewCountLabel, locale, errorText, retryLabel, onRetry }: { reviews: ProfileReview[]; stats: ProfileStatsData; sectionTitle: string; emptyText: string; allLabel: string; reviewCountLabel: string; locale?: SupportedLocale } & SectionNoticeProps) {
  const [filter, setFilter] = useState<'all' | 5 | 4 | 3 | 2>('all');
  const filters: ('all' | 5 | 4 | 3 | 2)[] = ['all', 5, 4, 3, 2];
  const visibleReviews = useMemo(() => filter === 'all' ? reviews : reviews.filter((review) => review.rating === filter), [filter, reviews]);
  const maxDistribution = Math.max(...([5, 4, 3, 2, 1] as const).map((rating) => stats.distribution[rating]), 1);

  return <Section title={sectionTitle} errorText={errorText} retryLabel={retryLabel} onRetry={onRetry}>{() => <>
    <View className={styles.reviewSummary} accessibilityLabel="Rating summary">
      <View className={styles.reviewScore}><View className={styles.reviewScoreRow}><Text className={styles.reviewScoreValue}>{stats.ratingAverage === null ? '—' : stats.ratingAverage.toFixed(1)}</Text>{stats.ratingAverage !== null ? <Text className={styles.reviewScoreStar}>★</Text> : null}</View>{stats.ratingAverage !== null ? <Text className={styles.reviewScoreStars}>{'★'.repeat(Math.round(stats.ratingAverage))}</Text> : null}<Text className={styles.reviewCount}>{stats.ratingCount} {reviewCountLabel}</Text></View>
      <View className={styles.ratingDistribution} accessibilityLabel="Rating distribution">{([5, 4, 3, 2, 1] as const).map((rating) => <View key={rating} className={styles.ratingDistributionRow}><Text className={styles.ratingDistributionLabel}>{rating}</Text><View className={styles.ratingDistributionTrack}><View className={styles.ratingDistributionFill} style={{ width: `${(stats.distribution[rating] / maxDistribution) * 100}%` }} /></View><Text className={styles.ratingDistributionCount}>{stats.distribution[rating]}</Text></View>)}</View>
    </View>
    <View className={styles.filterList}>{filters.map((value) => <Pressable testID={`review-filter-${value}`} key={value} accessibilityRole="button" accessibilityLabel={value === 'all' ? allLabel : `${value} stars`} accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} className={cn(styles.filterChip, filter === value && styles.filterChipSelected)}><Text className={cn(styles.filterChipText, filter === value && styles.filterChipTextSelected)}>{value === 'all' ? allLabel : `${value} ★`}</Text></Pressable>)}</View>
    {visibleReviews.length > 0 ? visibleReviews.map((review) => <View key={review.id} className={styles.reviewCard}><View className={styles.reviewHeader}><ReviewAvatar name={review.reviewerName} uri={review.reviewerAvatar} /><View className={styles.reviewHeaderText}><Text className={styles.itemTitle}>{review.reviewerName}</Text><Text className={styles.itemMeta}>{formatReviewDate(review.createdAt, locale)}</Text></View></View><Text className={styles.reviewRating}>{'★'.repeat(review.rating)}</Text><Text className={styles.itemDescription}>{review.comment}</Text>{review.questTitle ? <Text className={styles.itemMeta}>{review.questTitle}</Text> : null}</View>) : <Text className={styles.emptyText}>{emptyText}</Text>}
  </>}</Section>;
}
