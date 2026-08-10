import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AboutMe,
  Achievements,
  MyWork,
  ProfileData,
  ProfileHeader,
  ProfileReviews,
  ProfileStats,
  TopBar,
  WorkExperience,
} from '../components/Shared';

type ProfileLanguage = 'en' | 'th';

interface ProfileProps {
  lang?: ProfileLanguage;
}

interface ProfileTranslation {
  profileData: ProfileData;
  editProfileLabel: string;
  ratingLabel: string;
  completedCasesLabel: string;
  aboutTitle: string;
  experienceTitle: string;
  myWorkTitle: string;
  achievementsTitle: string;
  reviewTitle: string;
  reviewCountText: string;
}

const translations: Record<ProfileLanguage, ProfileTranslation> = {
  en: {
    profileData: {
      name: 'Jane Doe',
      faculty: 'Faculty of Engineering',
      universityStatus: 'Student',
      skills: ['Web Dev', 'Design', 'Tutor'],
      rating: '4.9',
      completedCases: '42',
      about:
        'Passionate engineering student with a knack for turning complex problems into elegant solutions. I specialize in front-end development and love sharing my knowledge through peer tutoring. Always eager to collaborate on innovative projects that push boundaries.',
      experiences: [
        {
          icon: 'work',
          title: 'Senior Peer Tutor',
          meta: 'University Academic Center • 2022 - Present',
          description:
            'Assisted over 100 students in foundational programming courses. Maintained a 4.9/5 satisfaction rating.',
        },
        {
          icon: 'work',
          title: 'Frontend Developer Intern',
          meta: 'Tech Startup Inc. • Summer 2023',
          description:
            'Developed responsive UI components using React and Tailwind CSS, improving site performance by 15%.',
        },
      ],
      project: {
        title: 'Title',
        description:
          'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa.',
      },
      achievements: [
        {
          icon: 'achievement',
          title: 'Advanced React Patterns',
          meta: 'Frontend Masters, 2023',
        },
        {
          icon: 'achievement',
          title: 'UI/UX Design Specialization',
          meta: 'Coursera, 2022',
        },
      ],
      review: {
        score: '4.9',
        count: '15',
        ratingDistribution: { 5: 14, 4: 0, 3: 1 },
        name: 'Alex Smith',
        date: '2 weeks ago',
        comment:
          'Jane is an amazing tutor! She explained complex topics in a very simple way.',
      },
    },
    editProfileLabel: 'Edit Your Profile',
    ratingLabel: 'User rating',
    completedCasesLabel: 'Completed quests',
    aboutTitle: 'About Me',
    experienceTitle: 'Experience',
    myWorkTitle: 'My Work',
    achievementsTitle: 'Certificate',
    reviewTitle: 'Review',
    reviewCountText: 'From the last\n15 reviews',
  },
  th: {
    profileData: {
      name: 'Jane Doe',
      faculty: 'คณะวิศวกรรมศาสตร์',
      universityStatus: 'นิสิต',
      skills: ['พัฒนาเว็บ', 'ออกแบบ', 'ติวเตอร์'],
      rating: '4.9',
      completedCases: '42',
      about:
        'นิสิตวิศวกรรมศาสตร์ที่หลงใหลในการเปลี่ยนปัญหาซับซ้อนให้เป็นคำตอบที่เรียบง่าย เชี่ยวชาญด้านการพัฒนาฟรอนต์เอนด์และชอบแบ่งปันความรู้ผ่านการติวเพื่อน พร้อมร่วมงานกับทุกไอเดียใหม่เสมอ',
      experiences: [
        {
          icon: 'work',
          title: 'ติวเตอร์อาวุโส',
          meta: 'ศูนย์การเรียนรู้มหาวิทยาลัย • 2022 - ปัจจุบัน',
          description:
            'ช่วยเหลือนิสิตกว่า 100 คนในวิชาพื้นฐานด้านการเขียนโปรแกรม และรักษาคะแนนความพึงพอใจ 4.9/5',
        },
        {
          icon: 'work',
          title: 'นักพัฒนาฟรอนต์เอนด์ฝึกงาน',
          meta: 'บริษัทเทคโนโลยี • ฤดูร้อน 2023',
          description:
            'พัฒนาคอมโพเนนต์ UI แบบตอบสนองด้วย React และ Tailwind CSS ช่วยเพิ่มประสิทธิภาพเว็บไซต์ 15%',
        },
      ],
      project: {
        title: 'ชื่อผลงาน',
        description:
          'ผลงานตัวอย่างสำหรับแสดงแนวคิด กระบวนการออกแบบ และการพัฒนาโปรเจกต์',
      },
      achievements: [
        {
          icon: 'achievement',
          title: 'รูปแบบ React ขั้นสูง',
          meta: 'Frontend Masters, 2023',
        },
        {
          icon: 'achievement',
          title: 'ความเชี่ยวชาญด้าน UI/UX',
          meta: 'Coursera, 2022',
        },
      ],
      review: {
        score: '4.9',
        count: '15',
        ratingDistribution: { 5: 14, 4: 0, 3: 1 },
        name: 'อเล็กซ์ สมิธ',
        date: '2 สัปดาห์ก่อน',
        comment:
          'เจนเป็นติวเตอร์ที่ยอดเยี่ยม อธิบายหัวข้อที่ซับซ้อนได้เข้าใจง่ายมาก',
      },
    },
    editProfileLabel: 'แก้ไขโปรไฟล์',
    ratingLabel: 'คะแนนจากผู้ใช้',
    completedCasesLabel: 'จำนวนเควสที่เคยทำ',
    aboutTitle: 'เกี่ยวกับฉัน',
    experienceTitle: 'ประสบการณ์',
    myWorkTitle: 'งานของฉัน',
    achievementsTitle: 'ผลงาน',
    reviewTitle: 'รีวิว',
    reviewCountText: 'จากการรีวิว\n15 ครั้ง',
  },
};

export default function Profile({ lang = 'en' }: ProfileProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const t = translations[lang];
  const { profileData } = t;

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar />

      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.tabletContent]}>
        <ProfileHeader data={profileData} editProfileLabel={t.editProfileLabel} />

        <ProfileStats
          rating={profileData.rating}
          completedCases={profileData.completedCases}
          ratingLabel={t.ratingLabel}
          completedCasesLabel={t.completedCasesLabel}
        />

        <AboutMe about={profileData.about} sectionTitle={t.aboutTitle} />

        <WorkExperience
          experiences={profileData.experiences}
          sectionTitle={t.experienceTitle}
        />

        <MyWork project={profileData.project} sectionTitle={t.myWorkTitle} />

        <Achievements
          achievements={profileData.achievements}
          sectionTitle={t.achievementsTitle}
        />

        <ProfileReviews
          review={profileData.review}
          sectionTitle={t.reviewTitle}
          reviewCountText={t.reviewCountText}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCF9F8',
  },
  content: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 32,
    gap: 32,
    paddingBottom: 120,
  },
  tabletContent: {
    alignSelf: 'center',
    maxWidth: 720,
    paddingHorizontal: 32,
  },
});