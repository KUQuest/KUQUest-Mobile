import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Award, X } from 'lucide-react-native';

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
  department: string;
  tags: ProfileTag[];
  profileImage: string;
  about: string;
  stats: ProfileStatsData;
  experiences: ProfileExperience[];
  certificates: ProfileCertificate[];
  works: ProfileWork[];
  reviews: ProfileReview[];
}

interface ProfileHeaderProps {
  data: Pick<ProfileViewData, 'name' | 'faculty' | 'occupation' | 'department' | 'profileImage'> & Partial<Pick<ProfileViewData, 'university' | 'tags'>>;
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
    <View style={[styles.heroCard, { padding: metrics.cardPadding }]}>
      <View style={[styles.photoFrame, { borderRadius: metrics.photoSize / 2, height: metrics.photoSize, width: metrics.photoSize }]}>
        {data.profileImage ? <Image accessibilityLabel={`${data.name} profile image`} source={{ uri: data.profileImage }} style={styles.photo} /> : <Text style={styles.initials}>{getInitials(data.name)}</Text>}
      </View>
      <Text style={[styles.name, { fontSize: metrics.nameFontSize, lineHeight: Math.round(metrics.nameFontSize * 1.3), maxWidth: '100%' }]}>{data.name}</Text>
      {data.faculty ? <Text style={styles.meta}>{data.faculty}</Text> : null}
      {data.university ? <Text style={styles.subtleMeta}>{data.university}</Text> : null}
      {data.occupation ? <Text style={styles.subtleMeta}>{data.occupation}</Text> : null}
      {data.department ? <Text style={styles.subtleMeta}>{data.department}</Text> : null}
      {(data.tags ?? []).length > 0 ? <View style={styles.tagList} accessibilityLabel="Profile skills">{(data.tags ?? []).map((tag) => <View key={tag.id ?? tag.name} style={styles.tag}><Text style={styles.tagText}>{tag.name}</Text></View>)}</View> : null}
      <Button onPress={onEditPress} variant="secondary" style={styles.editButton}>{editProfileLabel}</Button>
    </View>
  );
}

interface SectionProps {
  title: string;
  children: (metrics: ProfileLayoutMetrics) => React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  const { width } = useWindowDimensions();
  const metrics = getProfileLayoutMetrics(width);

  return (
    <View style={[styles.section, { padding: metrics.cardPadding }]}>
      <Text style={[styles.sectionTitle, { fontSize: metrics.sectionTitleFontSize, lineHeight: Math.round(metrics.sectionTitleFontSize * 1.3) }]}>{title}</Text>
      <View style={styles.rule} />
      {children(metrics)}
    </View>
  );
}

export function ProfileStats({ stats, ratingLabel, questsLabel, reviewCountLabel, emptyText }: { stats: ProfileStatsData; ratingLabel: string; questsLabel: string; reviewCountLabel: string; emptyText: string }) {
  return (
    <View style={styles.statsCard} accessibilityLabel="Profile statistics">
      <View style={styles.statsTopRow}>
      <View style={styles.statItem}><Text style={styles.statValue}>{stats.ratingAverage === null ? '—' : stats.ratingAverage.toFixed(1)}</Text><Text style={styles.statLabel}>{ratingLabel}</Text>{stats.ratingCount > 0 ? <Text style={styles.statDetail}>{stats.ratingCount} {reviewCountLabel}</Text> : <Text style={styles.statDetail}>{emptyText}</Text>}</View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}><Text style={styles.statValue}>{stats.totalQuests === null ? '—' : stats.totalQuests}</Text><Text style={styles.statLabel}>{questsLabel}</Text></View>
      </View>
      <View style={styles.ratingDistribution} accessibilityLabel="Rating distribution">{([5, 4, 3, 2, 1] as const).map((rating) => <View key={rating} style={styles.ratingDistributionRow}><Text style={styles.ratingDistributionLabel}>{rating}</Text><View style={styles.ratingDistributionTrack}><View style={[styles.ratingDistributionFill, { width: `${stats.ratingCount ? (stats.distribution[rating] / stats.ratingCount) * 100 : 0}%` }]} /></View><Text style={styles.ratingDistributionCount}>{stats.distribution[rating]}</Text></View>)}</View>
    </View>
  );
}

export function AboutMe({ about, sectionTitle, emptyText }: { about: string; sectionTitle: string; emptyText: string }) {
  return <Section title={sectionTitle}>{(metrics) => <Text style={[styles.body, { lineHeight: metrics.bodyLineHeight }]}>{about || emptyText}</Text>}</Section>;
}

function formatMonth(value: string, locale: SupportedLocale = 'en'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short' }).format(date);
}

function WorkImage({ title, uri, width, noImageText }: { title: string; uri: string; width: number; noImageText: string }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) return <View style={[styles.workImage, styles.imageFallback, { width }]}><Text style={styles.imageFallbackText}>{noImageText}</Text></View>;
  return <Image accessibilityLabel={`${title} image`} source={{ uri }} onError={() => setFailed(true)} style={[styles.workImage, { width }]} />;
}

function CertificateImage({ title, uri, unavailableText }: { title: string; uri: string; unavailableText: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Text style={styles.emptyText}>{unavailableText}</Text>;
  return <Image accessibilityLabel={`${title} certificate`} source={{ uri }} onError={() => setFailed(true)} style={styles.previewImage} resizeMode="contain" />;
}

export function Experience({ experiences, sectionTitle, emptyText, presentLabel, locale }: { experiences: ProfileExperience[]; sectionTitle: string; emptyText: string; presentLabel: string; locale?: SupportedLocale }) {
  return (
    <Section title={sectionTitle}>
      {() => experiences.length > 0 ? experiences.map((experience) => <View key={experience.id ?? `${experience.title}-${experience.startedAt}`} style={styles.experience}>
        <View style={styles.timelineDot} />
        <View style={styles.experienceContent}>
          <Text style={styles.itemTitle}>{experience.title}</Text>
          {experience.organization ? <Text style={styles.itemMeta}>{experience.organization}</Text> : null}
          <Text style={styles.itemMeta}>{formatMonth(experience.startedAt, locale)} – {experience.endedAt ? formatMonth(experience.endedAt, locale) : presentLabel}</Text>
          {experience.description ? <Text style={styles.itemDescription}>{experience.description}</Text> : null}
        </View>
      </View>) : <Text style={styles.emptyText}>{emptyText}</Text>}
    </Section>
  );
}

export function Certificates({ certificates, sectionTitle, emptyText, previewUnavailableText, closeLabel, unavailableText }: { certificates: ProfileCertificate[]; sectionTitle: string; emptyText: string; previewUnavailableText: string; closeLabel: string; unavailableText: string }) {
  const [preview, setPreview] = useState<ProfileCertificate | null>(null);

  return <>
    <Section title={sectionTitle}>
      {() => certificates.length > 0 ? certificates.map((certificate) => {
        const content = <View style={styles.itemContent}><Text style={styles.itemTitle}>{certificate.title}</Text>{certificate.detail ? <Text style={styles.itemDescription}>{certificate.detail}</Text> : null}</View>;
        return <View key={certificate.id ?? `${certificate.title}-${certificate.link}`} style={styles.listItem}>
          <Pressable accessibilityRole="button" accessibilityLabel={certificate.link ? `${certificate.title} preview` : `${certificate.title} ${previewUnavailableText}`} disabled={!certificate.link} onPress={() => setPreview(certificate)} style={styles.badge}><Award color={colors.primaryDark} size={20} strokeWidth={2} /></Pressable>
          {content}
        </View>;
      }) : <Text style={styles.emptyText}>{emptyText}</Text>}
    </Section>
    <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
      <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} style={styles.previewOverlay} onPress={() => setPreview(null)}>
        <Pressable style={styles.previewCard} onPress={(event) => event.stopPropagation()}>
          <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} style={styles.previewClose} onPress={() => setPreview(null)}><X color={colors.text} size={24} /></Pressable>
          {preview?.link ? <CertificateImage title={preview.title} uri={preview.link} unavailableText={unavailableText} /> : null}
          <Text style={styles.previewTitle}>{preview?.title}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}

export function MyWork({ works, sectionTitle, emptyText, noImageText }: { works: ProfileWork[]; sectionTitle: string; emptyText: string; noImageText: string }) {
  return <Section title={sectionTitle}>{(metrics) => works.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workList}>{works.map((work) => <View key={work.id ?? `${work.title}-${work.imageUri}`} style={[styles.workCard, { width: metrics.workCardWidth }]}><WorkImage title={work.title} uri={work.imageUri} width={metrics.workCardWidth} noImageText={noImageText} /><Text style={styles.itemTitle}>{work.title}</Text>{work.detail ? <Text style={styles.itemDescription}>{work.detail}</Text> : null}</View>)}</ScrollView> : <Text style={styles.emptyText}>{emptyText}</Text>}</Section>;
}

export function Reviews({ reviews, sectionTitle, emptyText, allLabel, locale }: { reviews: ProfileReview[]; sectionTitle: string; emptyText: string; allLabel: string; locale?: SupportedLocale }) {
  const [filter, setFilter] = useState<'all' | 5 | 4 | 3 | 2>('all');
  const filters: ('all' | 5 | 4 | 3 | 2)[] = ['all', 5, 4, 3, 2];
  const visibleReviews = useMemo(() => filter === 'all' ? reviews : reviews.filter((review) => review.rating === filter), [filter, reviews]);

  return <Section title={sectionTitle}>{() => <>
    <View style={styles.filterList}>{filters.map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={value === 'all' ? allLabel : `${value} stars`} accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={[styles.filterChip, filter === value && styles.filterChipSelected]}><Text style={[styles.filterChipText, filter === value && styles.filterChipTextSelected]}>{value === 'all' ? allLabel : `${value} ★`}</Text></Pressable>)}</View>
    {visibleReviews.length > 0 ? visibleReviews.map((review) => <View key={review.id} style={styles.reviewCard}><View style={styles.reviewHeader}>{review.reviewerAvatar ? <Image accessibilityLabel={`${review.reviewerName} avatar`} source={{ uri: review.reviewerAvatar }} style={styles.reviewAvatar} /> : null}<View style={styles.reviewHeaderText}><Text style={styles.itemTitle}>{review.reviewerName}</Text><Text style={styles.itemMeta}>{formatMonth(review.createdAt, locale)}</Text></View></View><Text style={styles.reviewRating}>{'★'.repeat(review.rating)}</Text><Text style={styles.itemDescription}>{review.comment}</Text>{review.questTitle ? <Text style={styles.itemMeta}>{review.questTitle}</Text> : null}</View>) : <Text style={styles.emptyText}>{emptyText}</Text>}
  </>}</Section>;
}
