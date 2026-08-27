import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/tw/cn';
import { AccessibilityInfo, Modal, useWindowDimensions, type ImageSourcePropType, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { FlatList, Image, Pressable, ScrollView, Text, View } from '@/tw';
import { BriefcaseBusiness, Building2, Code2, GraduationCap, MessageSquare, Pencil, Settings2, Star, UserRound, X } from 'lucide-react-native';

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
  imageUris?: string[];
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

export interface ProfileImageSource {
  uri: string;
  cacheKey?: string;
}

export interface ProfileViewData {
  name: string;
  faculty: string;
  university: string;
  occupation: string;
  academicYear: string;
  department: string;
  tags: ProfileTag[];
  profileImage: string | ImageSourcePropType | ProfileImageSource;
  about: string;
  stats: ProfileStatsData;
  experiences: ProfileExperience[];
  certificates: ProfileCertificate[];
  works: ProfileWork[];
  reviews: ProfileReview[];
  sectionErrors: ProfileSectionErrors;
}

export type ProfileTab = 'about' | 'portfolio' | 'reviews';
export type ProfileSection = 'experience' | 'works' | 'certificates' | 'reviews' | 'reputation';
export type ProfileSectionErrors = Partial<Record<ProfileSection, true>>;

export interface ProfileAccessibilityLabels {
  profileImageLabel: (name: string) => string;
  questCategoriesLabel: string;
  sectionsLabel: string;
  statisticsLabel: string;
  ratingSummaryLabel: string;
  ratingDistributionLabel: string;
  reviewRatingLabel: (rating: number) => string;
  certificatePreviewLabel: (title: string) => string;
  certificateImageLabel: (title: string) => string;
  workImageLabel: (title: string) => string;
  reviewerAvatarLabel: (name: string) => string;
  reviewFilterLabel: (rating: number) => string;
}

const defaultAccessibilityLabels: ProfileAccessibilityLabels = {
  profileImageLabel: (name) => `${name} profile image`,
  questCategoriesLabel: 'Most frequent Quest categories',
  sectionsLabel: 'Profile sections',
  statisticsLabel: 'Profile statistics',
  ratingSummaryLabel: 'Rating summary',
  ratingDistributionLabel: 'Rating distribution',
  reviewRatingLabel: (rating) => `${rating} out of 5 stars`,
  certificatePreviewLabel: (title) => `${title} preview`,
  certificateImageLabel: (title) => `${title} certificate`,
  workImageLabel: (title) => `${title} image`,
  reviewerAvatarLabel: (name) => `${name} avatar`,
  reviewFilterLabel: (rating) => `${rating} stars`,
};

function useReducedMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

interface SectionNoticeProps {
  errorText?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

interface ProfileHeaderProps {
  data: Pick<ProfileViewData, 'name' | 'faculty' | 'occupation' | 'department' | 'profileImage'> & Partial<Pick<ProfileViewData, 'tags'>>;
  settingsLabel?: string;
  onSettingsPress?: () => void;
  editProfileLabel?: string;
  onEditPress?: () => void;
  accessibilityLabels?: Pick<ProfileAccessibilityLabels, 'profileImageLabel' | 'questCategoriesLabel'>;
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
  return <View className={styles.metaRow}><Icon color={colors.textSecondary} size={16} strokeWidth={2} /><Text className={styles.meta} maxFontSizeMultiplier={2}>{children}</Text></View>;
}

export function ProfileHeader({ data, settingsLabel, onSettingsPress, editProfileLabel, onEditPress, accessibilityLabels }: ProfileHeaderProps) {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getProfileLayoutMetrics(width, fontScale);
  const labels = { ...defaultAccessibilityLabels, ...accessibilityLabels };
  const [failedProfileImage, setFailedProfileImage] = useState<ProfileViewData['profileImage'] | null>(null);
  const profileImage = imageSource(data.profileImage);
  const profileImageFailed = failedProfileImage === data.profileImage;

  return (
    <View testID="profile-header" className={styles.heroCard} style={{ padding: metrics.cardPadding }}>
      {settingsLabel && onSettingsPress ? <Pressable accessibilityLabel={settingsLabel} accessibilityRole="button" className={styles.profileSettingsButton} onPress={onSettingsPress} testID="open-settings">
        <Settings2 color={colors.primary} size={20} strokeWidth={2.2} />
      </Pressable> : null}
      <View className={cn(styles.headerRow, settingsLabel && onSettingsPress && styles.headerRowWithSettings)}>
        <View className={styles.photoFrame} style={{ borderRadius: metrics.photoSize / 2, height: metrics.photoSize, width: metrics.photoSize }}>
          {profileImage && !profileImageFailed ? <Image accessibilityLabel={labels.profileImageLabel(data.name)} source={profileImage} onError={() => setFailedProfileImage(data.profileImage)} className={styles.photo} /> : <Text accessibilityLabel={labels.profileImageLabel(data.name)} className={styles.initials}>{getInitials(data.name)}</Text>}
        </View>
        <View className={styles.identityContent}>
          <Text className={styles.name} maxFontSizeMultiplier={2} style={{ fontSize: metrics.nameFontSize, lineHeight: Math.round(metrics.nameFontSize * 1.25) }}>{data.name}</Text>
          {data.occupation ? <ProfileMeta icon={GraduationCap}>{data.occupation}</ProfileMeta> : null}
          {data.faculty ? <ProfileMeta icon={Building2}>{data.faculty}</ProfileMeta> : null}
          {data.department ? <ProfileMeta icon={Code2}>{data.department}</ProfileMeta> : null}
        </View>
      </View>
      {(data.tags ?? []).length > 0 ? <View className={styles.tagGroup}>
        <Text accessibilityRole="header" className={styles.tagGroupLabel} maxFontSizeMultiplier={2}>{labels.questCategoriesLabel}</Text>
        <View className={styles.tagList}>{(data.tags ?? []).map((tag) => <View key={tag.id ?? tag.name} className={styles.tag}><Text className={styles.tagText} maxFontSizeMultiplier={2}>{tag.name}</Text></View>)}</View>
      </View> : null}
      {editProfileLabel && onEditPress ? <Button onPress={onEditPress} variant="primary" className={styles.editButton} accessibilityLabel={editProfileLabel}>
        <Pencil color={colors.white} size={16} strokeWidth={2.5} />
        <Text className={styles.editButtonText}>{editProfileLabel}</Text>
      </Button> : null}
    </View>
  );
}

interface SectionProps {
  title: string;
  children: (metrics: ProfileLayoutMetrics) => React.ReactNode;
  bottomMargin?: number;
}

function EmptyState({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return <View className={styles.emptyState}><Text className={styles.emptyText} maxFontSizeMultiplier={2}>{message}</Text>{actionLabel && onAction ? <Pressable accessibilityRole="button" className={styles.emptyAction} onPress={onAction}><Text className={styles.emptyActionText}>{actionLabel}</Text></Pressable> : null}</View>;
}

function Section({ title, children, bottomMargin = 0, errorText, retryLabel, onRetry }: SectionProps & SectionNoticeProps) {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getProfileLayoutMetrics(width, fontScale);

  return (
    <View testID={`profile-section-${title}`} className={styles.section} style={{ marginBottom: bottomMargin, padding: metrics.cardPadding }}>
      <Text accessibilityRole="header" className={styles.sectionTitle} maxFontSizeMultiplier={2} style={{ fontSize: metrics.sectionTitleFontSize, lineHeight: Math.round(metrics.sectionTitleFontSize * 1.3) }}>{title}</Text>
      <View className={styles.rule} />
      {errorText ? <SectionNotice errorText={errorText} retryLabel={retryLabel} onRetry={onRetry} /> : null}
      {errorText ? null : children(metrics)}
    </View>
  );
}

function SectionNotice({ errorText, retryLabel, onRetry }: SectionNoticeProps) {
  return <View accessibilityRole="alert" className={styles.sectionNotice}><Text className={styles.sectionNoticeText}>{errorText}</Text>{onRetry ? <Pressable accessibilityRole="button" accessibilityLabel={retryLabel} onPress={onRetry} className={styles.sectionRetry}><Text className={styles.sectionRetryText}>{retryLabel}</Text></Pressable> : null}</View>;
}

export function ProfileTabs({ activeTab, labels, onChange, accessibilityLabel = defaultAccessibilityLabels.sectionsLabel }: { activeTab: ProfileTab; labels: Record<ProfileTab, string>; onChange: (tab: ProfileTab) => void; accessibilityLabel?: string }) {
  const { fontScale } = useWindowDimensions();
  const tabScale = Math.max(1, fontScale);
  const tabWidth = Math.ceil(70 * tabScale);
  const tabHeight = Math.ceil(72 * tabScale);
  const tabs: { key: ProfileTab; icon: typeof UserRound }[] = [
    { key: 'about', icon: UserRound },
    { key: 'portfolio', icon: BriefcaseBusiness },
    { key: 'reviews', icon: MessageSquare },
  ];

  return <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={accessibilityLabel} contentContainerClassName={styles.tabList} contentContainerStyle={{ flexGrow: 1 }} className={styles.tabsScroll}>{tabs.map(({ key, icon: Icon }) => <Pressable key={key} testID={`profile-tab-${key}`} accessibilityRole="tab" accessibilityLabel={labels[key]} accessibilityState={{ selected: activeTab === key }} onPress={() => onChange(key)} className={cn(styles.tab, activeTab === key && styles.tabSelected)} style={{ flex: 1, minWidth: tabWidth, minHeight: tabHeight }}><Icon color={activeTab === key ? colors.primary : colors.textSecondary} size={22} strokeWidth={2} /><Text maxFontSizeMultiplier={2} className={cn(styles.tabText, activeTab === key && styles.tabTextSelected)} style={{ lineHeight: Math.ceil(14 * tabScale) }}>{labels[key]}</Text></Pressable>)}</ScrollView>;
}

export function ProfileStats({ stats, ratingLabel, questsLabel, reviewsLabel = 'Reviews', noRatingLabel = 'No ratings yet', accessibilityLabel = defaultAccessibilityLabels.statisticsLabel, errorText, retryLabel, onRetry }: { stats: ProfileStatsData; ratingLabel: string; questsLabel: string; reviewsLabel?: string; noRatingLabel?: string; accessibilityLabel?: string } & SectionNoticeProps) {
  const ratingText = stats.ratingAverage === null ? noRatingLabel : stats.ratingAverage.toFixed(1);
  return (
    <View testID="profile-stats" className={styles.statsCard} accessibilityLabel={accessibilityLabel}>
      {errorText ? null : <View className={styles.statsTopRow}>
        <View className={styles.statItem}><View className={styles.statValueRow}><Text accessibilityLabel={`${ratingLabel}: ${ratingText}`} maxFontSizeMultiplier={2} className={cn(styles.statValue, stats.ratingAverage === null && styles.statEmptyValue)}>{ratingText}</Text>{stats.ratingAverage !== null ? <Text accessible={false} className={styles.statStar}>★</Text> : null}</View><Text className={styles.statLabel} maxFontSizeMultiplier={2}>{ratingLabel}</Text></View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}><Text accessibilityLabel={`${questsLabel}: ${stats.totalQuests === null ? '—' : stats.totalQuests}`} maxFontSizeMultiplier={2} className={styles.statValue}>{stats.totalQuests === null ? '—' : stats.totalQuests}</Text><Text className={styles.statLabel} maxFontSizeMultiplier={2}>{questsLabel}</Text></View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}><Text accessibilityLabel={`${reviewsLabel}: ${stats.ratingCount}`} maxFontSizeMultiplier={2} className={styles.statValue}>{stats.ratingCount}</Text><Text className={styles.statLabel} maxFontSizeMultiplier={2}>{reviewsLabel}</Text></View>
      </View>}
      {errorText ? <SectionNotice errorText={errorText} retryLabel={retryLabel} onRetry={onRetry} /> : null}
    </View>
  );
}

export function AboutMe({ about, sectionTitle, emptyText, emptyActionLabel, onEditPress }: { about: string; sectionTitle: string; emptyText: string; emptyActionLabel?: string; onEditPress?: () => void }) {
  return <Section title={sectionTitle}>{(metrics) => about ? <Text className={styles.body} maxFontSizeMultiplier={2} style={{ lineHeight: metrics.bodyLineHeight }}>{about}</Text> : <EmptyState message={emptyText} actionLabel={emptyActionLabel} onAction={onEditPress} />}</Section>;
}

function formatMonth(value: string, locale: SupportedLocale = 'en'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short' }).format(date);
}

function imageSource(uri: string | ImageSourcePropType | ProfileImageSource, source?: ImageSourcePropType): ImageSourcePropType | ProfileImageSource | undefined {
  if (source) return source;
  if (typeof uri === 'string') return uri ? { uri } : undefined;
  return uri;
}

function WorkImage({ title, uri, source, noImageText, imageLabel }: { title: string; uri: string; source?: ImageSourcePropType; noImageText: string; imageLabel: string }) {
  const [failed, setFailed] = useState(false);
  if (!imageSource(uri, source) || failed) return <View className={cn(styles.workImage, styles.imageFallback)} style={{ aspectRatio: 4 / 3 }}><Text className={styles.imageFallbackText}>{noImageText}</Text></View>;
  return <Image accessibilityLabel={imageLabel} source={imageSource(uri, source)} onError={() => setFailed(true)} className={styles.workImage} style={{ aspectRatio: 4 / 3 }} contentFit="cover" />;
}

function CertificateImage({ uri, source, unavailableText, imageLabel, previewHeight, onFailed }: { uri: string; source?: ImageSourcePropType; unavailableText: string; imageLabel: string; previewHeight: number; onFailed: () => void }) {
  const [failed, setFailed] = useState(false);
  const resolvedSource = imageSource(uri, source);
  if (!resolvedSource || failed) return <Text className={styles.emptyText}>{unavailableText}</Text>;
  return <Image testID="certificate-preview-image" accessibilityLabel={imageLabel} source={resolvedSource} onError={() => { setFailed(true); onFailed(); }} className={styles.previewImage} style={{ height: previewHeight, width: '100%' }} contentFit="contain" />;
}

function ReviewAvatar({ name, uri, accessibilityLabel }: { name: string; uri: string; accessibilityLabel: string }) {
  const [failed, setFailed] = useState(false);
  if (uri && !failed) return <Image accessibilityLabel={accessibilityLabel} source={{ uri }} onError={() => setFailed(true)} className={styles.reviewAvatar} />;
  return <View accessibilityLabel={accessibilityLabel} className={styles.reviewAvatarFallback}><Text className={styles.reviewAvatarInitials}>{getInitials(name)}</Text></View>;
}

export function Experience({ experiences, sectionTitle, emptyText, presentLabel, locale, emptyActionLabel, onEditPress, sectionBottomMargin, errorText, retryLabel, onRetry }: { experiences: ProfileExperience[]; sectionTitle: string; emptyText: string; presentLabel: string; locale?: SupportedLocale; emptyActionLabel?: string; onEditPress?: () => void; sectionBottomMargin?: number } & SectionNoticeProps) {
  return (
    <Section title={sectionTitle} bottomMargin={sectionBottomMargin} errorText={errorText} retryLabel={retryLabel} onRetry={onRetry}>
      {() => experiences.length > 0 ? experiences.map((experience) => <View key={experience.id ?? `${experience.title}-${experience.startedAt}`} className={styles.experience}>
        <View className={styles.timelineIcon}><BriefcaseBusiness color={colors.primaryDark} size={16} strokeWidth={2} /></View>
        <View className={styles.experienceContent}>
          <Text className={styles.itemTitle} maxFontSizeMultiplier={2}>{experience.title}</Text>
          {experience.employmentType ? <Text className={styles.itemMeta} maxFontSizeMultiplier={2}>{experience.employmentType}</Text> : null}
          {experience.organization ? <Text className={styles.itemMeta} maxFontSizeMultiplier={2}>{experience.organization}</Text> : null}
          <Text className={styles.itemMeta} maxFontSizeMultiplier={2}>{formatMonth(experience.startedAt, locale)} – {experience.endedAt ? formatMonth(experience.endedAt, locale) : presentLabel}</Text>
          {experience.description ? <Text className={styles.itemDescription} maxFontSizeMultiplier={2}>{experience.description}</Text> : null}
        </View>
      </View>) : <EmptyState message={emptyText} actionLabel={emptyActionLabel} onAction={onEditPress} />}
    </Section>
  );
}

function GridRows<T>({ items, renderItem }: { items: T[]; renderItem: (item: T) => React.ReactNode }) {
  const { width, fontScale } = useWindowDimensions();
  const columns = getProfileLayoutMetrics(width, fontScale).gridColumns;
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += columns) rows.push(items.slice(index, index + columns));
  return <View className={styles.grid}>{rows.map((row, rowIndex) => <View key={rowIndex} className={styles.gridRow}>{row.map((item) => renderItem(item))}{columns === 2 && row.length === 1 ? <View className={styles.gridSpacer} /> : null}</View>)}</View>;
}

function CertificateThumbnail({ certificate, unavailableText, imageLabel, failed, onFailed }: { certificate: ProfileCertificate; unavailableText: string; imageLabel: string; failed: boolean; onFailed: () => void }) {
  const source = imageSource(certificate.link, certificate.imageSource);
  if (!source || failed) return <Text className={styles.imageFallbackText}>{unavailableText}</Text>;
  return <Image accessibilityLabel={imageLabel} source={source} onError={onFailed} className={styles.certificateImage} contentFit="cover" />;
}

export function Certificates({ certificates, sectionTitle, emptyText, previewUnavailableText, closeLabel, unavailableText, previewLabel = 'View certificate preview', emptyActionLabel, onEditPress, accessibilityLabels, errorText, retryLabel, onRetry }: { certificates: ProfileCertificate[]; sectionTitle: string; emptyText: string; previewUnavailableText: string; closeLabel: string; unavailableText: string; previewLabel?: string; emptyActionLabel?: string; onEditPress?: () => void; accessibilityLabels?: Pick<ProfileAccessibilityLabels, 'certificatePreviewLabel' | 'certificateImageLabel'> } & SectionNoticeProps) {
  const { height } = useWindowDimensions();
  const [preview, setPreview] = useState<ProfileCertificate | null>(null);
  const [failedCertificateIds, setFailedCertificateIds] = useState<Set<string>>(() => new Set());
  const labels = { ...defaultAccessibilityLabels, ...accessibilityLabels };
  const reduceMotion = useReducedMotionPreference();
  const previewHeight = Math.min(520, Math.max(280, Math.round(height * 0.58)));

  return <>
    <Section title={sectionTitle} errorText={errorText} retryLabel={retryLabel} onRetry={onRetry}>
      {() => certificates.length > 0 ? <GridRows items={certificates} renderItem={(certificate) => {
        const certificateKey = certificate.id ?? `${certificate.title}-${certificate.link}`;
        const hasPreview = Boolean(imageSource(certificate.link, certificate.imageSource)) && !failedCertificateIds.has(certificateKey);
        return <Pressable key={certificateKey} accessibilityRole="button" accessibilityLabel={hasPreview ? labels.certificatePreviewLabel(certificate.title) : `${certificate.title} ${previewUnavailableText}`} disabled={!hasPreview} onPress={() => setPreview(certificate)} className={styles.certificateCard}>
          <View className={styles.certificateImageFrame} style={{ aspectRatio: 4 / 3 }}><CertificateThumbnail certificate={certificate} unavailableText={previewUnavailableText} imageLabel={labels.certificateImageLabel(certificate.title)} failed={failedCertificateIds.has(certificateKey)} onFailed={() => setFailedCertificateIds((current) => new Set(current).add(certificateKey))} /></View>
          <Text className={styles.itemTitle} numberOfLines={2}>{certificate.title}</Text>{hasPreview ? <Text className={styles.previewHint}>{previewLabel}</Text> : null}<Text className={styles.certificateIssuer}>{certificate.issuer}</Text><Text className={styles.itemMeta}>{certificate.issuedYear}</Text>
        </Pressable>;
      }} /> : <EmptyState message={emptyText} actionLabel={emptyActionLabel} onAction={onEditPress} />}
    </Section>
    <Modal visible={Boolean(preview)} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => setPreview(null)}>
      <Pressable accessible={false} className={styles.previewOverlay} onPress={() => setPreview(null)}>
        <Pressable accessible={false} accessibilityViewIsModal className={styles.previewCard} onPress={(event) => event.stopPropagation()}>
          <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} className={styles.previewClose} onPress={() => setPreview(null)}><X color={colors.text} size={24} /></Pressable>
          {preview ? <ScrollView className={styles.previewScroll} style={{ height: previewHeight, width: '100%' }} showsVerticalScrollIndicator={false}><CertificateImage uri={preview.link} source={preview.imageSource} unavailableText={unavailableText} imageLabel={labels.certificateImageLabel(preview.title)} previewHeight={previewHeight} onFailed={() => {
            const certificateKey = preview.id ?? `${preview.title}-${preview.link}`;
            setFailedCertificateIds((current) => new Set(current).add(certificateKey));
          }} /></ScrollView> : null}
          <Text className={styles.previewTitle}>{preview?.title}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}

export function MyWork({ works, sectionTitle, emptyText, noImageText, viewLabel, closeLabel, emptyActionLabel, onEditPress, accessibilityLabels, sectionBottomMargin, errorText, retryLabel, onRetry }: { works: ProfileWork[]; sectionTitle: string; emptyText: string; noImageText: string; viewLabel: string; closeLabel: string; emptyActionLabel?: string; onEditPress?: () => void; accessibilityLabels?: Pick<ProfileAccessibilityLabels, 'workImageLabel'>; sectionBottomMargin?: number } & SectionNoticeProps) {
  const { width, height } = useWindowDimensions();
  const labels = { ...defaultAccessibilityLabels, ...accessibilityLabels };
  const [selectedWork, setSelectedWork] = useState<ProfileWork | null>(null);
  const reduceMotion = useReducedMotionPreference();
  const galleryImageWidth = Math.min(width - 40, 360);
  const galleryImageHeight = Math.min(320, Math.max(220, Math.round(height * 0.4)));
  const workImages = selectedWork
    ? (selectedWork.imageUris?.length ? selectedWork.imageUris : selectedWork.imageUri ? [selectedWork.imageUri] : selectedWork.imageSource ? [selectedWork.imageSource] : [])
    : [];

  return <>
    <Section title={sectionTitle} bottomMargin={sectionBottomMargin} errorText={errorText} retryLabel={retryLabel} onRetry={onRetry}>{() => works.length > 0 ? <GridRows items={works} renderItem={(work) => <Pressable key={work.id ?? `${work.title}-${work.imageUri}`} accessibilityRole="button" accessibilityLabel={`${work.title}: ${viewLabel}`} onPress={() => setSelectedWork(work)} className={styles.workCard}><WorkImage title={work.title} uri={work.imageUri} source={work.imageSource} noImageText={noImageText} imageLabel={labels.workImageLabel(work.title)} /><Text className={styles.itemTitle} numberOfLines={2} maxFontSizeMultiplier={2}>{work.title}</Text>{work.detail ? <Text className={styles.itemDescription} numberOfLines={3} maxFontSizeMultiplier={2}>{work.detail}</Text> : null}<Text className={styles.previewHint}>{viewLabel}</Text></Pressable>} /> : <EmptyState message={emptyText} actionLabel={emptyActionLabel} onAction={onEditPress} />}</Section>
    <Modal visible={Boolean(selectedWork)} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => setSelectedWork(null)}>
      <Pressable accessible={false} className={styles.previewOverlay} onPress={() => setSelectedWork(null)}>
        <Pressable accessible={false} accessibilityViewIsModal className={styles.workDetailSheet} onPress={(event) => event.stopPropagation()}>
          <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} className={styles.previewClose} onPress={() => setSelectedWork(null)}><X color={colors.text} size={24} /></Pressable>
          <ScrollView showsVerticalScrollIndicator={false} className={styles.workDetailScroll} contentContainerClassName={styles.workDetailContent}>
            <Text accessibilityRole="header" className={styles.workDetailTitle}>{selectedWork?.title}</Text>
            {workImages.length > 0 ? <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} className={styles.workGallery}>{workImages.map((image, index) => <Image key={index} accessibilityLabel={`${labels.workImageLabel(selectedWork?.title ?? '')} ${index + 1}`} source={imageSource(image)} className={styles.workGalleryImage} style={{ height: galleryImageHeight, width: galleryImageWidth }} contentFit="contain" />)}</ScrollView> : <View className={cn(styles.workGalleryImage, styles.imageFallback)} style={{ height: galleryImageHeight, width: galleryImageWidth }}><Text className={styles.imageFallbackText}>{noImageText}</Text></View>}
            {selectedWork?.detail ? <Text className={styles.workDetailDescription}>{selectedWork.detail}</Text> : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}

function formatReviewDate(value: string, locale: SupportedLocale = 'en'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function ReviewCard({ review, locale, reviewerAvatarLabel, reviewRatingLabel }: { review: ProfileReview; locale?: SupportedLocale; reviewerAvatarLabel: (name: string) => string; reviewRatingLabel: (rating: number) => string }) {
  return <View className={styles.reviewCard}>
    <View className={styles.reviewHeader}>
      <ReviewAvatar name={review.reviewerName} uri={review.reviewerAvatar} accessibilityLabel={reviewerAvatarLabel(review.reviewerName)} />
      <View className={styles.reviewHeaderText}>
        <Text className={styles.itemTitle}>{review.reviewerName}</Text>
        <Text className={styles.itemMeta}>{formatReviewDate(review.createdAt, locale)}</Text>
      </View>
    </View>
    <View accessibilityLabel={reviewRatingLabel(review.rating)} className={styles.reviewRating}>{[1, 2, 3, 4, 5].map((star) => <Star accessible={false} key={star} color={star <= review.rating ? colors.primaryDark : colors.borderSubtle} fill={star <= review.rating ? colors.primaryDark : 'transparent'} size={14} strokeWidth={1.8} />)}</View>
    <Text className={styles.itemDescription}>{review.comment}</Text>
    {review.questTitle ? <Text className={styles.itemMeta}>{review.questTitle}</Text> : null}
  </View>;
}

export function Reviews({ reviews, stats, sectionTitle, emptyText, noMatchingReviewsText = 'No reviews match this rating.', showAllLabel = 'Show all reviews', allLabel, eligibleReviewsLabel, filteredReviewsLabel, reviewCountLabel, totalQuestsLabel, noRatingLabel = 'No ratings yet', ratingErrorText, accessibilityLabels, locale, listHeader, bottomPadding = 96, initialScrollOffset = 0, onScroll, errorText, retryLabel, onRetry }: { reviews: ProfileReview[]; stats: ProfileStatsData; sectionTitle: string; emptyText: string; noMatchingReviewsText?: string; showAllLabel?: string; allLabel: string; eligibleReviewsLabel: (count: number) => string; filteredReviewsLabel: (count: number, rating: number) => string; reviewCountLabel: string; totalQuestsLabel?: string; noRatingLabel?: string; ratingErrorText?: string; accessibilityLabels?: Pick<ProfileAccessibilityLabels, 'ratingSummaryLabel' | 'ratingDistributionLabel' | 'reviewerAvatarLabel' | 'reviewFilterLabel' | 'reviewRatingLabel'>; locale?: SupportedLocale; listHeader?: React.ReactElement | null; bottomPadding?: number; initialScrollOffset?: number; onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void } & SectionNoticeProps) {
  const { width, fontScale } = useWindowDimensions();
  const metrics = getProfileLayoutMetrics(width, fontScale);
  const [filter, setFilter] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const labels = { ...defaultAccessibilityLabels, ...accessibilityLabels };
  const visibleReviews = useMemo(() => filter === null ? reviews : reviews.filter((review) => review.rating === filter), [filter, reviews]);
  const maxDistribution = Math.max(...([5, 4, 3, 2, 1] as const).map((rating) => stats.distribution[rating]), 1);
  const distribution = <View className={styles.ratingDistribution} accessibilityLabel={labels.ratingDistributionLabel}>{([5, 4, 3, 2, 1] as const).map((rating) => <Pressable testID={`review-filter-${rating}`} key={rating} accessibilityRole="button" accessibilityLabel={`${labels.reviewFilterLabel(rating)}: ${stats.distribution[rating]} ${reviewCountLabel}`} accessibilityState={{ selected: filter === rating }} onPress={() => setFilter((current) => current === rating ? null : rating)} className={cn(styles.ratingDistributionRow, filter === rating && styles.ratingDistributionRowSelected)}><Text className={styles.ratingDistributionLabel}>{rating}</Text><View className={styles.ratingDistributionTrack}><View className={styles.ratingDistributionFill} style={{ width: `${(stats.distribution[rating] / maxDistribution) * 100}%` }} /></View><Text className={styles.ratingDistributionCount}>{stats.distribution[rating]}</Text></Pressable>)}</View>;
  const reviewCountText = filter === null ? eligibleReviewsLabel(stats.ratingCount) : filteredReviewsLabel(visibleReviews.length, filter);
  const reviewSummary = <View accessibilityLabel={labels.ratingSummaryLabel} className={styles.reviewSummary} testID="profile-review-summary">
    <View className={styles.reviewScore}>
      {stats.ratingAverage === null ? <Text className={styles.reviewScoreEmpty}>{noRatingLabel}</Text> : <Text className={styles.reviewScoreValue}>{stats.ratingAverage.toFixed(1)}</Text>}
      <View accessible={false} className={styles.reviewScoreStars}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} color={stats.ratingAverage !== null && star <= Math.round(stats.ratingAverage) ? colors.primaryDark : colors.borderSubtle} fill={stats.ratingAverage !== null && star <= Math.round(stats.ratingAverage) ? colors.primaryDark : 'transparent'} size={16} strokeWidth={1.8} />)}</View>
      <Text accessibilityLiveRegion="polite" className={styles.reviewCount}>{reviewCountText}</Text>
      {totalQuestsLabel ? <Text className={styles.reviewTotalQuests}>{`${totalQuestsLabel}: ${stats.totalQuests ?? '—'}`}</Text> : null}
    </View>
    <View className={styles.reviewDistribution}>{distribution}</View>
  </View>;
  const emptyState = filter === null ? <Text className={styles.emptyText}>{emptyText}</Text> : <EmptyState message={noMatchingReviewsText} actionLabel={showAllLabel} onAction={() => setFilter(null)} />;
  const sectionHeader = <>
    {listHeader}
    <View testID={`profile-section-${sectionTitle}`} className={styles.section} style={{ marginTop: metrics.sectionGap, padding: metrics.cardPadding }}>
      <Text accessibilityRole="header" className={styles.sectionTitle} maxFontSizeMultiplier={2} style={{ fontSize: metrics.sectionTitleFontSize, lineHeight: Math.round(metrics.sectionTitleFontSize * 1.3) }}>{sectionTitle}</Text>
      <View className={styles.rule} />
      {errorText ? <SectionNotice errorText={errorText} retryLabel={retryLabel} onRetry={onRetry} /> : <>
        {ratingErrorText ? <SectionNotice errorText={ratingErrorText} retryLabel={retryLabel} onRetry={onRetry} /> : <>{reviewSummary}{filter !== null ? <Pressable accessibilityRole="button" accessibilityLabel={showAllLabel} onPress={() => setFilter(null)} className={styles.showAllReviews}><Text className={styles.showAllReviewsText}>{showAllLabel}</Text></Pressable> : null}</>}
      </>}
    </View>
  </>;

  return <FlatList
    testID="profile-reviews-list"
    data={errorText ? [] : visibleReviews}
    keyExtractor={(review) => review.id}
    contentContainerClassName={styles.profileListContent}
    contentContainerStyle={{ paddingBottom: bottomPadding, paddingHorizontal: metrics.pagePadding, paddingTop: metrics.sectionGap }}
    contentOffset={{ x: 0, y: initialScrollOffset }}
    onScroll={onScroll}
    scrollEventThrottle={16}
    ListHeaderComponent={sectionHeader}
    ListEmptyComponent={errorText ? null : emptyState}
    renderItem={({ item }) => <ReviewCard review={item} locale={locale} reviewerAvatarLabel={labels.reviewerAvatarLabel} reviewRatingLabel={labels.reviewRatingLabel} />}
    showsVerticalScrollIndicator={false}
  />;
}
