import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
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

const profileData: ProfileData = {
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
      icon: '▣',
      title: 'Senior Peer Tutor',
      meta: 'University Academic Center • 2022 - Present',
      description:
        'Assisted over 100 students in foundational programming courses. Maintained a 4.9/5 satisfaction rating.',
    },
    {
      icon: '‹›',
      title: 'Frontend Developer Intern',
      meta: 'Tech Startup Inc. • Summer 2023',
      description:
        'Developed responsive UI components using React and Tailwind CSS, improving site performance by 15%.',
    },
  ],
  project: {
    title: 'Title',
    description:
      '“Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa',
  },
  achievements: [
    {
      icon: '☆',
      title: 'Advanced React Patterns',
      meta: 'Frontend Masters, 2023',
    },
    {
      icon: '✧',
      title: 'UI/UX Design Specialization',
      meta: 'Coursera, 2022',
    },
  ],
  review: {
    score: '4.9',
    count: '15',
    name: 'Alex Smith',
    date: '2 สัปดาห์ก่อน',
    comment: '“Jane is an amazing tutor! She explained complex topics in a very simple way....',
  },
};

export default function Profile() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar />

      <ScrollView contentContainerStyle={styles.content}>
        <ProfileHeader data={profileData} />

        <ProfileStats
          rating={profileData.rating}
          completedCases={profileData.completedCases}
        />

        <AboutMe about={profileData.about} />

        <WorkExperience experiences={profileData.experiences} />

        <MyWork project={profileData.project} />

        <Achievements achievements={profileData.achievements} />

        <ProfileReviews review={profileData.review} />
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
    padding: 32,
    gap: 32,
    paddingBottom: 120,
  },
});