import React, { useState } from 'react';
import { AccessibilityInfo, Alert, Modal, PanResponder, type GestureResponderEvent, type PanResponderGestureState, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  CircleUserRound,
  CircleX,
  Clock3,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  X,
  UsersRound,
  type LucideIcon,
} from 'lucide-react-native';

import { cn } from '@/tw/cn';
import { Pressable, SafeAreaView, ScrollView, Text, View } from '@/tw';
import { useLocale, type SupportedLocale } from '@/locales/LocaleProvider';
import { colors } from '@/theme/colors';
import { getAppChromeMetrics } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import styles from './myQuestStyles';

type Role = 'worker' | 'hirer';
type WorkerTab = 'pending' | 'accepted' | 'history';
type HirerTab = 'active' | 'draft' | 'completed';
type QuestDetailMode = 'join' | 'post';
type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';
type CategoryTone = 'green' | 'blue' | 'purple';

type QuestApplicant = {
  id: string;
  name: string;
  initials: string;
  detail: string;
  appliedOn: string;
  bio: string;
  skills: string;
  avatarColor: string;
};

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
  status: string;
  statusTone: StatusTone;
  action: string;
  secondaryAction?: string;
  groupChatId?: string;
  applicants?: QuestApplicant[];
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

type RoleOptionCopy = {
  label: string;
  description: string;
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
  questNavLabel: string;
  roleSelectorLabel: string;
  statusSelectorLabel: string;
  statusSwipeLabel: string;
  statusSwipeHint: string;
  statusPreviousLabel: string;
  statusNextLabel: string;
  roleLabels: Record<Role, string>;
  roleOptions: Record<Role, RoleOptionCopy>;
  back: string;
  help: string;
  teamSize: string;
  groupChat: string;
  applicantsTitle: string;
  applicantCount: (count: number) => string;
  applicantListTitle: string;
  selectApplicantsHint: string;
  selectedApplicants: (count: number) => string;
  confirmStart: (count: number) => string;
  confirmStartHint: string;
  selectionConfirmedTitle: string;
  selectionConfirmedDescription: (count: number) => string;
  viewProfile: string;
  profilePreviewTitle: string;
  profileAbout: string;
  profileSkills: string;
  closeProfile: string;
  noApplicantsTitle: string;
  noApplicantsDescription: string;
  closeApplicants: string;
  appliedOn: string;
  reason: string;
  host: string;
  worker: RoleCopy<WorkerTab>;
  hirer: RoleCopy<HirerTab>;
};

const content: Record<SupportedLocale, LocaleContent> = {
  th: {
    roleViewLabel: 'มุมมองเควสต์',
    questNavLabel: 'MyQuest',
    roleSelectorLabel: 'เลือกมุมมองเควสต์',
    statusSelectorLabel: 'เลือกสถานะเควสต์',
    statusSwipeLabel: 'ปัดซ้าย-ขวา',
    statusSwipeHint: 'ปัดซ้ายหรือขวาเพื่อดูสถานะอื่น',
    statusPreviousLabel: 'สถานะก่อนหน้า',
    statusNextLabel: 'สถานะถัดไป',
    roleLabels: { worker: 'เควสต์ที่ฉันเข้าร่วม', hirer: 'เควสต์ที่ฉันโพสต์' },
    roleOptions: {
      worker: { label: 'เข้าร่วมเควสต์', description: 'ดูเควสต์ที่คุณเข้าร่วม' },
      hirer: { label: 'โพสต์เควสต์', description: 'จัดการเควสต์ที่คุณโพสต์' },
    },
    back: 'ย้อนกลับ',
    help: 'ช่วยเหลือ',
    teamSize: 'ทีม',
    groupChat: 'แชตกลุ่ม',
    applicantsTitle: 'ผู้สมัครเควสต์',
    applicantCount: (count) => `${count} คน`,
    applicantListTitle: 'รายชื่อผู้สมัคร',
    selectApplicantsHint: 'แตะเพื่อเลือกผู้สมัครที่ต้องการเข้าร่วมเควสต์',
    selectedApplicants: (count) => `เลือกแล้ว ${count} คน`,
    confirmStart: (count) => `ยืนยันเริ่มงาน ${count} คน`,
    confirmStartHint: 'ผู้สมัครที่เลือกจะเริ่มงานในเควสต์นี้',
    selectionConfirmedTitle: 'ยืนยันเริ่มงานแล้ว',
    selectionConfirmedDescription: (count) => `เริ่มงานกับผู้สมัคร ${count} คนแล้ว`,
    viewProfile: 'ดูโปรไฟล์',
    profilePreviewTitle: 'โปรไฟล์ผู้สมัคร',
    profileAbout: 'เกี่ยวกับผู้สมัคร',
    profileSkills: 'ทักษะที่สนใจ',
    closeProfile: 'ปิดโปรไฟล์ผู้สมัคร',
    noApplicantsTitle: 'ยังไม่มีผู้สมัคร',
    noApplicantsDescription: 'เมื่อมีคนสมัครเข้ามา รายชื่อจะปรากฏที่นี่',
    closeApplicants: 'ปิดหน้าต่างผู้สมัคร',
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
            teamSize: '2 / 2', status: 'รอตรวจสอบ', statusTone: 'warning', action: 'ดูรายละเอียด', groupChatId: 'quest-move-boxes-group', host: 'นิชา ส.', appliedOn: '13 ส.ค.',
          },
          {
            id: 'clean-fan', title: 'ล้างพัดลมหอพัก', tag: 'ทำความสะอาด', categoryTone: 'green',
            date: 'พรุ่งนี้ · 09:00–12:00', location: 'ใต้หอพัก 13', description: 'ทำความสะอาดพัดลมส่วนกลางก่อนช่วงเย็น', detail: 'รอเริ่มงาน',
            teamSize: '1 / 2', status: 'รอคิว', statusTone: 'warning', action: 'ดูรายละเอียด', groupChatId: 'quest-clean-fan-group', host: 'พลอย เค.', appliedOn: '12 ส.ค.',
          },
        ],
        accepted: [
          {
            id: 'buy-lunch', title: 'ซื้อข้าวจากโรงอาหาร', tag: 'ส่งของ', categoryTone: 'green',
            date: 'วันนี้ · 10:00–13:00', location: 'โรงอาหารกลาง', description: 'ซื้ออาหารจากโรงอาหารและนำไปส่งให้ผู้ว่าจ้าง', detail: 'นัดหมายแล้ว',
            teamSize: '1 / 1', status: 'ตอบรับแล้ว', statusTone: 'success', action: 'แชตกับผู้โพสต์', host: 'บีม ที.', appliedOn: '10 ส.ค.',
          },
          {
            id: 'run-together', title: 'ไปวิ่งเป็นเพื่อน', tag: 'ออกกำลังกาย', categoryTone: 'green',
            date: '26 ส.ค. · 18:00–19:00', location: 'สนามอินทรีจันทรสถิตย์', description: 'วิ่งรอบมหาวิทยาลัยด้วยกันในช่วงเย็น', detail: 'ตอบรับเข้าร่วมแล้ว',
            teamSize: '2 / 3', status: 'ตอบรับแล้ว', statusTone: 'success', action: 'ดูรายละเอียด', host: 'เฟิร์น ล.', appliedOn: '9 ส.ค.',
          },
        ],
        history: [
          {
            id: 'print-notes', title: 'พิมพ์โน้ตการเรียน', tag: 'ถ่ายเอกสาร', categoryTone: 'blue',
            date: '22 ส.ค.', location: 'คณะวิทยาศาสตร์', description: 'พิมพ์โน้ตการเรียนสำหรับคลาสช่วงบ่าย', detail: 'ได้รับค่าตอบแทน ฿60',
            teamSize: '1 / 1', status: 'เสร็จแล้ว', statusTone: 'success', action: 'ดูรายละเอียด', host: 'เมย์ เค.', appliedOn: '20 ส.ค.',
          },
          {
            id: 'deliver-snacks', title: 'ส่งขนมให้กลุ่มอ่านหนังสือ', tag: 'ส่งของ', categoryTone: 'green',
            date: '18 ส.ค.', location: 'สำนักหอสมุด', description: 'นำขนมไปส่งให้กลุ่มอ่านหนังสือ', detail: 'ได้รับค่าตอบแทน ฿90',
            teamSize: '1 / 1', status: 'เสร็จแล้ว', statusTone: 'success', action: 'ดูรายละเอียด', host: 'พลอย น.', appliedOn: '16 ส.ค.',
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
            teamSize: '2 คนกำลังทำงาน', status: 'กำลังทำงาน', statusTone: 'success', action: 'ดูผู้สมัคร', secondaryAction: 'แก้ไข', groupChatId: 'quest-clean-fan-group',
            applicants: [
              { id: 'ploy-r', name: 'พลอย ร.', initials: 'พร', detail: 'คณะเศรษฐศาสตร์', appliedOn: 'สมัครวันนี้', bio: 'ชอบช่วยงานกิจกรรมและทำงานเป็นทีม', skills: 'ประสานงาน · จัดกิจกรรม', avatarColor: '#DDE9D9' },
              { id: 'beam-t', name: 'บีม ที.', initials: 'บที', detail: 'คณะวิทยาศาสตร์', appliedOn: 'สมัครเมื่อวาน', bio: 'ถนัดงานที่ต้องละเอียดและสื่อสารกับทีม', skills: 'วางแผน · สื่อสาร', avatarColor: '#EAF2FC' },
            ],
          },
          {
            id: 'buy-lunch', title: 'ซื้อข้าวจากโรงอาหาร', tag: 'ส่งของ', categoryTone: 'green',
            date: 'วันนี้ · 10:00–13:00', location: 'โรงอาหารกลาง', description: 'ซื้ออาหารจากโรงอาหารและนำไปส่งให้ผู้ว่าจ้าง', detail: 'นัดส่งวันนี้ · 12:30',
            teamSize: '1 คนกำลังทำงาน', status: 'รอผู้สมัคร', statusTone: 'warning', action: 'ดูผู้สมัคร', secondaryAction: 'แก้ไข', groupChatId: 'quest-buy-lunch-group',
            applicants: [],
          },
        ],
        draft: [],
        completed: [
          {
            id: 'print-event-posters', title: 'พิมพ์โปสเตอร์งานกิจกรรม', tag: 'ถ่ายเอกสาร', categoryTone: 'blue',
            date: '17 ส.ค.', location: 'ร้านถ่ายเอกสารหน้า มก.', description: 'พิมพ์และรับโปสเตอร์สำหรับงานกิจกรรมของคณะ', detail: 'รีวิวผู้ทำงานแล้ว',
            teamSize: '1 / 1', status: 'เสร็จแล้ว', statusTone: 'success', action: 'ดูรายละเอียด',
          },
          {
            id: 'move-club-equipment', title: 'ช่วยย้ายอุปกรณ์ชมรม', tag: 'ยกของ', categoryTone: 'green',
            date: '10 ส.ค.', location: 'อาคารกิจกรรมนิสิต', description: 'ย้ายอุปกรณ์กิจกรรมไปยังห้องจัดงาน', detail: 'ปิดเควสต์แล้ว',
            teamSize: '3 / 3', status: 'เสร็จแล้ว', statusTone: 'success', action: 'ดูรายละเอียด',
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
    questNavLabel: 'MyQuest',
    roleSelectorLabel: 'Choose a Quest view',
    statusSelectorLabel: 'Quest status',
    statusSwipeLabel: 'Swipe',
    statusSwipeHint: 'Swipe left or right to see more statuses',
    statusPreviousLabel: 'Previous status',
    statusNextLabel: 'Next status',
    roleLabels: { worker: 'Quests I joined', hirer: 'Quests I posted' },
    roleOptions: {
      worker: { label: 'Join Quest', description: 'View Quests you joined' },
      hirer: { label: 'Post Quest', description: 'Manage Quests you posted' },
    },
    back: 'Go back',
    help: 'Help',
    teamSize: 'Team size',
    groupChat: 'Group chat',
    applicantsTitle: 'Quest applicants',
    applicantCount: (count) => `${count} ${count === 1 ? 'candidate' : 'candidates'}`,
    applicantListTitle: 'Candidates',
    selectApplicantsHint: 'Tap to select candidates for this Quest',
    selectedApplicants: (count) => `${count} ${count === 1 ? 'candidate' : 'candidates'} selected`,
    confirmStart: (count) => `Confirm & start · ${count}`,
    confirmStartHint: 'Selected candidates will start this Quest.',
    selectionConfirmedTitle: 'Quest started',
    selectionConfirmedDescription: (count) => `The Quest is starting with ${count} ${count === 1 ? 'candidate' : 'candidates'}.`,
    viewProfile: 'View profile',
    profilePreviewTitle: 'Candidate profile',
    profileAbout: 'About this candidate',
    profileSkills: 'Skills and interests',
    closeProfile: 'Close candidate profile',
    noApplicantsTitle: 'No candidates yet',
    noApplicantsDescription: 'New applications will appear here when someone joins this Quest.',
    closeApplicants: 'Close applicants',
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
            teamSize: '2 / 2', status: 'Under review', statusTone: 'warning', action: 'View Detail', groupChatId: 'quest-move-boxes-group', host: 'Nicha S.', appliedOn: '13 Aug',
          },
          {
            id: 'clean-fan', title: 'Clean a dorm fan', tag: 'Cleaning', categoryTone: 'green',
            date: 'Tomorrow · 09:00–12:00', location: 'Under Dorm 13', description: 'Clean a shared fan before the evening', detail: 'Waiting for a place to open',
            teamSize: '1 / 2', status: 'Waitlist', statusTone: 'warning', action: 'View Detail', groupChatId: 'quest-clean-fan-group', host: 'Ploy K.', appliedOn: '12 Aug',
          },
        ],
        accepted: [
          {
            id: 'buy-lunch', title: 'Buy lunch from the canteen', tag: 'Delivery', categoryTone: 'green',
            date: 'Today · 10:00–13:00', location: 'Central Canteen', description: 'Buy a meal and bring it to the requester', detail: 'Scheduled with the host',
            teamSize: '1 / 1', status: 'Accepted', statusTone: 'success', action: 'Message Host', host: 'Beam T.', appliedOn: '10 Aug',
          },
          {
            id: 'run-together', title: 'Go running together', tag: 'Exercise', categoryTone: 'green',
            date: '26 Aug · 18:00–19:00', location: 'Insee Chanthasathit Field', description: 'Join a relaxed evening run around campus', detail: 'You are on the team',
            teamSize: '2 / 3', status: 'Accepted', statusTone: 'success', action: 'View Detail', host: 'Fern L.', appliedOn: '9 Aug',
          },
        ],
        history: [
          {
            id: 'print-notes', title: 'Print lecture notes', tag: 'Printing', categoryTone: 'blue',
            date: '22 Aug', location: 'Faculty of Science', description: 'Print lecture notes for an afternoon class', detail: 'Earned ฿60',
            teamSize: '1 / 1', status: 'Completed', statusTone: 'success', action: 'View Detail', host: 'May K.', appliedOn: '20 Aug',
          },
          {
            id: 'deliver-snacks', title: 'Deliver snacks to a study group', tag: 'Delivery', categoryTone: 'green',
            date: '18 Aug', location: 'University Library', description: 'Deliver snacks to a study group', detail: 'Earned ฿90',
            teamSize: '1 / 1', status: 'Completed', statusTone: 'success', action: 'View Detail', host: 'Ploy N.', appliedOn: '16 Aug',
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
            teamSize: '2 people working', status: 'Open', statusTone: 'success', action: 'View Applicants', secondaryAction: 'Edit', groupChatId: 'quest-clean-fan-group',
            applicants: [
              { id: 'ploy-r', name: 'Ploy R.', initials: 'PR', detail: 'Faculty of Economics', appliedOn: 'Applied today', bio: 'Enjoys helping with campus events and team projects.', skills: 'Coordination · Event support', avatarColor: '#DDE9D9' },
              { id: 'beam-t', name: 'Beam T.', initials: 'BT', detail: 'Faculty of Science', appliedOn: 'Applied yesterday', bio: 'Detail-oriented and comfortable coordinating with a team.', skills: 'Planning · Communication', avatarColor: '#EAF2FC' },
            ],
          },
          {
            id: 'buy-lunch', title: 'Buy lunch from the canteen', tag: 'Delivery', categoryTone: 'green',
            date: 'Today · 10:00–13:00', location: 'Central Canteen', description: 'Buy a meal and bring it to the requester', detail: 'Due today · 12:30',
            teamSize: '1 person working', status: 'Awaiting applicants', statusTone: 'warning', action: 'View Applicants', secondaryAction: 'Edit', groupChatId: 'quest-buy-lunch-group',
            applicants: [],
          },
        ],
        draft: [],
        completed: [
          {
            id: 'print-event-posters', title: 'Print event posters', tag: 'Printing', categoryTone: 'blue',
            date: '17 Aug', location: 'Copy shop by KU', description: 'Print and collect posters for a faculty event', detail: 'Workers reviewed',
            teamSize: '1 / 1', status: 'Completed', statusTone: 'success', action: 'View Detail',
          },
          {
            id: 'move-club-equipment', title: 'Move club equipment', tag: 'Moving', categoryTone: 'green',
            date: '10 Aug', location: 'Student Activity Building', description: 'Move event equipment to the activity hall', detail: 'Quest closed',
            teamSize: '3 / 3', status: 'Completed', statusTone: 'success', action: 'View Detail',
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
  if (/message|chat|แชต|ข้อความ/i.test(label)) return <MessageSquare color={colors.primary} size={size} strokeWidth={2.1} />;
  return <ChevronRight color={colors.primary} size={size} strokeWidth={2.1} />;
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

function TeamRow({ quest, copy }: { quest: QuestSummary; copy: LocaleContent }) {
  const palette = statusPalette[quest.statusTone];
  return (
    <View accessibilityLabel={`${copy.teamSize} ${quest.teamSize}`} className={styles.teamRow}>
      <View className={styles.teamMetric}>
        <Text className={styles.metricLabel}>{copy.teamSize}</Text>
        <UsersRound color={palette.foreground} size={16} strokeWidth={2} />
        <Text className={styles.metricValue} style={{ color: palette.foreground }}>{quest.teamSize}</Text>
      </View>
    </View>
  );
}

function ActionButton({ label, onPress, testID, compact = false, full = false, highlighted = false, accessibilityLabel }: { label: string; onPress: () => void; testID: string; compact?: boolean; full?: boolean; highlighted?: boolean; accessibilityLabel?: string }) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel ?? label} accessibilityRole="button" className={cn(styles.actionButton, compact && styles.actionButtonCompact, full && styles.actionButtonFull, highlighted && styles.actionButtonHighlighted)} onPress={onPress} testID={testID}>
      {renderActionIcon(label, compact ? 14 : 17)}
      <Text className={cn(styles.actionText, compact && styles.actionTextCompact)}>{label}</Text>
    </Pressable>
  );
}

function CreatedQuestCard({ quest, copy, onPress, onPrimaryAction, onGroupChat }: { quest: QuestSummary; copy: LocaleContent; onPress: () => void; onPrimaryAction: () => void; onGroupChat: () => void }) {
  return (
    <View className={styles.card}>
      <View className={styles.cardHeadingRow}>
        <View className={styles.cardHeadingCopy}>
          <CategoryTag quest={quest} />
          <Text className={styles.cardTitle} numberOfLines={2}>{quest.title}</Text>
        </View>
        <StatusPill status={quest.status} tone={quest.statusTone} />
      </View>
      <QuestMeta quest={quest} />
      <Text className={styles.cardDescription} numberOfLines={2}>{quest.description}</Text>
      <TeamRow copy={copy} quest={quest} />
      <View className={styles.actionsRow}>
        {quest.secondaryAction ? <ActionButton label={quest.secondaryAction} onPress={onPress} testID={`my-quest-action-${quest.id}-secondary`} /> : null}
        <ActionButton full={!quest.secondaryAction} label={quest.action} onPress={onPrimaryAction} testID={`my-quest-action-${quest.id}`} />
      </View>
      {quest.groupChatId ? <View className={styles.groupChatRow}><ActionButton highlighted full label={copy.groupChat} onPress={onGroupChat} testID={`my-quest-group-chat-${quest.id}`} /></View> : null}
    </View>
  );
}

function ApplicationQuestCard({ quest, copy, onPress, onGroupChat }: { quest: QuestSummary; copy: LocaleContent; onPress: () => void; onGroupChat: () => void }) {
  const sideDetailLabel = quest.reason ? copy.reason : copy.appliedOn;
  const sideDetail = quest.reason ?? quest.appliedOn;
  const questAccessibilityLabel = [quest.title, quest.status, quest.date, quest.location, quest.detail, quest.action].join('. ');
  return (
    <View className={styles.applicationCard}>
      <View className={styles.cardHeadingRow}>
        <View className={styles.cardHeadingCopy}>
          <CategoryTag quest={quest} />
          <Text className={styles.applicationTitle} numberOfLines={2}>{quest.title}</Text>
        </View>
        <StatusPill status={quest.status} tone={quest.statusTone} />
      </View>
      <QuestMeta quest={quest} />
      <Text className={styles.applicationDescription} numberOfLines={2}>{quest.description}</Text>
      <View className={styles.hostRow}>
        <View className={styles.hostIcon}><CircleUserRound color={colors.primary} size={15} strokeWidth={2} /></View>
        <Text className={styles.hostText} numberOfLines={1}>{quest.host ?? quest.detail}</Text>
      </View>
      <View className={styles.applicationFacts}>
        <View className={styles.applicationFact}>
          <Text className={styles.sideLabel}>{sideDetailLabel}</Text>
          <Text className={styles.sideValue} numberOfLines={2}>{sideDetail ?? quest.detail}</Text>
        </View>
        {!quest.reason ? <View className={styles.applicationFact}><Text className={styles.sideLabel}>{copy.teamSize}</Text><View className={styles.sideTeam}><UsersRound color={colors.primary} size={14} strokeWidth={2} /><Text className={styles.sideValue} numberOfLines={1}>{quest.teamSize}</Text></View></View> : null}
      </View>
      <View className={styles.actionsRow}>
        <ActionButton accessibilityLabel={questAccessibilityLabel} full label={quest.action} onPress={onPress} testID={`my-quest-action-${quest.id}`} />
      </View>
      {quest.groupChatId ? <View className={styles.groupChatRow}><ActionButton accessibilityLabel={`${copy.groupChat}: ${quest.title}`} highlighted full label={copy.groupChat} onPress={onGroupChat} testID={`my-quest-group-chat-${quest.id}`} /></View> : null}
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

function RoleMenu({ copy, role, onSelect }: { copy: LocaleContent; role: Role; onSelect: (nextRole: Role) => void }) {
  return (
    <View accessibilityLabel={copy.roleSelectorLabel} accessibilityRole="menu" className={styles.roleMenu}>
      <Text className={styles.roleMenuTitle}>{copy.roleSelectorLabel}</Text>
      {(['worker', 'hirer'] as const).map((option) => {
        const selected = role === option;
        const RoleIcon = option === 'worker' ? UsersRound : BriefcaseBusiness;
        const optionCopy = copy.roleOptions[option];
        return <Pressable accessibilityLabel={`${optionCopy.label}. ${optionCopy.description}`} accessibilityRole="menuitem" accessibilityState={{ selected }} className={cn(styles.roleMenuOption, selected && styles.roleMenuOptionActive)} key={option} onPress={() => onSelect(option)} testID={`my-quests-role-${option}`}><View className={styles.roleMenuIcon}><RoleIcon color={colors.primary} size={20} strokeWidth={2.1} /></View><View className={styles.roleMenuCopy}><Text className={cn(styles.roleMenuOptionText, selected && styles.roleMenuOptionTextActive)}>{optionCopy.label}</Text><Text className={styles.roleMenuOptionDescription}>{optionCopy.description}</Text></View>{selected ? <View className={styles.roleMenuCheck}><Check color={colors.white} size={14} strokeWidth={3} /></View> : null}</Pressable>;
      })}
    </View>
  );
}

function ApplicantRow({ applicant, copy, selected, onToggle, onViewProfile }: { applicant: QuestApplicant; copy: LocaleContent; selected: boolean; onToggle: () => void; onViewProfile: () => void }) {
  return (
    <View className={cn(styles.applicantRow, selected && styles.applicantRowSelected)}>
      <Pressable accessibilityLabel={`${applicant.name}. ${copy.selectApplicantsHint}`} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} className={styles.applicantSelectRow} onPress={onToggle} testID={`my-quests-applicant-select-${applicant.id}`}>
        <View className={cn(styles.applicantSelectionBox, selected && styles.applicantSelectionBoxSelected)}>{selected ? <Check color={colors.white} size={15} strokeWidth={3} /> : null}</View>
        <View className={styles.applicantAvatar} style={{ backgroundColor: applicant.avatarColor }}><Text className={styles.applicantAvatarText}>{applicant.initials}</Text></View>
        <View className={styles.applicantCopy}>
          <Text className={styles.applicantName} numberOfLines={1}>{applicant.name}</Text>
          <Text className={styles.applicantDetail} numberOfLines={1}>{applicant.detail}</Text>
          <View className={styles.applicantApplied}><Clock3 color={colors.textMuted} size={12} strokeWidth={2} /><Text className={styles.applicantAppliedText}>{applicant.appliedOn}</Text></View>
        </View>
      </Pressable>
      <View className={styles.applicantActionsRow}>
        <Pressable accessibilityLabel={`${copy.viewProfile}: ${applicant.name}`} accessibilityRole="button" className={styles.applicantProfileButton} onPress={onViewProfile} testID={`my-quests-applicant-profile-${applicant.id}`}>
          <CircleUserRound color={colors.primary} size={15} strokeWidth={2.1} />
          <Text className={styles.applicantProfileText}>{copy.viewProfile}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ApplicantProfileSheet({ applicant, copy, bottomInset, onClose }: { applicant: QuestApplicant; copy: LocaleContent; bottomInset: number; onClose: () => void }) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <View className={styles.profileModalOverlay}>
        <Pressable accessibilityLabel={copy.closeProfile} accessibilityRole="button" className={styles.profileModalBackdrop} onPress={onClose} />
        <View accessibilityViewIsModal className={styles.profileModalSheet} style={{ paddingBottom: Math.max(spacing.md, bottomInset + spacing.sm) }} testID="my-quests-applicant-profile-sheet">
          <View className={styles.applicantModalHandle} />
          <View className={styles.applicantModalHeader}>
            <Text accessibilityRole="header" className={styles.applicantModalTitle}>{copy.profilePreviewTitle}</Text>
            <Pressable accessibilityLabel={copy.closeProfile} accessibilityRole="button" className={styles.applicantModalClose} onPress={onClose} testID="my-quests-applicant-profile-close"><X color={colors.textStrong} size={20} strokeWidth={2.3} /></Pressable>
          </View>
          <View className={styles.profileHero}>
            <View className={styles.profileAvatar} style={{ backgroundColor: applicant.avatarColor }}><Text className={styles.profileAvatarText}>{applicant.initials}</Text></View>
            <Text className={styles.profileName}>{applicant.name}</Text>
            <Text className={styles.profileDetail}>{applicant.detail}</Text>
          </View>
          <View className={styles.profileDetails}>
            <View className={styles.profileDetailRow}><CircleUserRound color={colors.primary} size={20} strokeWidth={2} /><View className={styles.profileDetailCopy}><Text className={styles.profileDetailLabel}>{copy.profileAbout}</Text><Text className={styles.profileDetailValue}>{applicant.bio}</Text></View></View>
            <View className={styles.profileDetailRow}><BriefcaseBusiness color={colors.primary} size={20} strokeWidth={2} /><View className={styles.profileDetailCopy}><Text className={styles.profileDetailLabel}>{copy.profileSkills}</Text><Text className={styles.profileDetailValue}>{applicant.skills}</Text></View></View>
            <View className={styles.profileDetailRow}><Clock3 color={colors.primary} size={20} strokeWidth={2} /><View className={styles.profileDetailCopy}><Text className={styles.profileDetailLabel}>{copy.appliedOn}</Text><Text className={styles.profileDetailValue}>{applicant.appliedOn}</Text></View></View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ApplicantSheet({ quest, copy, bottomInset, onClose }: { quest: QuestSummary; copy: LocaleContent; bottomInset: number; onClose: () => void }) {
  const applicants = quest.applicants ?? [];
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<Set<string>>(new Set());
  const [profileApplicant, setProfileApplicant] = useState<QuestApplicant | null>(null);
  const toggleApplicant = (applicantId: string) => {
    setSelectedApplicantIds((current) => {
      const next = new Set(current);
      if (next.has(applicantId)) next.delete(applicantId);
      else next.add(applicantId);
      return next;
    });
  };
  const confirmSelection = () => {
    const selectedCount = selectedApplicantIds.size;
    if (selectedCount === 0) return;
    Alert.alert(copy.selectionConfirmedTitle, copy.selectionConfirmedDescription(selectedCount), [{ text: copy.closeApplicants, onPress: onClose }]);
  };
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <View className={styles.applicantModalOverlay}>
        <Pressable accessibilityLabel={copy.closeApplicants} accessibilityRole="button" className={styles.applicantModalBackdrop} onPress={onClose} />
        <View accessibilityViewIsModal className={styles.applicantModalSheet} style={{ paddingBottom: Math.max(spacing.md, bottomInset + spacing.sm) }} testID="my-quests-applicant-sheet">
          <View className={styles.applicantModalHandle} />
          <View className={styles.applicantModalHeader}>
            <View className={styles.applicantModalHeading}>
              <Text accessibilityRole="header" className={styles.applicantModalTitle}>{copy.applicantsTitle}</Text>
              <Text className={styles.applicantModalSubtitle} numberOfLines={1}>{quest.title}</Text>
            </View>
            <Pressable accessibilityLabel={copy.closeApplicants} accessibilityRole="button" className={styles.applicantModalClose} onPress={onClose} testID="my-quests-applicant-close"><X color={colors.textStrong} size={20} strokeWidth={2.3} /></Pressable>
          </View>
          <View className={styles.applicantContext}>
            <View className={styles.applicantContextIcon}><UsersRound color={colors.primary} size={21} strokeWidth={2.1} /></View>
            <View className={styles.applicantContextCopy}><Text className={styles.applicantContextLabel}>{copy.applicantCount(applicants.length)}</Text><Text className={styles.applicantContextTitle} numberOfLines={1}>{quest.detail}</Text></View>
          </View>
          <ScrollView className={styles.applicantModalScroll} contentContainerClassName={styles.applicantModalContent} showsVerticalScrollIndicator={false}>
            {applicants.length > 0 ? <><View className={styles.applicantSectionHeader}><Text className={styles.applicantSectionLabel}>{copy.applicantListTitle}</Text>{selectedApplicantIds.size > 0 ? <Text className={styles.selectedApplicantsText}>{copy.selectedApplicants(selectedApplicantIds.size)}</Text> : null}</View><Text className={styles.selectApplicantsHint}>{copy.selectApplicantsHint}</Text><View className={styles.applicantList}>{applicants.map((applicant) => <ApplicantRow applicant={applicant} copy={copy} key={applicant.id} onToggle={() => toggleApplicant(applicant.id)} onViewProfile={() => setProfileApplicant(applicant)} selected={selectedApplicantIds.has(applicant.id)} />)}</View></> : <View accessibilityLabel={copy.noApplicantsTitle} className={styles.noApplicantsState} testID="my-quests-no-applicants"><View className={styles.noApplicantsIcon}><UsersRound color={colors.primary} size={26} strokeWidth={1.9} /></View><Text className={styles.noApplicantsTitle}>{copy.noApplicantsTitle}</Text><Text className={styles.noApplicantsDescription}>{copy.noApplicantsDescription}</Text></View>}
          </ScrollView>
          {selectedApplicantIds.size > 0 ? <View className={styles.applicantConfirmFooter}><View className={styles.applicantConfirmCopy}><Text className={styles.applicantConfirmCount}>{copy.selectedApplicants(selectedApplicantIds.size)}</Text><Text className={styles.applicantConfirmHint}>{copy.confirmStartHint}</Text></View><Pressable accessibilityLabel={copy.confirmStart(selectedApplicantIds.size)} accessibilityRole="button" className={styles.applicantConfirmButton} onPress={confirmSelection} testID="my-quests-applicant-confirm"><Check color={colors.white} size={17} strokeWidth={2.8} /><Text className={styles.applicantConfirmButtonText}>{copy.confirmStart(selectedApplicantIds.size)}</Text></Pressable></View> : null}
        </View>
      </View>
      {profileApplicant ? <ApplicantProfileSheet applicant={profileApplicant} bottomInset={bottomInset} copy={copy} onClose={() => setProfileApplicant(null)} /> : null}
    </Modal>
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
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [workerTab, setWorkerTab] = useState<WorkerTab>('pending');
  const [hirerTab, setHirerTab] = useState<HirerTab>('active');
  const [applicantQuest, setApplicantQuest] = useState<QuestSummary | null>(null);
  const roleCopy = role === 'worker' ? copy.worker : copy.hirer;
  const selectedTab = role === 'worker' ? workerTab : hirerTab;
  const items = role === 'worker' ? copy.worker.items[workerTab] : copy.hirer.items[hirerTab];
  const tabOptions: readonly (WorkerTab | HirerTab)[] = role === 'worker' ? workerTabs : hirerTabs;
  const bottomPadding = (chromeMetrics.isTablet ? spacing.lg : chromeMetrics.navHeight + insets.bottom) + spacing.lg;

  const selectRole = (nextRole: Role) => {
    setRole(nextRole);
    setRoleMenuOpen(false);
    AccessibilityInfo.announceForAccessibility(copy.roleLabels[nextRole]);
  };

  const selectTab = (nextTab: WorkerTab | HirerTab) => {
    const wasSelected = selectedTab === nextTab;
    if (role === 'worker') {
      setWorkerTab(nextTab as WorkerTab);
    } else {
      setHirerTab(nextTab as HirerTab);
    }
    if (!wasSelected) {
      AccessibilityInfo.announceForAccessibility(role === 'worker' ? copy.worker.tabs[nextTab as WorkerTab] : copy.hirer.tabs[nextTab as HirerTab]);
    }
  };

  const moveStatus = (direction: -1 | 1) => {
    const currentIndex = tabOptions.indexOf(selectedTab);
    const nextIndex = (currentIndex + direction + tabOptions.length) % tabOptions.length;
    const nextTab = tabOptions[nextIndex];
    if (nextTab) selectTab(nextTab);
  };

  const handleStatusSwipe = (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    if (Math.abs(gestureState.dx) < 32 || Math.abs(gestureState.dx) <= Math.abs(gestureState.dy)) return;
    moveStatus(gestureState.dx < 0 ? 1 : -1);
  };

  const statusSwipeResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gestureState) => Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
    onPanResponderRelease: handleStatusSwipe,
  });

  const openQuest = (questId: string, mode?: QuestDetailMode, joinStatus?: WorkerTab) => {
    router.push({ pathname: '/quest/[id]', params: { id: questId, ...(mode ? { mode } : {}), ...(mode === 'join' && joinStatus ? { joinStatus } : {}) } });
  };

  const openGroupChat = (chatId: string) => {
    router.push({ pathname: '/chat/[id]', params: { id: chatId } });
  };

  const openPrimaryQuestAction = (quest: QuestSummary) => {
    if (quest.applicants) {
      setApplicantQuest(quest);
      return;
    }
    openQuest(quest.id, 'post');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className={styles.safeArea}>
      <View className={cn(styles.hero, roleMenuOpen && styles.heroMenuOpen)}>
        <View className={styles.headerRow}>
          <Pressable accessibilityLabel={copy.back} accessibilityRole="button" className={styles.heroIconButton} onPress={() => router.back()} testID="my-quests-back-button"><ArrowLeft color={colors.primary} size={24} strokeWidth={2.2} /></Pressable>
          <Pressable accessibilityLabel={`${copy.roleViewLabel}: ${copy.questNavLabel}`} accessibilityRole="button" accessibilityState={{ expanded: roleMenuOpen }} className={cn(styles.roleNavButton, roleMenuOpen && styles.roleNavButtonOpen)} onPress={() => setRoleMenuOpen((isOpen) => !isOpen)} testID="my-quests-role-trigger"><Text className={styles.roleNavText}>{copy.questNavLabel}</Text>{roleMenuOpen ? <ChevronUp color={colors.primary} size={18} strokeWidth={2.4} /> : <ChevronDown color={colors.primary} size={18} strokeWidth={2.4} />}</Pressable>
          <View accessibilityElementsHidden className={styles.heroIconSpacer} importantForAccessibility="no" />
        </View>
        {roleMenuOpen ? <RoleMenu copy={copy} onSelect={selectRole} role={role} /> : null}
        <Text className={styles.heroSubtitle}>{roleCopy.subtitle}</Text>
        <View className={styles.selectorSectionStatus}>
          <View className={styles.selectorLabelRow}>
            <Text className={styles.selectorLabel}>{copy.statusSelectorLabel}</Text>
            <View className={styles.selectorSwipeHint}>
              <ChevronLeft color={colors.textMuted} size={12} strokeWidth={2.4} />
              <Text className={styles.selectorSwipeHintText}>{copy.statusSwipeLabel}</Text>
              <ChevronRight color={colors.textMuted} size={12} strokeWidth={2.4} />
            </View>
          </View>
          <View
            accessibilityHint={copy.statusSwipeHint}
            accessibilityLabel={`${roleCopy.title} status selector`}
            accessibilityRole="tablist"
            className={styles.statusTabsFrame}
            {...statusSwipeResponder.panHandlers}
            testID="my-quests-status-carousel"
          >
            <Pressable accessibilityLabel={copy.statusPreviousLabel} accessibilityRole="button" className={styles.statusArrow} onPress={() => moveStatus(-1)} testID="my-quests-status-previous"><ChevronLeft color={colors.primary} size={20} strokeWidth={2.4} /></Pressable>
            <View accessibilityLabel={`${role === 'worker' ? copy.worker.tabs[workerTab] : copy.hirer.tabs[hirerTab]} (${items.length})`} accessibilityRole="tab" accessibilityState={{ selected: true }} className={styles.statusCurrent}>
              <Text className={styles.statusCurrentText}>{role === 'worker' ? copy.worker.tabs[workerTab] : copy.hirer.tabs[hirerTab]}</Text>
              <View className={cn(styles.statusCount, styles.statusCountActive)}><Text className={cn(styles.statusCountText, styles.statusCountTextActive)}>{items.length}</Text></View>
            </View>
            <Pressable accessibilityLabel={copy.statusNextLabel} accessibilityRole="button" className={styles.statusArrow} onPress={() => moveStatus(1)} testID="my-quests-status-next"><ChevronRight color={colors.primary} size={20} strokeWidth={2.4} /></Pressable>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPadding }}>
        <View className={styles.surface}>
          <View accessibilityLabel={`${role === 'worker' ? copy.worker.tabs[workerTab] : copy.hirer.tabs[hirerTab]} Quest list`} className={styles.list}>
            {items.length > 0 ? items.map((quest) => role === 'worker'
              ? <ApplicationQuestCard key={quest.id} copy={copy} onGroupChat={() => quest.groupChatId ? openGroupChat(quest.groupChatId) : undefined} onPress={() => openQuest(quest.id, 'join', workerTab)} quest={quest} />
              : <CreatedQuestCard key={quest.id} copy={copy} onGroupChat={() => quest.groupChatId ? openGroupChat(quest.groupChatId) : undefined} onPrimaryAction={() => openPrimaryQuestAction(quest)} onPress={() => openQuest(quest.id, 'post')} quest={quest} />)
              : <EmptyState copy={roleCopy} />}
          </View>
          {role === 'worker' && copy.worker.summary ? <SummaryStrip metrics={copy.worker.summary} /> : null}
          <TipCard description={roleCopy.tipDescription} title={roleCopy.tipTitle} />
        </View>
      </ScrollView>
      {applicantQuest ? <ApplicantSheet bottomInset={insets.bottom} copy={copy} onClose={() => setApplicantQuest(null)} quest={applicantQuest} /> : null}
    </SafeAreaView>
  );
}
