import React, { useMemo, useState } from 'react';
import { cn } from '@/tw/cn';
import { Modal, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { Image, Pressable, ScrollView, Text, View } from '@/tw';
import { Award, BriefcaseBusiness, Building2, Code2, GraduationCap, Grid2X2, MessageSquare, Pencil, UserRound, X } from 'lucide-react-native';

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
  issuer: string;
  issuedYear: string;
  link: string;
  imageSource?: ImageSourcePropType;
}

export interface ProfileWork {
  id?: string;
  title: string;
  detail: string;
  imageUri: string;
  imageSource?: ImageSourcePropType;
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
  profileImage: string | ImageSourcePropType;
  about: string;
  stats: ProfileStatsData;
  experiences: ProfileExperience[];
  certificates: ProfileCertificate[];
  works: ProfileWork[];
  reviews: ProfileReview[];
  sectionErrors: ProfileSectionErrors;
}

export type ProfileTab = 'about' | 'experience' | 'works' | 'certificates' | 'reviews';
export type ProfileSection = Exclude<ProfileTab, 'about'> | 'reputation';
export type ProfileSectionErrors = Partial<Record<ProfileSection, true>>;

interface SectionNoticeProps {
  errorText?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

interface ProfileHeaderProps {
  data: Pick<ProfileViewData, 'name' | 'faculty' | 'occupation' | 'department' | 'profileImage'> & Partial<Pick<ProfileViewData, 'tags'>>;
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

function ProfileMeta({ icon: Icon, children }: { icon: typeof GraduationCap; children: string }) {
  return <View className={styles.metaRow}><Icon color={colors.text} size={16} strokeWidth={2} /><Text className={styles.meta}>{children}</Text></View>;
}

export function ProfileBrand() {
  return <View className={styles.brandRow}><Image accessibilityLabel="KUQuest" source={require('../../../../topbar-logo.svg')} className={styles.brandLogo} /></View>;
}

export function ProfileHeader({ data, editProfileLabel, onEditPress }: ProfileHeaderProps) {
  const { width } = useWindowDimensions();
  const metrics = getProfileLayoutMetrics(width);

  return (
    <View testID="profile-header" className={styles.heroCard} style={{ padding: metrics.cardPadding }}>
      <View className={styles.headerRow}>
        <View className={styles.photoFrame} style={{ borderRadius: metrics.photoSize / 2, height: metrics.photoSize, width: metrics.photoSize }}>
          {imageSource(data.profileImage) ? <Image accessibilityLabel={`${data.name} profile image`} source={imageSource(data.profileImage)} className={styles.photo} /> : <Text className={styles.initials}>{getInitials(data.name)}</Text>}
        </View>
        <View className={styles.identityContent}>
          <Text className={styles.name} style={{ fontSize: metrics.nameFontSize, lineHeight: Math.round(metrics.nameFontSize * 1.25) }}>{data.name}</Text>
          {data.occupation ? <ProfileMeta icon={GraduationCap}>{data.occupation}</ProfileMeta> : null}
          {data.faculty ? <ProfileMeta icon={Building2}>{data.faculty}</ProfileMeta> : null}
          {data.department ? <ProfileMeta icon={Code2}>{data.department}</ProfileMeta> : null}
          {(data.tags ?? []).length > 0 ? <View className={styles.tagList} accessibilityLabel="Profile skills">{(data.tags ?? []).map((tag) => <View key={tag.id ?? tag.name} className={styles.tag}><Text className={styles.tagText}>{tag.name}</Text></View>)}</View> : null}
        </View>
      </View>
      <Button onPress={onEditPress} variant="primary" className={styles.editButton} accessibilityLabel={editProfileLabel}>
        <Pencil color={colors.white} size={16} strokeWidth={2.5} />
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

export function ProfileTabs({ activeTab, labels, onChange }: { activeTab: ProfileTab; labels: Record<ProfileTab, string>; onChange: (tab: ProfileTab) => void }) {
  const tabs: { key: ProfileTab; icon: typeof UserRound }[] = [
    { key: 'about', icon: UserRound },
    { key: 'experience', icon: BriefcaseBusiness },
    { key: 'works', icon: Grid2X2 },
    { key: 'certificates', icon: Award },
    { key: 'reviews', icon: MessageSquare },
  ];

  return <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Profile sections" contentContainerClassName={styles.tabList} className={styles.tabsScroll}>{tabs.map(({ key, icon: Icon }) => <Pressable key={key} testID={`profile-tab-${key}`} accessibilityRole="tab" accessibilityLabel={labels[key]} accessibilityState={{ selected: activeTab === key }} onPress={() => onChange(key)} className={cn(styles.tab, activeTab === key && styles.tabSelected)}><Icon color={activeTab === key ? colors.primary : colors.textSecondary} size={22} strokeWidth={2} /><Text className={cn(styles.tabText, activeTab === key && styles.tabTextSelected)}>{labels[key]}</Text></Pressable>)}</ScrollView>;
}

export function ProfileStats({ stats, ratingLabel, questsLabel, reviewsLabel = 'Reviews', errorText, retryLabel, onRetry }: { stats: ProfileStatsData; ratingLabel: string; questsLabel: string; reviewsLabel?: string } & SectionNoticeProps) {
  return (
    <View testID="profile-stats" className={styles.statsCard} accessibilityLabel="Profile statistics">
      <View className={styles.statsTopRow}>
        <View className={styles.statItem}><View className={styles.statValueRow}><Text className={styles.statValue}>{stats.ratingAverage === null ? '—' : stats.ratingAverage.toFixed(1)}</Text>{stats.ratingAverage !== null ? <Text className={styles.statStar}>★</Text> : null}</View><Text className={styles.statLabel}>{ratingLabel}</Text></View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}><Text className={styles.statValue}>{stats.totalQuests === null ? '—' : stats.totalQuests}</Text><Text className={styles.statLabel}>{questsLabel}</Text></View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}><Text className={styles.statValue}>{stats.ratingCount}</Text><Text className={styles.statLabel}>{reviewsLabel}</Text></View>
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

function imageSource(uri: string | ImageSourcePropType, source?: ImageSourcePropType): ImageSourcePropType | undefined {
  if (source) return source;
  if (typeof uri === 'string') return uri ? { uri } : undefined;
  return uri;
}

function WorkImage({ title, uri, source, noImageText }: { title: string; uri: string; source?: ImageSourcePropType; noImageText: string }) {
  const [failed, setFailed] = useState(false);
  if (!imageSource(uri, source) || failed) return <View className={cn(styles.workImage, styles.imageFallback)}><Text className={styles.imageFallbackText}>{noImageText}</Text></View>;
  return <Image accessibilityLabel={`${title} image`} source={imageSource(uri, source)} onError={() => setFailed(true)} className={styles.workImage} />;
}

function CertificateImage({ title, uri, source, unavailableText }: { title: string; uri: string; source?: ImageSourcePropType; unavailableText: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedSource = imageSource(uri, source);
  if (!resolvedSource || failed) return <Text className={styles.emptyText}>{unavailableText}</Text>;
  return <Image accessibilityLabel={`${title} certificate`} source={resolvedSource} onError={() => setFailed(true)} className={styles.previewImage} contentFit="contain" />;
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

function GridRows<T>({ items, renderItem }: { items: T[]; renderItem: (item: T) => React.ReactNode }) {
  const { width } = useWindowDimensions();
  const columns = getProfileLayoutMetrics(width).gridColumns;
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += columns) rows.push(items.slice(index, index + columns));
  return <View className={styles.grid}>{rows.map((row, rowIndex) => <View key={rowIndex} className={styles.gridRow}>{row.map((item) => renderItem(item))}{columns === 2 && row.length === 1 ? <View className={styles.gridSpacer} /> : null}</View>)}</View>;
}

export function Certificates({ certificates, sectionTitle, emptyText, previewUnavailableText, closeLabel, unavailableText, errorText, retryLabel, onRetry }: { certificates: ProfileCertificate[]; sectionTitle: string; emptyText: string; previewUnavailableText: string; closeLabel: string; unavailableText: string } & SectionNoticeProps) {
  const [preview, setPreview] = useState<ProfileCertificate | null>(null);

  return <>
    <Section title={sectionTitle} errorText={errorText} retryLabel={retryLabel} onRetry={onRetry}>
      {() => certificates.length > 0 ? <GridRows items={certificates} renderItem={(certificate) => <Pressable key={certificate.id ?? `${certificate.title}-${certificate.link}`} accessibilityRole="button" accessibilityLabel={certificate.link || certificate.imageSource ? `${certificate.title} preview` : `${certificate.title} ${previewUnavailableText}`} disabled={!certificate.link && !certificate.imageSource} onPress={() => setPreview(certificate)} className={styles.certificateCard}><View className={styles.certificateImageFrame}>{imageSource(certificate.link, certificate.imageSource) ? <Image accessibilityLabel={`${certificate.title} certificate`} source={imageSource(certificate.link, certificate.imageSource)} className={styles.certificateImage} contentFit="cover" /> : <Text className={styles.imageFallbackText}>{previewUnavailableText}</Text>}</View><Text className={styles.itemTitle} numberOfLines={2}>{certificate.title}</Text><Text className={styles.certificateIssuer}>{certificate.issuer}</Text><Text className={styles.itemMeta}>{certificate.issuedYear}</Text></Pressable>} /> : <Text className={styles.emptyText}>{emptyText}</Text>}
    </Section>
    <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
      <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} className={styles.previewOverlay} onPress={() => setPreview(null)}>
        <Pressable className={styles.previewCard} onPress={(event) => event.stopPropagation()}>
          <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} className={styles.previewClose} onPress={() => setPreview(null)}><X color={colors.text} size={24} /></Pressable>
          {preview ? <CertificateImage title={preview.title} uri={preview.link} source={preview.imageSource} unavailableText={unavailableText} /> : null}
          <Text className={styles.previewTitle}>{preview?.title}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}

export function MyWork({ works, sectionTitle, emptyText, noImageText, errorText, retryLabel, onRetry }: { works: ProfileWork[]; sectionTitle: string; emptyText: string; noImageText: string } & SectionNoticeProps) {
  return <Section title={sectionTitle} errorText={errorText} retryLabel={retryLabel} onRetry={onRetry}>{() => works.length > 0 ? <GridRows items={works} renderItem={(work) => <View key={work.id ?? `${work.title}-${work.imageUri}`} className={styles.workCard}><WorkImage title={work.title} uri={work.imageUri} source={work.imageSource} noImageText={noImageText} /><Text className={styles.itemTitle} numberOfLines={2}>{work.title}</Text>{work.detail ? <Text className={styles.itemDescription}>{work.detail}</Text> : null}</View>} /> : <Text className={styles.emptyText}>{emptyText}</Text>}</Section>;
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
