import React from 'react';
import { Image, ImageSourcePropType, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Button } from '../../../components/ui/AppPrimitives';
export interface ProfileExperience {
  icon: string;
  title: string;
  meta: string;
  description: string;
}

export interface ProfileAchievement {
  icon: string;
  title: string;
  meta: string;
}

export interface ProfileData {
  name: string;
  faculty: string;
  universityStatus: string;
  skills: string[];
  rating: string;
  completedCases: string;
  about: string;
  experiences: ProfileExperience[];
  project: { title: string; description: string };
  achievements: ProfileAchievement[];
  review: { score: string; count: string; ratingDistribution: Record<3 | 4 | 5, number>; name: string; date: string; comment: string };
}
export const ProfileHeader = ({ data, profileImage, onEditPress, editProfileLabel = 'Edit Your Profile' }: { data: Pick<ProfileData, 'name' | 'faculty' | 'universityStatus' | 'skills'>; profileImage?: ImageSourcePropType; onEditPress?: () => void; editProfileLabel?: string }) => (
  <View style={profileStyles.profileHeroCard}>
    <View style={profileStyles.profilePhotoFrame}>{profileImage ? <Image source={profileImage} style={profileStyles.profilePhoto} /> : <Text style={profileStyles.profilePhotoInitials}>JD</Text>}</View>
    <Text style={profileStyles.profilePageName}>{data.name}</Text><Text style={profileStyles.profileFaculty}>{data.faculty}</Text><Text style={profileStyles.profileUniversityStatus}>{data.universityStatus}</Text>
    <View style={profileStyles.profileSkills}>{data.skills.map((skill) => <View key={skill} style={profileStyles.profileSkill}><Text style={profileStyles.profileSkillText}>{skill}</Text></View>)}</View>
    <Button onPress={onEditPress} style={profileStyles.profileEditAction}>
      <Svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <Path d="M1.16667 9.33333H1.99792L7.7 3.63125L6.86875 2.8L1.16667 8.50208V9.33333ZM0 10.5V8.02083L7.7 0.335417C7.81667 0.228472 7.94549 0.145833 8.08646 0.0875C8.22743 0.0291667 8.37569 0 8.53125 0C8.68681 0 8.8375 0.0291667 8.98333 0.0875C9.12917 0.145833 9.25556 0.233333 9.3625 0.35L10.1646 1.16667C10.2812 1.27361 10.3663 1.4 10.4198 1.54583C10.4733 1.69167 10.5 1.8375 10.5 1.98333C10.5 2.13889 10.4733 2.28715 10.4198 2.42812C10.3663 2.5691 10.2812 2.69792 10.1646 2.81458L2.47917 10.5H0ZM7.27708 3.22292L6.86875 2.8L7.7 3.63125L7.27708 3.22292Z" fill="white" />
      </Svg>
      <Text style={profileStyles.profileEditActionText}>{editProfileLabel}</Text> 
    </Button>
  </View>
);

export const ProfileStats = ({ rating, completedCases, ratingLabel = 'User rating', completedCasesLabel = 'Completed quests' }: Pick<ProfileData, 'rating' | 'completedCases'> & { ratingLabel?: string; completedCasesLabel?: string }) => (
  <View style={profileStyles.profileStatsCard}><View style={profileStyles.profileStat}><Text style={profileStyles.profileStatLabel}>{ratingLabel}</Text><Text style={profileStyles.profileStatValue}>{rating} ★</Text></View><View style={profileStyles.profileStatDivider} /><View style={profileStyles.profileStat}><Text style={profileStyles.profileStatLabel}>{completedCasesLabel}</Text><Text style={profileStyles.profileCasesValue}>{completedCases}</Text></View></View>
);

export const AboutMe = ({ about, sectionTitle = 'About Me' }: Pick<ProfileData, 'about'> & { sectionTitle?: string }) => (
  <View style={profileStyles.profileSection}><Text style={profileStyles.profileSectionTitle}>{sectionTitle}</Text><View style={profileStyles.profileSectionRule} /><Text style={profileStyles.profileBody}>{about}</Text></View>
);

export const WorkExperience = ({ experiences, sectionTitle = 'Experience' }: Pick<ProfileData, 'experiences'> & { sectionTitle?: string }) => (
  <View style={profileStyles.profileSection}><Text style={profileStyles.profileSectionTitle}>{sectionTitle}</Text><View style={profileStyles.profileSectionRule} />{experiences.map((experience) => <View key={experience.title} style={profileStyles.profileExperience}><Svg width="20" height="19" viewBox="0 0 20 19" fill="none" style={profileStyles.profileExperienceIcon}>
  <Path d="M2 19C1.45 19 0.979167 18.8042 0.5875 18.4125C0.195833 18.0208 0 17.55 0 17V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H6V2C6 1.45 6.19583 0.979167 6.5875 0.5875C6.97917 0.195833 7.45 0 8 0H12C12.55 0 13.0208 0.195833 13.4125 0.5875C13.8042 0.97917 14 1.45 14 2V4H18C18.55 4 19.0208 4.19583 19.4125 4.5875C19.8042 4.97917 20 5.45 20 6V17C20 17.55 19.8042 18.0208 19.4125 18.4125C19.0208 18.8042 18.55 19 18 19H2ZM2 17H18V6H2V17ZM8 4H12V2H8V4Z" fill="#004D25" />
</Svg><View style={profileStyles.profileExperienceContent}><Text style={profileStyles.profileExperienceTitle}>{experience.title}</Text><Text style={profileStyles.profileExperienceMeta}>{experience.meta}</Text><Text style={profileStyles.profileExperienceDescription}>{experience.description}</Text></View></View>)}</View>
);

export const MyWork = ({ project, projectImage, sectionTitle = 'My Work' }: Pick<ProfileData, 'project'> & { projectImage?: ImageSourcePropType; sectionTitle?: string }) => (
  <View style={profileStyles.profileSection}><Text style={profileStyles.profileSectionTitle}>{sectionTitle}</Text><View style={profileStyles.profileSectionRule} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={profileStyles.profileProjects}><View style={profileStyles.profileProject}>{projectImage ? <Image source={projectImage} style={profileStyles.profileProjectImage} /> : <View style={profileStyles.profileProjectPlaceholder} />}<Text style={profileStyles.profileProjectTitle}>{project.title}</Text><Text style={profileStyles.profileProjectDescription}>{project.description}</Text></View></ScrollView></View>
);

export const Achievements = ({ achievements, sectionTitle = 'My Achievement' }: Pick<ProfileData, 'achievements'> & { sectionTitle?: string }) => (
  <View style={profileStyles.profileSection}><Text style={profileStyles.profileSectionTitle}>{sectionTitle}</Text><View style={profileStyles.profileSectionRule} />{achievements.map((achievement) => <View key={achievement.title} style={profileStyles.profileAchievement}><View style={profileStyles.profileAchievementIcon}><Svg width="16" height="21" viewBox="0 0 16 21" fill="none">
  <Path d="M5.675 11.7L6.55 8.85L4.25 7H7.1L8 4.2L8.9 7H11.75L9.425 8.85L10.3 11.7L8 9.925L5.675 11.7ZM2 21V13.275C1.36667 12.575 0.875 11.775 0.525 10.875C0.175 9.975 0 9.01667 0 8C0 5.76667 0.775 3.875 2.325 2.325C3.875 0.775 5.76667 0 8 0C10.2333 0 12.125 0.775 13.675 2.325C15.225 3.875 16 5.76667 16 8C16 9.01667 15.825 9.975 15.475 10.875C15.125 11.775 14.6333 12.575 14 13.275V21L8 19L2 21ZM8 14C9.66667 14 11.0833 13.4167 12.25 12.25C13.4167 11.0833 14 9.66667 14 8C14 6.33333 13.4167 4.91667 12.25 3.75C11.0833 2.58333 9.66667 2 8 2C6.33333 2 4.91667 2.58333 3.75 3.75C2.58333 4.91667 2 6.33333 2 8C2 9.66667 2.58333 11.0833 3.75 12.25C4.91667 13.4167 6.33333 14 8 14ZM4 18.025L8 17L12 18.025V14.925C11.4167 15.2583 10.7875 15.5208 10.1125 15.7125C9.4375 15.9042 8.73333 16 8 16C7.26667 16 6.5625 15.9042 5.8875 15.7125C5.2125 15.5208 4.58333 15.2583 4 14.925V18.025Z" fill="#2E7238" />
</Svg></View><View><Text style={profileStyles.profileAchievementTitle}>{achievement.title}</Text><Text style={profileStyles.profileAchievementMeta}>{achievement.meta}</Text></View></View>)}</View>
);

const RatingStars = ({ score }: Pick<ProfileData['review'], 'score'>) => {
  const fillPercentage = Math.min(100, Math.max(0, (Number(score) / 5) * 100));

  return (
    <View style={profileStyles.profileReviewStars}>
      <Text style={profileStyles.profileReviewStarsBackground}>★★★★★</Text>
      <View style={[profileStyles.profileReviewStarsFill, { width: `${fillPercentage}%` }]}>
        <Text style={profileStyles.profileReviewStarsFillText}>★★★★★</Text>
      </View>
    </View>
  );
};

export const ProfileReviews = ({ review, sectionTitle = 'Review', reviewCountText }: Pick<ProfileData, 'review'> & { sectionTitle?: string; reviewCountText?: string }) => {
  const reviewTotal = Object.values(review.ratingDistribution).reduce((total, count) => total + count, 0);
  const ratingPercentage = (score: 3 | 4 | 5): `${number}%` => reviewTotal === 0 ? '0%' : `${(review.ratingDistribution[score] / reviewTotal) * 100}%`;

  return (
    <View style={profileStyles.profileSection}>
      <Text style={profileStyles.profileSectionTitle}>{sectionTitle}</Text>
      <View style={profileStyles.profileSectionRule} />
      <View style={profileStyles.profileReviewSummary}>
        <View>
          <Text style={profileStyles.profileReviewScore}>{review.score}</Text>
          <RatingStars score={review.score} />
          <Text style={profileStyles.profileReviewCount}>{reviewCountText ?? `From the last\n${review.count} reviews`}</Text>
        </View>
        <View style={profileStyles.profileRatingBars}>
          {[5, 4, 3].map((score) => <View key={score} style={profileStyles.profileRatingRow}><Text style={profileStyles.profileRatingLabel}>{score}</Text><View style={profileStyles.profileRatingBarTrack}><View style={[profileStyles.profileRatingBar, { width: ratingPercentage(score as 3 | 4 | 5) }]} /></View></View>)}
        </View>
      </View>
      <View style={profileStyles.profileReviewCard}>
        <View style={profileStyles.profileReviewHeader}><Text style={profileStyles.profileReviewName}>{review.name}</Text><Text style={profileStyles.profileReviewDate}>{review.date}</Text></View>
        <RatingStars score={review.score} />
        <Text style={profileStyles.profileReviewText}>{review.comment}</Text>
      </View>
    </View>
  );
};
const profileStyles = StyleSheet.create({
  profilePage: {
    flex: 1,
    backgroundColor: '#FCF9F8'
  },
  profilePageContent: {
    padding: 16,
    gap: 32,
    paddingBottom: 120
  },
  profileHeroCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFF'
  },
  profilePhotoFrame: {
    width: 128,
    height: 128,
    borderRadius: 64,
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#E5E2E1',
    backgroundColor: '#DDE9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhoto: {
    width: '100%',
    height: '100%'
  },
  profilePhotoInitials: {
    color: '#004D25',
    fontSize: 36,
    fontFamily: 'BeVietnamPro_700Bold'
  },
  profilePageName: {
    marginTop: 12,
    color: '#1B1B1B',
    fontSize: 28,
    fontFamily: 'BeVietnamPro_700Bold'
  },
  profileFaculty: {
    marginTop: 4,
    color: '#404941',
    fontSize: 16,
    fontFamily: 'BeVietnamPro_400Regular'
  },
  profileUniversityStatus: {
    color: '#758076',
    fontSize: 14,
    fontFamily: 'BeVietnamPro_400Regular'
  },
  profileSkills: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  profileSkill: {
    backgroundColor: '#E8EEE7',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  profileSkillText: {
    color: '#003417',
    fontSize: 12,
    fontFamily: 'BeVietnamPro_500Medium'
  },
  profileEditAction: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#005A2A'
  },
  profileEditActionText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'NotoSansThai_600SemiBold'
  },
  profileStatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 24,
    backgroundColor: '#FFF'
  },
  profileStat: {
    flex: 1,
    alignItems: 'center'
  },
  profileStatLabel: {
    color: '#404941',
    fontSize: 12,
    fontFamily: 'NotoSansThai_500Medium',
    textAlign: 'center'
  },
  profileStatValue: {
    color: '#005A2A',
    fontSize: 24,
    fontFamily: 'NotoSansThai_600SemiBold',
    marginTop: 4
  },
  profileCasesValue: {
    color: '#1B1B1B',
    fontSize: 24,
    fontFamily: 'NotoSansThai_600SemiBold',
    marginTop: 4
  },
  profileStatDivider: {
    width: 1,
    height: 72,
    backgroundColor: '#E5E2E1'
  },
  profileSection: { 
    borderRadius: 16, 
    padding: 24, 
    backgroundColor: '#FFF' 
  }, 
  profileSectionTitle: { 
    color: '#1B1B1B', 
    fontSize: 24, 
    fontFamily: 'NotoSansThai_600SemiBold' 
  }, 
  profileSectionRule: { 
    height: 1, 
    backgroundColor: '#E5E2E1', 
    marginTop: 12, 
    marginBottom: 20 
  }, 
  profileBody: { 
    color: '#404941', 
    fontSize: 16, 
    lineHeight: 28, 
    fontFamily: 'NotoSansThai_400Regular' 
  },
  profileExperience: { 
    flexDirection: 'row',
    borderLeftWidth: 2, 
    borderLeftColor: '#E5E2E1', 
    paddingLeft: 20, 
    paddingBottom: 28, 
    gap: 16 
  }, 
  profileExperienceIcon: {
    marginTop: 4
  }, 
  profileExperienceContent: { 
    flex: 1 
  }, 
  profileExperienceTitle: { 
    color: '#1B1B1B', 
    fontSize: 14, 
    fontFamily: 'NotoSansThai_700Bold' 
  }, 
  profileExperienceMeta: {
    color: '#404941',
    fontSize: 14,
    lineHeight: 24,
    fontFamily: 'NotoSansThai_400Regular'
  },
  profileExperienceDescription: {
    color: '#758076',
    fontSize: 14,
    lineHeight: 24,
    marginTop: 8,
    fontFamily: 'NotoSansThai_400Regular'
  },
  profileProjects: {
    gap: 20
  },
  profileProject: {
    width: 280
  },
  profileProjectImage: {
    width: 280,
    height: 170,
    borderRadius: 12
  },
  profileProjectPlaceholder: {
    width: 280,
    height: 170,
    borderRadius: 12,
    backgroundColor: '#DDE9D9'
  },
  profileProjectTitle: {
    color: '#1B1B1B',
    fontSize: 18,
    marginTop: 16,
    fontFamily: 'NotoSansThai_700Bold'
  },
  profileProjectDescription: {
    color: '#758076',
    fontSize: 14,
    lineHeight: 24,
    marginTop: 8,
    fontFamily: 'NotoSansThai_400Regular'
  },
  profileAchievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  profileAchievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 32,
    backgroundColor: '#A8F3AA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileAchievementTitle: {
    color: '#1B1B1B',
    fontSize: 14,
    fontFamily: 'NotoSansThai_600SemiBold'
  },
  profileAchievementMeta: {
    color: '#758076',
    fontSize: 14,
    fontFamily: 'NotoSansThai_400Regular'
  },
  profileReviewSummary: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center'
  },
  profileReviewScore: {
    color: '#005A2A',
    fontSize: 40,
    fontFamily: 'BeVietnamPro_700Bold'
  },
  profileReviewStars: {
    width: 90,
    height: 22,
    position: 'relative',
    overflow: 'hidden'
  },
  profileReviewStarsBackground: {
    color: '#E5E2E1',
    fontSize: 18
  },
  profileReviewStarsFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden'
  },
  profileReviewStarsFillText: {
    color: '#005A2A',
    fontSize: 18
  },
  profileReviewCount: {
    color: '#758076',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'NotoSansThai_500Medium'
  },
  profileRatingBars: {
    flex: 1,
    gap: 12
  },
  profileRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  profileRatingLabel: {
    width: 12,
    color: '#758076',
    fontSize: 12,
    fontFamily: 'BeVietnamPro_500Medium'
  },
  profileRatingBarTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#E5E2E1',
    overflow: 'hidden'
  },
  profileRatingBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#005A2A'
  },
  profileReviewCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F6F3F2'
  },
  profileReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  profileReviewName: {
    color: '#1B1B1B',
    fontSize: 14,
    fontFamily: 'NotoSansThai_600SemiBold'
  },
  profileReviewDate: {
    color: '#758076',
    fontSize: 14,
    fontFamily: 'NotoSansThai_400Regular'
  },
  profileReviewText: {
    color: '#404941',
    fontSize: 14,
    lineHeight: 24,
    marginTop: 8,
    fontFamily: 'NotoSansThai_400Regular'
  },
});
