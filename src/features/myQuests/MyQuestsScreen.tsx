import { useState } from 'react';
import { AccessibilityInfo, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronRight, Clock3 } from 'lucide-react-native';

import { Pressable, SafeAreaView, ScrollView, Text, View } from '@/tw';
import { useLocale } from '@/locales/LocaleProvider';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import styles from './myQuestStyles';

type Role = 'worker' | 'hirer';
type QuestSummary = { id: string; title: string; tag: string; meta: string; detail: string; action: string; status: string };

const content = {
  th: {
    title: 'เควสต์ของฉัน', subtitle: 'ติดตามเควสต์ที่คุณเข้าร่วมหรือโพสต์ไว้', viewLabel: 'มุมมองเควสต์', worker: 'เควสต์ที่ฉันเข้าร่วม', hirer: 'เควสต์ที่ฉันโพสต์',
    active: 'เควสต์ที่กำลังดำเนินการ', completed: 'เควสต์ที่เสร็จแล้ว', activeSummary: 'ต้องติดตาม', completedSummary: 'ประวัติของคุณ',
    workerActive: [
      { id: 'move-boxes', title: 'ช่วยยกกล่องไปหอพัก', tag: 'ย้ายของ', meta: 'วันนี้ · 17:00–19:00', detail: 'นัดทำงานกับ Nicha S.', action: 'ดูรายละเอียด', status: 'กำลังทำ' },
      { id: 'clean-fan', title: 'ล้างพัดลมหอพัก', tag: 'ทำความสะอาด', meta: 'พรุ่งนี้ · 09:00–12:00', detail: 'รอเริ่มงาน', action: 'ดูรายละเอียด', status: 'รอเริ่มงาน' },
    ],
    workerCompleted: [
      { id: 'print-notes', title: 'พิมพ์โน้ตการเรียน', meta: 'เสร็จแล้ว 22 ส.ค. · ได้รับ ฿60' },
      { id: 'deliver-snacks', title: 'ส่งขนมให้กลุ่มอ่านหนังสือ', meta: 'เสร็จแล้ว 18 ส.ค. · ได้รับ ฿90' },
    ],
    hirerActive: [
      { id: 'clean-fan', title: 'ล้างพัดลมหอพัก', tag: 'ทำความสะอาด', meta: '2 คนกำลังทำงาน', detail: 'นัดเสร็จพรุ่งนี้ · 12:00', action: 'ดูเควสต์', status: 'กำลังทำงาน' },
      { id: 'buy-lunch', title: 'ซื้อข้าวจากโรงอาหาร', tag: 'จัดส่ง', meta: '1 คนกำลังทำงาน', detail: 'นัดส่งวันนี้ · 12:30', action: 'ดูเควสต์', status: 'กำลังทำงาน' },
    ],
    hirerCompleted: [
      { id: 'print-event-posters', title: 'พิมพ์โปสเตอร์งานกิจกรรม', meta: 'เสร็จแล้ว 17 ส.ค. · รีวิวผู้ทำงานแล้ว' },
      { id: 'move-club-equipment', title: 'ช่วยย้ายอุปกรณ์ชมรม', meta: 'เสร็จแล้ว 10 ส.ค. · ปิดเควสต์แล้ว' },
    ],
  },
  en: {
    title: 'My Quests', subtitle: 'Track Quests you join and post', viewLabel: 'Quest view', worker: 'Quests I joined', hirer: 'Quests I posted',
    active: 'Active Quests', completed: 'Completed Quests', activeSummary: 'Needs attention', completedSummary: 'Your history',
    workerActive: [
      { id: 'move-boxes', title: 'Help move boxes to the dorm', tag: 'Moving', meta: 'Today · 17:00–19:00', detail: 'Scheduled with Nicha S.', action: 'View details', status: 'In progress' },
      { id: 'clean-fan', title: 'Clean a dorm fan', tag: 'Cleaning', meta: 'Tomorrow · 09:00–12:00', detail: 'Waiting to start', action: 'View details', status: 'Waiting to start' },
    ],
    workerCompleted: [
      { id: 'print-notes', title: 'Print lecture notes', meta: 'Completed 22 Aug · Earned ฿60' },
      { id: 'deliver-snacks', title: 'Deliver snacks to a study group', meta: 'Completed 18 Aug · Earned ฿90' },
    ],
    hirerActive: [
      { id: 'clean-fan', title: 'Clean a dorm fan', tag: 'Cleaning', meta: '2 people working', detail: 'Due tomorrow · 12:00', action: 'View Quest', status: 'In progress' },
      { id: 'buy-lunch', title: 'Buy lunch from the canteen', tag: 'Delivery', meta: '1 person working', detail: 'Due today · 12:30', action: 'View Quest', status: 'In progress' },
    ],
    hirerCompleted: [
      { id: 'print-event-posters', title: 'Print event posters', meta: 'Completed 17 Aug · Workers reviewed' },
      { id: 'move-club-equipment', title: 'Move club equipment', meta: 'Completed 10 Aug · Quest closed' },
    ],
  },
} as const;

export default function MyQuestsScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const chromeMetrics = getAppChromeMetrics(width, fontScale);
  const copy = content[locale];
  const [role, setRole] = useState<Role>('worker');
  const active = role === 'worker' ? copy.workerActive : copy.hirerActive;
  const completed = role === 'worker' ? copy.workerCompleted : copy.hirerCompleted;
  const bottomPadding = (chromeMetrics.isTablet ? 0 : chromeMetrics.navHeight + insets.bottom) + spacing.lg;

  const selectRole = (nextRole: Role) => {
    setRole(nextRole);
    AccessibilityInfo.announceForAccessibility(nextRole === 'worker' ? copy.worker : copy.hirer);
  };

  const openQuest = (questId: string) => {
    router.push({ pathname: '/quest/[id]', params: { id: questId } });
  };

  return <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
    <ScrollView contentContainerStyle={{ paddingBottom: bottomPadding }} showsVerticalScrollIndicator={false}>
      <View className={styles.content}>
        <View className={styles.intro}>
          <Text accessibilityRole="header" className={styles.title}>{copy.title}</Text>
          <Text className={styles.subtitle}>{copy.subtitle}</Text>
        </View>

        <View accessibilityLabel={copy.viewLabel} accessibilityRole="tablist" className={styles.roleSwitch}>
          {(['worker', 'hirer'] as const).map((option) => {
            const selected = role === option;
            const label = option === 'worker' ? copy.worker : copy.hirer;
            const count = option === 'worker' ? copy.workerActive.length : copy.hirerActive.length;
            return <Pressable accessibilityLabel={`${label}, ${count}`} accessibilityRole="tab" accessibilityState={{ selected }} key={option} onPress={() => selectRole(option)} className={`${styles.roleOption} ${selected ? styles.roleOptionActive : ''}`} testID={`my-quests-role-${option}`}>
              <View className="items-center flex-row"><Text className={`${styles.roleOptionText} ${selected ? styles.roleOptionTextActive : ''}`}>{label}</Text><View className={`${styles.count} ${selected ? styles.countActive : ''}`}><Text className={`${styles.countText} ${selected ? styles.countTextActive : ''}`}>{count}</Text></View></View>
            </Pressable>;
          })}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}><Text accessibilityRole="header" className={styles.sectionTitle}>{copy.active}</Text><Text className={styles.sectionSummary}>{copy.activeSummary}</Text></View>
          <View className={styles.cards}>{active.map((quest) => <QuestCard key={quest.id} quest={quest} onPress={() => openQuest(quest.id)} />)}</View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}><Text accessibilityRole="header" className={styles.sectionTitle}>{copy.completed}</Text><Text className={styles.sectionSummary}>{copy.completedSummary}</Text></View>
          <View className={styles.cards}>{completed.map((quest) => <CompletedQuest key={quest.id} quest={quest} onPress={() => openQuest(quest.id)} />)}</View>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function QuestCard({ quest, onPress }: { quest: QuestSummary; onPress: () => void }) {
  const accessibilityLabel = [quest.title, quest.status, quest.meta, quest.detail, quest.action].join('. ');

  return <View className={styles.card}>
    <View className={styles.cardTop}><View className={styles.cardCopy}><View className={styles.tag}><Text className={styles.tagText}>{quest.tag}</Text></View><Text className={styles.cardTitle}>{quest.title}</Text></View><View accessibilityLabel={quest.status} className={styles.status}><Clock3 color={colors.success} size={14} strokeWidth={2.3} /><Text className={styles.statusText}>{quest.status}</Text></View></View>
    <View className={styles.cardMeta}><View className={styles.metaCopy}><Text className={styles.metaText}>{quest.meta}</Text><Text className={styles.metaText}>{quest.detail}</Text></View><Pressable accessibilityHint={quest.detail} accessibilityLabel={accessibilityLabel} accessibilityRole="button" className={styles.action} onPress={onPress} testID={`my-quest-action-${quest.id}`}><Text className={styles.actionText}>{quest.action}</Text></Pressable></View>
  </View>;
}

function CompletedQuest({ quest, onPress }: { quest: Pick<QuestSummary, 'id' | 'title' | 'meta'>; onPress: () => void }) {
  return <Pressable accessibilityLabel={`${quest.title}. ${quest.meta}`} accessibilityRole="button" className={styles.completedCard} onPress={onPress} testID={`my-quest-completed-${quest.id}`}><View className={styles.completedIcon}><Check color={colors.success} size={18} strokeWidth={2.5} /></View><View className={styles.completedCopy}><Text className={styles.completedTitle}>{quest.title}</Text><Text className={styles.completedMeta}>{quest.meta}</Text></View><ChevronRight color={colors.textMuted} size={20} /></Pressable>;
}
