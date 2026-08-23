import { useState } from 'react';
import { Check, ChevronRight, Clock3 } from 'lucide-react-native';

import { Pressable, SafeAreaView, ScrollView, Text, View } from '@/tw';
import { useLocale } from '@/locales/LocaleProvider';
import { colors } from '@/theme/colors';
import styles from './myQuestStyles';

type Role = 'worker' | 'hirer';
type QuestSummary = { title: string; tag: string; meta: string; detail: string; action: string };

const content = {
  th: {
    title: 'เควสต์ของฉัน', subtitle: 'ติดตามงานที่คุณรับและงานที่คุณโพสต์ไว้', worker: 'งานที่ฉันรับ', hirer: 'งานที่ฉันโพสต์',
    active: 'กำลังดำเนินการ', completed: 'เสร็จแล้ว', inProgress: 'กำลังทำ', activeSummary: 'ต้องติดตาม', completedSummary: 'ประวัติของคุณ',
    workerActive: [
      { title: 'ช่วยยกกล่องไปหอพัก', tag: 'moving', meta: 'วันนี้ · 17:00–19:00', detail: 'นัดทำงานกับ Nicha S.', action: 'ดูรายละเอียด' },
      { title: 'ล้างพัดลมหอพัก', tag: 'cleaning', meta: 'พรุ่งนี้ · 09:00–12:00', detail: 'รอเริ่มงาน', action: 'ดูรายละเอียด' },
    ],
    workerCompleted: [
      { title: 'พิมพ์โน้ตการเรียน', meta: 'เสร็จแล้ว 22 ส.ค. · ได้รับ ฿60' },
      { title: 'ส่งขนมให้กลุ่มอ่านหนังสือ', meta: 'เสร็จแล้ว 18 ส.ค. · ได้รับ ฿90' },
    ],
    hirerActive: [
      { title: 'ล้างพัดลมหอพัก', tag: 'cleaning', meta: '2 คนกำลังทำงาน', detail: 'นัดเสร็จพรุ่งนี้ · 12:00', action: 'ดูผู้ทำงาน' },
      { title: 'ซื้อข้าวจากโรงอาหาร', tag: 'delivery', meta: '1 คนกำลังทำงาน', detail: 'นัดส่งวันนี้ · 12:30', action: 'ติดตามงาน' },
    ],
    hirerCompleted: [
      { title: 'พิมพ์โปสเตอร์งานกิจกรรม', meta: 'เสร็จแล้ว 17 ส.ค. · รีวิวผู้ทำงานแล้ว' },
      { title: 'ช่วยย้ายอุปกรณ์ชมรม', meta: 'เสร็จแล้ว 10 ส.ค. · ปิดเควสต์แล้ว' },
    ],
  },
  en: {
    title: 'My Quests', subtitle: 'Keep up with work you accept and post', worker: 'Work I accepted', hirer: 'Work I posted',
    active: 'In progress', completed: 'Completed', inProgress: 'In progress', activeSummary: 'Needs attention', completedSummary: 'Your history',
    workerActive: [
      { title: 'Help move boxes to the dorm', tag: 'moving', meta: 'Today · 17:00–19:00', detail: 'Scheduled with Nicha S.', action: 'View details' },
      { title: 'Clean a dorm fan', tag: 'cleaning', meta: 'Tomorrow · 09:00–12:00', detail: 'Waiting to start', action: 'View details' },
    ],
    workerCompleted: [
      { title: 'Print lecture notes', meta: 'Completed 22 Aug · Earned ฿60' },
      { title: 'Deliver snacks to a study group', meta: 'Completed 18 Aug · Earned ฿90' },
    ],
    hirerActive: [
      { title: 'Clean a dorm fan', tag: 'cleaning', meta: '2 people working', detail: 'Due tomorrow · 12:00', action: 'View workers' },
      { title: 'Buy lunch from the canteen', tag: 'delivery', meta: '1 person working', detail: 'Due today · 12:30', action: 'Track work' },
    ],
    hirerCompleted: [
      { title: 'Print event posters', meta: 'Completed 17 Aug · Workers reviewed' },
      { title: 'Move club equipment', meta: 'Completed 10 Aug · Quest closed' },
    ],
  },
} as const;

export default function MyQuestsScreen() {
  const { locale } = useLocale();
  const copy = content[locale];
  const [role, setRole] = useState<Role>('worker');
  const active = role === 'worker' ? copy.workerActive : copy.hirerActive;
  const completed = role === 'worker' ? copy.workerCompleted : copy.hirerCompleted;

  return <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
    <ScrollView contentContainerClassName={styles.content} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" className={styles.title}>{copy.title}</Text>
      <Text className={styles.subtitle}>{copy.subtitle}</Text>

      <View accessibilityRole="tablist" className={styles.roleSwitch}>
        {(['worker', 'hirer'] as const).map((option) => {
          const selected = role === option;
          const label = option === 'worker' ? copy.worker : copy.hirer;
          const count = option === 'worker' ? copy.workerActive.length : copy.hirerActive.length;
          return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} key={option} onPress={() => setRole(option)} className={`${styles.roleOption} ${selected ? styles.roleOptionActive : ''}`} testID={`my-quests-role-${option}`}>
            <View className="items-center flex-row"><Text className={`${styles.roleOptionText} ${selected ? styles.roleOptionTextActive : ''}`}>{label}</Text><View className={`${styles.count} ${selected ? styles.countActive : ''}`}><Text className={`${styles.countText} ${selected ? styles.countTextActive : ''}`}>{count}</Text></View></View>
          </Pressable>;
        })}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}><Text accessibilityRole="header" className={styles.sectionTitle}>{copy.active}</Text><Text className={styles.sectionSummary}>{copy.activeSummary}</Text></View>
        <View className={styles.cards}>{active.map((quest) => <QuestCard key={quest.title} quest={quest} statusLabel={copy.inProgress} />)}</View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}><Text accessibilityRole="header" className={styles.sectionTitle}>{copy.completed}</Text><Text className={styles.sectionSummary}>{copy.completedSummary}</Text></View>
        <View className={styles.cards}>{completed.map((quest) => <CompletedQuest key={quest.title} quest={quest} />)}</View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function QuestCard({ quest, statusLabel }: { quest: QuestSummary; statusLabel: string }) {
  return <View className={styles.card}>
    <View className={styles.cardTop}><View className={styles.cardCopy}><Text className={styles.cardTitle}>{quest.title}</Text><View className={styles.tag}><Text className={styles.tagText}>{quest.tag}</Text></View></View><View className={styles.status}><Clock3 color={colors.success} size={14} strokeWidth={2.3} /><Text className={styles.statusText}>{statusLabel}</Text></View></View>
    <View className={styles.cardMeta}><View className="flex-1 min-w-0"><Text className={styles.metaText}>{quest.meta}</Text><Text className={styles.metaText}>{quest.detail}</Text></View><Pressable accessibilityRole="button" className={styles.action}><Text className={styles.actionText}>{quest.action}</Text></Pressable></View>
  </View>;
}

function CompletedQuest({ quest }: { quest: Pick<QuestSummary, 'title' | 'meta'> }) {
  return <Pressable accessibilityRole="button" className={styles.completedCard}><View className={styles.completedIcon}><Check color={colors.success} size={18} strokeWidth={2.5} /></View><View className={styles.completedCopy}><Text className={styles.completedTitle}>{quest.title}</Text><Text className={styles.completedMeta}>{quest.meta}</Text></View><ChevronRight color={colors.textMuted} size={20} /></Pressable>;
}
