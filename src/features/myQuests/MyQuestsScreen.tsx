import React, { useState } from 'react';
import { AccessibilityInfo, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  CircleX,
  Clock3,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  UsersRound,
  type LucideIcon,
} from 'lucide-react-native';

import { cn } from '@/tw/cn';
import { Image, Pressable, SafeAreaView, ScrollView, Text, View } from '@/tw';
import { useLocale, type SupportedLocale } from '@/locales/LocaleProvider';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import styles from './myQuestStyles';

type Role = 'worker' | 'hirer';
type WorkerTab = 'pending' | 'accepted' | 'history';
type HirerTab = 'active' | 'draft' | 'completed';
type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';
type CategoryTone = 'green' | 'blue' | 'purple';

type QuestSummary = {
  id: string;
  title: string;
  tag: string;
  categoryTone: CategoryTone;
  date: string;
  location: string;
  description: string;
  detail: string;
  teamSize: string;
  progress: number;
  status: string;
  statusTone: StatusTone;
  action: string;
  secondaryAction?: string;
  imageUri: string;
  host?: string;
  appliedOn?: string;
  reason?: string;
};

type SummaryMetric = {
  icon: 'applications' | 'accepted' | 'history';
  label: string;
  value: string;
  detail: string;
};

type RoleCopy<T extends string> = {
  title: string;
  subtitle: string;
  tabs: Record<T, string>;
  items: Record<T, QuestSummary[]>;
  emptyTitle: string;
  emptyDescription: string;
  tipTitle: string;
  tipDescription: string;
  summary?: SummaryMetric[];
};

type LocaleContent = {
  roleViewLabel: string;
  roleLabels: Record<Role, string>;
  back: string;
  help: string;
  teamSize: string;
  progress: string;
  appliedOn: string;
  reason: string;
  host: string;
  worker: RoleCopy<WorkerTab>;
  hirer: RoleCopy<HirerTab>;
};

const imageUris = {
  environment: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=480&q=80',
  plants: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=480&q=80',
  education: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=480&q=80',
  animal: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=480&q=80',
  moving: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=480&q=80',
  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=480&q=80',
  delivery: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=480&q=80',
} as const;

const content: Record<SupportedLocale, LocaleContent> = {
  th: {
    roleViewLabel: 'มุมมองเควสต์',
    roleLabels: { worker: 'เควสต์ที่ฉันเข้าร่วม', hirer: 'เควสต์ที่ฉันโพสต์' },
    back: 'ย้อนกลับ',
    help: 'ช่วยเหลือ',
    teamSize: 'ทีม',
    progress: 'ความคืบหน้า',
    appliedOn: 'สมัครเมื่อ',
    reason: 'เหตุผล',
    host: 'ผู้โพสต์',
    worker: {
      title: 'เควสต์ที่ฉันสมัคร',
      subtitle: 'ติดตามเควสต์ที่คุณสมัครไว้',
      tabs: { pending: 'รอตรวจสอบ', accepted: 'ตอบรับแล้ว', history: 'ประวัติ' },
      items: {
        pending: [
          {
            id: 'move-boxes', title: 'ช่วยยกกล่องไปหอพัก', tag: 'ยกของ', categoryTone: 'green',
            date: 'วันนี้ · 17:00–19:00', location: 'หอพัก 13', description: 'ช่วยขนกล่องที่ติดป้ายไปยังหอพัก 13', detail: 'รอตรวจสอบใบสมัคร',
            teamSize: '2 / 2', progress: 62, status: 'รอตรวจสอบ', statusTone: 'warning', action: 'ดูรายละเอียด', host: 'นิชา ส.', appliedOn: '13 ส.ค.', imageUri: imageUris.moving,
          },
          {
            id: 'clean-fan', title: 'ล้างพัดลมหอพัก', tag: 'ทำความสะอาด', categoryTone: 'green',
            date: 'พรุ่งนี้ · 09:00–12:00', location: 'ใต้หอพัก 13', description: 'ทำความสะอาดพัดลมส่วนกลางก่อนช่วงเย็น', detail: 'รอเริ่มงาน',
            teamSize: '1 / 2', progress: 45, status: 'รอคิว', statusTone: 'warning', action: 'ดูรายละเอียด', host: 'พลอย เค.', appliedOn: '12 ส.ค.', imageUri: imageUris.cleaning,
          },
        ],
        accepted: [
          {
            id: 'buy-lunch', title: 'ซื้อข้าวจากโรงอาหาร', tag: 'ส่งของ', categoryTone: 'green',
            date: 'วันนี้ · 10:00–13:00', location: 'โรงอาหารกลาง', description: 'ซื้ออาหารจากโรงอาหารและนำไปส่งให้ผู้ว่าจ้าง', detail: 'นัดหมายแล้ว',
            teamSize: '1 / 1', progress: 100, status: 'ตอบรับแล้ว', statusTone: 'success', action: 'แชตกับผู้โพสต์', host: 'บีม ที.', appliedOn: '10 ส.ค.', imageUri: imageUris.delivery,
          },
          {
            id: 'run-together', title: 'ไปวิ่งเป็นเพื่อน', tag: 'ออกกำลังกาย', categoryTone: 'green',
            date: '26 ส.ค. · 18:00–19:00', location: 'สนามอินทรีจันทรสถิตย์', description: 'วิ่งรอบมหาวิทยาลัยด้วยกันในช่วงเย็น', detail: 'ตอบรับเข้าร่วมแล้ว',
            teamSize: '2 / 3', progress: 67, status: 'ตอบรับแล้ว', statusTone: 'success', action: 'ดูรายละเอียด', host: 'เฟิร์น ล.', appliedOn: '9 ส.ค.', imageUri: imageUris.environment,
          },
        ],
        history: [
          {
            id: 'print-notes', title: 'พิมพ์โน้ตการเรียน', tag: 'ถ่ายเอกสาร', categoryTone: 'blue',
            date: '22 ส.ค.', location: 'คณะวิทยาศาสตร์', description: 'พิมพ์โน้ตการเรียนสำหรับคลาสช่วงบ่าย', detail: 'ได้รับค่าตอบแทน ฿60',
            teamSize: '1 / 1', progress: 100, status: 'เสร็จแล้ว', statusTone: 'success', action: 'ดูรายละเอียด', host: 'เมย์ เค.', appliedOn: '20 ส.ค.', imageUri: imageUris.education,
          },
          {
            id: 'deliver-snacks', title: 'ส่งขนมให้กลุ่มอ่านหนังสือ', tag: 'ส่งของ', categoryTone: 'green',
            date: '18 ส.ค.', location: 'สำนักหอสมุด', description: 'นำขนมไปส่งให้กลุ่มอ่านหนังสือ', detail: 'ได้รับค่าตอบแทน ฿90',
            teamSize: '1 / 1', progress: 100, status: 'เสร็จแล้ว', statusTone: 'success', action: 'ดูรายละเอียด', host: 'พลอย น.', appliedOn: '16 ส.ค.', imageUri: imageUris.delivery,
          },
        ],
      },
      emptyTitle: 'ยังไม่มีเควสต์ฉบับร่าง',
      emptyDescription: 'เมื่อคุณสมัครเควสต์ใหม่ รายการจะปรากฏที่นี่',
      tipTitle: 'คุณกำลังสร้างความเปลี่ยนแปลง',
      tipDescription: 'สมัครเควสต์ต่อไปเพื่อช่วยเหลือคนในมหาวิทยาลัย',
      summary: [
        { icon: 'applications', label: 'ใบสมัคร', value: '2', detail: 'รอตรวจสอบ' },
        { icon: 'accepted', label: 'ตอบรับแล้ว', value: '2', detail: 'คุณเข้าร่วมแล้ว' },
        { icon: 'history', label: 'เควสต์ทั้งหมด', value: '4', detail: 'ตลอดเวลา' },
      ],
    },
    hirer: {
      title: 'เควสต์ของฉัน',
      subtitle: 'จัดการเควสต์ที่คุณสร้างและเข้าร่วม',
      tabs: { active: 'กำลังดำเนินการ', draft: 'ฉบับร่าง', completed: 'เสร็จแล้ว' },
      items: {
        active: [
          {
            id: 'clean-fan', title: 'ล้างพัดลมหอพัก', tag: 'ทำความสะอาด', categoryTone: 'green',
            date: 'วันนี้ · 09:00–12:00', location: 'ใต้หอพัก 13', description: 'ทำความสะอาดพัดลมส่วนกลางก่อนช่วงเย็น', detail: 'นัดเสร็จพรุ่งนี้ · 12:00',
            teamSize: '2 คนกำลังทำงาน', progress: 62, status: 'กำลังทำงาน', statusTone: 'success', action: 'ดูเควสต์', secondaryAction: 'แก้ไข', imageUri: imageUris.cleaning,
          },
          {
            id: 'buy-lunch', title: 'ซื้อข้าวจากโรงอาหาร', tag: 'ส่งของ', categoryTone: 'green',
            date: 'วันนี้ · 10:00–13:00', location: 'โรงอาหารกลาง', description: 'ซื้ออาหารจากโรงอาหารและนำไปส่งให้ผู้ว่าจ้าง', detail: 'นัดส่งวันนี้ · 12:30',
            teamSize: '1 คนกำลังทำงาน', progress: 100, status: 'เต็มแล้ว', statusTone: 'warning', action: 'ดูรายละเอียด', secondaryAction: 'แก้ไข', imageUri: imageUris.delivery,
          },
        ],
        draft: [],
        completed: [
          {
            id: 'print-event-posters', title: 'พิมพ์โปสเตอร์งานกิจกรรม', tag: 'ถ่ายเอกสาร', categoryTone: 'blue',
            date: '17 ส.ค.', location: 'ร้านถ่ายเอกสารหน้า มก.', description: 'พิมพ์และรับโปสเตอร์สำหรับงานกิจกรรมของคณะ', detail: 'รีวิวผู้ทำงานแล้ว',
            teamSize: '1 / 1', progress: 100, status: 'เสร็จแล้ว', statusTone: 'success', action: 'ดูรายละเอียด', imageUri: imageUris.education,
          },
          {
            id: 'move-club-equipment', title: 'ช่วยย้ายอุปกรณ์ชมรม', tag: 'ยกของ', categoryTone: 'green',
            date: '10 ส.ค.', location: 'อาคารกิจกรรมนิสิต', description: 'ย้ายอุปกรณ์กิจกรรมไปยังห้องจัดงาน', detail: 'ปิดเควสต์แล้ว',
            teamSize: '3 / 3', progress: 100, status: 'เสร็จแล้ว', statusTone: 'success', action: 'ดูรายละเอียด', imageUri: imageUris.moving,
          },
        ],
      },
      emptyTitle: 'ยังไม่มีเควสต์ฉบับร่าง',
      emptyDescription: 'เควสต์ที่คุณบันทึกไว้ก่อนเผยแพร่จะแสดงที่นี่',
      tipTitle: 'สร้างเควสต์ใหม่และชวนคนมาช่วยกัน',
      tipDescription: 'เปลี่ยนไอเดียเล็ก ๆ ให้เกิดประโยชน์กับชุมชน',
    },
  },
  en: {
    roleViewLabel: 'Quest view',
    roleLabels: { worker: 'Quests I joined', hirer: 'Quests I posted' },
    back: 'Go back',
    help: 'Help',
    teamSize: 'Team size',
    progress: 'Progress',
    appliedOn: 'Applied on',
    reason: 'Reason',
    host: 'Quest host',
    worker: {
      title: 'My Apply Quest',
      subtitle: 'Track Quests you have applied for',
      tabs: { pending: 'Pending', accepted: 'Accepted', history: 'History' },
      items: {
        pending: [
          {
            id: 'move-boxes', title: 'Help move boxes to the dorm', tag: 'Moving', categoryTone: 'green',
            date: 'Today · 17:00–19:00', location: 'Dorm 13', description: 'Help carry labelled boxes to Dorm 13', detail: 'Application is being reviewed',
            teamSize: '2 / 2', progress: 62, status: 'Under review', statusTone: 'warning', action: 'View Detail', host: 'Nicha S.', appliedOn: '13 Aug', imageUri: imageUris.moving,
          },
          {
            id: 'clean-fan', title: 'Clean a dorm fan', tag: 'Cleaning', categoryTone: 'green',
            date: 'Tomorrow · 09:00–12:00', location: 'Under Dorm 13', description: 'Clean a shared fan before the evening', detail: 'Waiting for a place to open',
            teamSize: '1 / 2', progress: 45, status: 'Waitlist', statusTone: 'warning', action: 'View Detail', host: 'Ploy K.', appliedOn: '12 Aug', imageUri: imageUris.cleaning,
          },
        ],
        accepted: [
          {
            id: 'buy-lunch', title: 'Buy lunch from the canteen', tag: 'Delivery', categoryTone: 'green',
            date: 'Today · 10:00–13:00', location: 'Central Canteen', description: 'Buy a meal and bring it to the requester', detail: 'Scheduled with the host',
            teamSize: '1 / 1', progress: 100, status: 'Accepted', statusTone: 'success', action: 'Message Host', host: 'Beam T.', appliedOn: '10 Aug', imageUri: imageUris.delivery,
          },
          {
            id: 'run-together', title: 'Go running together', tag: 'Exercise', categoryTone: 'green',
            date: '26 Aug · 18:00–19:00', location: 'Insee Chanthasathit Field', description: 'Join a relaxed evening run around campus', detail: 'You are on the team',
            teamSize: '2 / 3', progress: 67, status: 'Accepted', statusTone: 'success', action: 'View Detail', host: 'Fern L.', appliedOn: '9 Aug', imageUri: imageUris.environment,
          },
        ],
        history: [
          {
            id: 'print-notes', title: 'Print lecture notes', tag: 'Printing', categoryTone: 'blue',
            date: '22 Aug', location: 'Faculty of Science', description: 'Print lecture notes for an afternoon class', detail: 'Earned ฿60',
            teamSize: '1 / 1', progress: 100, status: 'Completed', statusTone: 'success', action: 'View Detail', host: 'May K.', appliedOn: '20 Aug', imageUri: imageUris.education,
          },
          {
            id: 'deliver-snacks', title: 'Deliver snacks to a study group', tag: 'Delivery', categoryTone: 'green',
            date: '18 Aug', location: 'University Library', description: 'Deliver snacks to a study group', detail: 'Earned ฿90',
            teamSize: '1 / 1', progress: 100, status: 'Completed', statusTone: 'success', action: 'View Detail', host: 'Ploy N.', appliedOn: '16 Aug', imageUri: imageUris.delivery,
          },
        ],
      },
      emptyTitle: 'No Quest applications yet',
      emptyDescription: 'Quests you apply for will appear here',
      tipTitle: 'You are making a difference',
      tipDescription: 'Keep applying for Quests that help the campus community',
      summary: [
        { icon: 'applications', label: 'Applications', value: '2', detail: 'Pending' },
        { icon: 'accepted', label: 'Accepted', value: '2', detail: "You're in!" },
        { icon: 'history', label: 'Total Quests', value: '4', detail: 'All time' },
      ],
    },
    hirer: {
      title: 'MyQuest',
      subtitle: 'Manage your created and joined missions',
      tabs: { active: 'Active', draft: 'Draft', completed: 'Completed' },
      items: {
        active: [
          {
            id: 'clean-fan', title: 'Clean a dorm fan', tag: 'Cleaning', categoryTone: 'green',
            date: 'Today · 09:00–12:00', location: 'Under Dorm 13', description: 'Clean a shared fan before the evening', detail: 'Due tomorrow · 12:00',
            teamSize: '2 people working', progress: 62, status: 'Open', statusTone: 'success', action: 'View Applicants', secondaryAction: 'Edit', imageUri: imageUris.cleaning,
          },
          {
            id: 'buy-lunch', title: 'Buy lunch from the canteen', tag: 'Delivery', categoryTone: 'green',
            date: 'Today · 10:00–13:00', location: 'Central Canteen', description: 'Buy a meal and bring it to the requester', detail: 'Due today · 12:30',
            teamSize: '1 person working', progress: 100, status: 'Full', statusTone: 'warning', action: 'View Detail', secondaryAction: 'Edit', imageUri: imageUris.delivery,
          },
        ],
        draft: [],
        completed: [
          {
            id: 'print-event-posters', title: 'Print event posters', tag: 'Printing', categoryTone: 'blue',
            date: '17 Aug', location: 'Copy shop by KU', description: 'Print and collect posters for a faculty event', detail: 'Workers reviewed',
            teamSize: '1 / 1', progress: 100, status: 'Completed', statusTone: 'success', action: 'View Detail', imageUri: imageUris.education,
          },
          {
            id: 'move-club-equipment', title: 'Move club equipment', tag: 'Moving', categoryTone: 'green',
            date: '10 Aug', location: 'Student Activity Building', description: 'Move event equipment to the activity hall', detail: 'Quest closed',
            teamSize: '3 / 3', progress: 100, status: 'Completed', statusTone: 'success', action: 'View Detail', imageUri: imageUris.moving,
          },
        ],
      },
      emptyTitle: 'No Quest drafts yet',
      emptyDescription: 'Quests saved before publishing will appear here',
      tipTitle: 'Create new Quests and inspire volunteers',
      tipDescription: 'Turn a small idea into a useful campus mission',
    },
  },
};

const workerTabs: WorkerTab[] = ['pending', 'accepted', 'history'];
const hirerTabs: HirerTab[] = ['active', 'draft', 'completed'];

const statusPalette: Record<StatusTone, { backgroundColor: string; borderColor: string; foreground: string }> = {
  success: { backgroundColor: colors.surfaceSuccess, borderColor: colors.borderSuccess, foreground: colors.success },
  warning: { backgroundColor: '#FFF4D9', borderColor: '#F2D18A', foreground: '#B86B00' },
  danger: { backgroundColor: colors.surfaceDanger, borderColor: colors.borderDanger, foreground: colors.dangerDark },
  neutral: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, foreground: colors.textSecondary },
};

const categoryPalette: Record<CategoryTone, { backgroundColor: string; foreground: string }> = {
  green: { backgroundColor: colors.surfaceSuccess, foreground: colors.primary },
  blue: { backgroundColor: '#EAF2FC', foreground: '#1557A6' },
  purple: { backgroundColor: '#F3E8F8', foreground: '#7A3FA1' },
};

function renderActionIcon(label: string, size: number) {
  if (/edit|แก้ไข/i.test(label)) return <Pencil color={colors.primary} size={size} strokeWidth={2.1} />;
  if (/applicant|ผู้สมัคร/i.test(label)) return <UsersRound color={colors.primary} size={size} strokeWidth={2.1} />;
  if (/message|แชต|ข้อความ/i.test(label)) return <MessageSquare color={colors.primary} size={size} strokeWidth={2.1} />;
  return <ChevronRight color={colors.primary} size={size} strokeWidth={2.1} />;
}

function QuestThumbnail({ quest }: { quest: QuestSummary }) {
  const [failed, setFailed] = useState(false);
  const palette = categoryPalette[quest.categoryTone];
  return (
    <View accessibilityLabel={`${quest.title} image`} className={styles.thumbnail}>
      {quest.imageUri && !failed ? (
        <Image accessibilityLabel={`${quest.title} image`} cachePolicy="memory-disk" contentFit="cover" onError={() => setFailed(true)} source={{ uri: quest.imageUri }} className={styles.thumbnailImage} />
      ) : (
        <View className={styles.thumbnailFallback} style={{ backgroundColor: palette.backgroundColor }}>
          <BriefcaseBusiness color={palette.foreground} size={30} strokeWidth={1.8} />
        </View>
      )}
    </View>
  );
}

function CategoryTag({ quest }: { quest: QuestSummary }) {
  const palette = categoryPalette[quest.categoryTone];
  return (
    <View className={styles.categoryTag} style={{ backgroundColor: palette.backgroundColor }}>
      <BriefcaseBusiness color={palette.foreground} size={13} strokeWidth={2} />
      <Text className={styles.categoryTagText} style={{ color: palette.foreground }}>{quest.tag}</Text>
    </View>
  );
}

function StatusPill({ status, tone, stretch = false }: { status: string; tone: StatusTone; stretch?: boolean }) {
  const palette = statusPalette[tone];
  const Icon = tone === 'success' ? Check : tone === 'danger' ? CircleX : Clock3;
  return (
    <View accessibilityLabel={status} className={cn(styles.statusPill, stretch && styles.statusPillStretch)} style={{ backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }}>
      <Icon color={palette.foreground} size={14} strokeWidth={2.2} />
      <Text className={styles.statusText} style={{ color: palette.foreground }}>{status}</Text>
    </View>
  );
}

function QuestMeta({ quest }: { quest: QuestSummary }) {
  return (
    <View className={styles.metaRow}>
      <CalendarDays color={colors.textSecondary} size={14} strokeWidth={1.9} />
      <Text className={styles.metaText} numberOfLines={1}>{quest.date}</Text>
      <View className={styles.metaDivider} />
      <MapPin color={colors.textSecondary} size={14} strokeWidth={1.9} />
      <Text className={styles.metaText} numberOfLines={1}>{quest.location}</Text>
    </View>
  );
}

function ProgressRow({ quest, copy }: { quest: QuestSummary; copy: LocaleContent }) {
  const palette = statusPalette[quest.statusTone];
  const progress = Math.min(100, Math.max(0, quest.progress));
  return (
    <View accessibilityLabel={`${copy.teamSize} ${quest.teamSize}. ${copy.progress} ${progress}%`} className={styles.progressRow}>
      <View className={styles.teamMetric}>
        <Text className={styles.metricLabel}>{copy.teamSize}</Text>
        <UsersRound color={palette.foreground} size={16} strokeWidth={2} />
        <Text className={styles.metricValue} style={{ color: palette.foreground }}>{quest.teamSize}</Text>
      </View>
      <View className={styles.metricDivider} />
      <View className={styles.progressMetric}>
        <Text className={styles.metricLabel}>{copy.progress}</Text>
        <View className={styles.progressTrack}>
          <View className={styles.progressFill} style={{ backgroundColor: palette.foreground, width: `${progress}%` }} />
        </View>
        <Text className={styles.metricValue} style={{ color: palette.foreground }}>{progress}%</Text>
      </View>
    </View>
  );
}

function ActionButton({ label, onPress, testID, compact = false, full = false, accessibilityLabel }: { label: string; onPress: () => void; testID: string; compact?: boolean; full?: boolean; accessibilityLabel?: string }) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel ?? label} accessibilityRole="button" className={cn(styles.actionButton, compact && styles.actionButtonCompact, full && styles.actionButtonFull)} onPress={onPress} testID={testID}>
      {renderActionIcon(label, compact ? 14 : 17)}
      <Text className={cn(styles.actionText, compact && styles.actionTextCompact)}>{label}</Text>
    </Pressable>
  );
}

function CreatedQuestCard({ quest, copy, onPress }: { quest: QuestSummary; copy: LocaleContent; onPress: () => void }) {
  return (
    <View className={styles.card}>
      <View className={styles.cardRow}>
        <QuestThumbnail quest={quest} />
        <View className={styles.cardBody}>
          <View className={styles.cardHeadingRow}>
            <View className={styles.cardHeadingCopy}>
              <CategoryTag quest={quest} />
              <Text className={styles.cardTitle} numberOfLines={2}>{quest.title}</Text>
            </View>
            <StatusPill status={quest.status} tone={quest.statusTone} />
          </View>
          <QuestMeta quest={quest} />
          <Text className={styles.cardDescription} numberOfLines={2}>{quest.description}</Text>
        </View>
      </View>
      <ProgressRow copy={copy} quest={quest} />
      <View className={styles.actionsRow}>
        {quest.secondaryAction ? <ActionButton label={quest.secondaryAction} onPress={onPress} testID={`my-quest-action-${quest.id}-secondary`} /> : null}
        <ActionButton full={!quest.secondaryAction} label={quest.action} onPress={onPress} testID={`my-quest-action-${quest.id}`} />
      </View>
    </View>
  );
}

function ApplicationQuestCard({ quest, copy, onPress }: { quest: QuestSummary; copy: LocaleContent; onPress: () => void }) {
  const sideDetailLabel = quest.reason ? copy.reason : copy.appliedOn;
  const sideDetail = quest.reason ?? quest.appliedOn;
  const questAccessibilityLabel = [quest.title, quest.status, quest.date, quest.location, quest.detail, quest.action].join('. ');
  return (
    <View className={styles.applicationCard}>
      <View className={styles.applicationRow}>
        <QuestThumbnail quest={quest} />
        <View className={styles.applicationMain}>
          <CategoryTag quest={quest} />
          <Text className={styles.applicationTitle} numberOfLines={2}>{quest.title}</Text>
          <QuestMeta quest={quest} />
          <View className={styles.hostRow}>
            <View className={styles.hostIcon}><CircleUserRound color={colors.primary} size={15} strokeWidth={2} /></View>
            <Text className={styles.hostText} numberOfLines={1}>{quest.host ?? quest.detail}</Text>
          </View>
          <Text className={styles.applicationDescription} numberOfLines={2}>{quest.description}</Text>
        </View>
        <View className={styles.applicationSide}>
          <StatusPill status={quest.status} tone={quest.statusTone} stretch />
          <Text className={styles.sideLabel}>{sideDetailLabel}</Text>
          <Text className={styles.sideValue} numberOfLines={2}>{sideDetail ?? quest.detail}</Text>
          {!quest.reason ? <><Text className={styles.sideLabel}>{copy.teamSize}</Text><View className={styles.sideTeam}><UsersRound color={colors.primary} size={14} strokeWidth={2} /><Text className={styles.sideValue} numberOfLines={1}>{quest.teamSize}</Text></View></> : null}
          <ActionButton accessibilityLabel={questAccessibilityLabel} compact full label={quest.action} onPress={onPress} testID={`my-quest-action-${quest.id}`} />
        </View>
      </View>
    </View>
  );
}

function EmptyState({ copy }: { copy: RoleCopy<WorkerTab> | RoleCopy<HirerTab> }) {
  return (
    <View accessibilityLabel={copy.emptyTitle} className={styles.emptyState}>
      <View className={styles.emptyIcon}><Plus color={colors.primary} size={24} strokeWidth={2.1} /></View>
      <Text className={styles.emptyTitle}>{copy.emptyTitle}</Text>
      <Text className={styles.emptyDescription}>{copy.emptyDescription}</Text>
    </View>
  );
}

function SummaryStrip({ metrics }: { metrics: SummaryMetric[] }) {
  const icons: Record<SummaryMetric['icon'], LucideIcon> = { applications: BriefcaseBusiness, accepted: UsersRound, history: Clock3 };
  return (
    <View accessibilityLabel={metrics.map((metric) => `${metric.label} ${metric.value} ${metric.detail}`).join('. ')} className={styles.summaryStrip}>
      <View className={styles.summaryMetrics}>
        {metrics.map((metric, index) => {
          const Icon = icons[metric.icon];
          return <React.Fragment key={metric.label}>
            {index > 0 ? <View className={styles.summaryDivider} /> : null}
            <View className={styles.summaryMetric}>
              <View className={styles.summaryIcon}><Icon color={colors.primary} size={20} strokeWidth={1.9} /></View>
              <View className={styles.summaryCopy}><Text className={styles.summaryLabel}>{metric.label}</Text><Text className={styles.summaryValue}>{metric.value}</Text><Text className={styles.summaryDetail}>{metric.detail}</Text></View>
            </View>
          </React.Fragment>;
        })}
      </View>
    </View>
  );
}

function TipCard({ title, description }: { title: string; description: string }) {
  return <View className={styles.tipCard}><View className={styles.tipIcon}><CircleHelp color={colors.primary} size={22} strokeWidth={1.9} /></View><View className={styles.tipCopy}><Text className={styles.tipTitle}>{title}</Text><Text className={styles.tipDescription}>{description}</Text></View></View>;
}

export default function MyQuestsScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const copy = content[locale];
  const [role, setRole] = useState<Role>('worker');
  const [workerTab, setWorkerTab] = useState<WorkerTab>('pending');
  const [hirerTab, setHirerTab] = useState<HirerTab>('active');
  const roleCopy = role === 'worker' ? copy.worker : copy.hirer;
  const selectedTab = role === 'worker' ? workerTab : hirerTab;
  const items = role === 'worker' ? copy.worker.items[workerTab] : copy.hirer.items[hirerTab];
  const tabOptions: readonly (WorkerTab | HirerTab)[] = role === 'worker' ? workerTabs : hirerTabs;
  const bottomPadding = (chromeMetrics.isTablet ? spacing.lg : chromeMetrics.navHeight + insets.bottom) + spacing.lg;

  const selectRole = (nextRole: Role) => {
    setRole(nextRole);
    AccessibilityInfo.announceForAccessibility(copy.roleLabels[nextRole]);
  };

  const selectTab = (nextTab: WorkerTab | HirerTab) => {
    if (role === 'worker') {
      setWorkerTab(nextTab as WorkerTab);
      AccessibilityInfo.announceForAccessibility(copy.worker.tabs[nextTab as WorkerTab]);
    } else {
      setHirerTab(nextTab as HirerTab);
      AccessibilityInfo.announceForAccessibility(copy.hirer.tabs[nextTab as HirerTab]);
    }
  };

  const openQuest = (questId: string) => {
    router.push({ pathname: '/quest/[id]', params: { id: questId } });
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
      <View className={styles.hero}>
        <View className={styles.headerRow}>
          <Pressable accessibilityLabel={copy.back} accessibilityRole="button" className={styles.heroIconButton} onPress={() => router.back()} testID="my-quests-back-button"><ArrowLeft color={colors.primary} size={24} strokeWidth={2.2} /></Pressable>
          <View className={styles.headerSpacer} />
          <Pressable accessibilityLabel={copy.help} accessibilityRole="button" className={styles.heroIconButton} onPress={() => router.push('/settings')} testID="my-quests-help-button"><CircleHelp color={colors.primary} size={24} strokeWidth={2.1} /></Pressable>
        </View>
        <Text accessibilityRole="header" className={styles.heroTitle}>{roleCopy.title}</Text>
        <Text className={styles.heroSubtitle}>{roleCopy.subtitle}</Text>
        <View accessibilityLabel={copy.roleViewLabel} accessibilityRole="tablist" className={styles.roleSwitch}>
          {(['worker', 'hirer'] as const).map((option) => {
            const selected = role === option;
            return <Pressable accessibilityLabel={copy.roleLabels[option]} accessibilityRole="tab" accessibilityState={{ selected }} key={option} onPress={() => selectRole(option)} className={cn(styles.roleOption, selected && styles.roleOptionActive)} testID={`my-quests-role-${option}`}><Text className={cn(styles.roleOptionText, selected && styles.roleOptionTextActive)} numberOfLines={1} style={{ color: selected ? colors.primary : colors.textSecondary }}>{copy.roleLabels[option]}</Text></Pressable>;
          })}
        </View>
        <View accessibilityLabel={`${roleCopy.title} tabs`} accessibilityRole="tablist" className={styles.statusTabs}>
          {tabOptions.map((tab) => {
            const selected = selectedTab === tab;
            const tabLabel = role === 'worker' ? copy.worker.tabs[tab as WorkerTab] : copy.hirer.tabs[tab as HirerTab];
            const tabItems = role === 'worker' ? copy.worker.items[tab as WorkerTab] : copy.hirer.items[tab as HirerTab];
            return <Pressable accessibilityLabel={`${tabLabel} (${tabItems.length})`} accessibilityRole="tab" accessibilityState={{ selected }} key={tab} onPress={() => selectTab(tab)} className={cn(styles.statusTab, selected && styles.statusTabActive)} testID={`my-quests-status-${tab}`}><Text className={cn(styles.statusTabText, selected && styles.statusTabTextActive)} numberOfLines={1} style={{ color: selected ? colors.primary : colors.textSecondary }}>{tabLabel}</Text><View className={cn(styles.statusCount, selected && styles.statusCountActive)}><Text className={cn(styles.statusCountText, selected && styles.statusCountTextActive)} style={{ color: selected ? colors.white : colors.textMuted }}>{tabItems.length}</Text></View></Pressable>;
          })}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPadding }}>
        <View className={styles.surface}>
          <View accessibilityLabel={`${role === 'worker' ? copy.worker.tabs[workerTab] : copy.hirer.tabs[hirerTab]} Quest list`} className={styles.list}>
            {items.length > 0 ? items.map((quest) => role === 'worker'
              ? <ApplicationQuestCard key={quest.id} copy={copy} onPress={() => openQuest(quest.id)} quest={quest} />
              : <CreatedQuestCard key={quest.id} copy={copy} onPress={() => openQuest(quest.id)} quest={quest} />)
              : <EmptyState copy={roleCopy} />}
          </View>
          {role === 'worker' && copy.worker.summary ? <SummaryStrip metrics={copy.worker.summary} /> : null}
          <TipCard description={roleCopy.tipDescription} title={roleCopy.tipTitle} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
