import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
  TextInputProps,
  TouchableOpacityProps,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface StepProgressProps {
  step: number;
  totalSteps?: number;
  lang?: 'en' | 'th';
}

interface FormInputProps extends TextInputProps {
  label: string;
  placeholder: string;
}

interface FormSelectProps {
  label: string;
  placeholder: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

interface TermsBoxProps {
  label: string;
  title?: string;
  content: string;
}

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

interface CheckboxProps {
  label: string;
  isChecked: boolean;
  onToggle: () => void;
}

interface StepActionButtonsProps {
  onBack: () => void;
  onNext: () => void;
  lang?: 'en' | 'th';
}

interface TopBarProps {
  onMenuPress?: () => void;
}

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




export const Header = ({ title }: { title: string }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerLogo}>KUQUEST</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

export const FormInput = ({ label, placeholder, ...rest }: FormInputProps) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        {...rest}
      />
    </View>
  );
};

export const Button = ({ variant = 'primary', children, style, ...props }: ButtonProps) => {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.buttonText, isPrimary ? styles.textWhite : styles.textPrimary]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

export const StepActionButtons = ({
  onBack,
  onNext,
  lang = 'en',
}: StepActionButtonsProps) => {
  const backText = lang === 'th' ? 'ย้อนกลับ' : 'Back';
  const nextText = lang === 'th' ? 'ถัดไป' : 'Continue';
  return (
    <View style={styles.actionButtonGroup}>
      <Button 
        variant="secondary" 
        onPress={onBack} 
        style={styles.backButton}
      >
        {backText}
      </Button>
      
      <Button 
        variant="primary" 
        onPress={onNext} 
        style={styles.nextButton}
      >
        {nextText}
      </Button>
    </View>
  );
};

export const RegistrationHeader = ({ title }: { title: string }) => (
  <View style={styles.RegistrationHeaderContainer}>
    <Text style={styles.RegistrationHeaderLogo}>KUQUEST</Text>
    <Text style={styles.RegistrationHeaderText}>{title}</Text>
  </View>
);

export const TopBar = ({ onMenuPress }: TopBarProps) => (
  <View style={styles.TopBar}>
    <TouchableOpacity
      accessibilityLabel="Open navigation menu"
      accessibilityRole="button"
      activeOpacity={0.7}
      hitSlop={12}
      onPress={onMenuPress}
      style={styles.TopBarMenuButton}
    >
      <Svg width="28" height="28" viewBox="0 0 25 25" fill="none">
        <Path d="M11.2497 12.5L16.0413 17.2917L14.583 18.75L8.33301 12.5L14.583 6.25L16.0413 7.70833L11.2497 12.5Z" fill="#003417" />
      </Svg>
    </TouchableOpacity>
    <Svg width="101" height="51" viewBox="0 0 101 51" fill="none">
      <Path d="M28.4344 0.976154C29.1252 0.585543 29.7155 0.566932 30.1233 0.797501C30.5309 1.02809 30.8099 1.538 30.8099 2.31921V31.0548C30.8099 31.8351 30.5294 32.7101 30.0684 33.4919C29.6075 34.2739 28.9742 34.9492 28.2842 35.3395L2.87542 49.7069C2.18462 50.0977 1.59432 50.116 1.18653 49.8854C0.778808 49.6545 0.5 49.1448 0.5 48.3636V19.6282C0.500009 18.8479 0.780736 17.9733 1.24166 17.1914C1.70259 16.4095 2.33565 15.7341 3.02557 15.344L28.4344 0.976154Z" fill="#F7FBF0" stroke="black" />
      <Path d="M21.5718 34.5448L16.9068 28.0375L14.2086 33.2122V38.7083L11.5186 40.2295V21.2957L14.2086 19.7746V28.9934L20.9379 15.9694L24.2619 14.0898L18.7761 24.6459L24.8307 32.7019L21.5718 34.5448Z" fill="#003200" fillOpacity="0.9" />
      <Path d="M62.9687 0.976134C63.6597 0.585551 64.2498 0.566939 64.6576 0.797481C65.0651 1.02807 65.3441 1.53797 65.3441 2.31919V31.0548C65.3441 31.8351 65.0636 32.7101 64.6026 33.4918C64.1705 34.2251 63.587 34.8642 62.9471 35.2627L62.8186 35.3395L37.4096 49.7069C36.7189 50.0977 36.1285 50.116 35.7207 49.8854C35.3129 49.6545 35.0342 49.1448 35.0342 48.3636V19.6282C35.0342 18.8479 35.315 17.9733 35.7759 17.1914C36.2369 16.4095 36.8699 15.7341 37.5597 15.344L62.9687 0.976134Z" fill="#F7FBF0" stroke="black" />
      <Path d="M57.872 26.9077C57.872 27.8883 57.7177 28.8701 57.409 29.8536C57.1 30.8309 56.672 31.7653 56.1249 32.6568C55.5774 33.5424 54.93 34.3556 54.1822 35.0971C53.4348 35.8386 52.6246 36.4559 51.7525 36.9492C50.8856 37.4394 50.081 37.735 49.3387 37.8362C48.6018 37.9342 47.9624 37.8483 47.4207 37.5789C46.8789 37.303 46.4534 36.8512 46.1447 36.223C45.8414 35.5859 45.6895 34.7771 45.6895 33.7965V21.2598L48.4204 19.7157V32.0962C48.4204 32.6968 48.4988 33.1977 48.6558 33.5989C48.8132 33.9942 49.0351 34.2821 49.3225 34.463C49.615 34.6406 49.9645 34.7094 50.3708 34.6697C50.7825 34.6206 51.2432 34.4521 51.7525 34.1642C52.2561 33.8794 52.7168 33.5271 53.1339 33.1074C53.5513 32.6815 53.9087 32.2127 54.2069 31.7009C54.5048 31.1894 54.7351 30.6456 54.8976 30.0694C55.06 29.4874 55.1414 28.8963 55.1414 28.2957V15.9152L57.872 14.3711V26.9077Z" fill="#006600" fillOpacity="0.9" />
      <Path d="M97.4286 0.84838L72.0195 15.2162C70.5832 16.0282 69.4189 18.0035 69.4189 19.6279V48.3636C69.4189 49.988 70.5832 50.6463 72.0195 49.8342L97.4286 35.4663C98.8649 34.6542 100.029 32.6789 100.029 31.0545V2.31897C100.029 0.694586 98.8649 0.0361741 97.4286 0.84838Z" fill="#F7FBF0" stroke="black" />
      <Path d="M87.2617 13.6293C87.2617 14.279 86.7959 15.069 86.2215 15.394L77.7593 20.179C76.8974 20.6663 76.1989 21.8516 76.1986 22.8261V37.625C76.1989 38.5994 76.8974 38.9944 77.7593 38.5073L90.8446 31.1079C91.7061 30.6206 92.405 29.4352 92.405 28.4608V18.8902C92.405 18.2405 92.8707 17.4502 93.4452 17.1255C94.0197 16.8005 94.4854 17.064 94.4854 17.7137V27.2843C94.4854 29.5584 92.8554 32.3238 90.8446 33.4609L77.7593 40.8603C75.7485 41.9971 74.1182 41.0753 74.1182 38.8015V24.0025C74.1182 21.7284 75.7485 18.9631 77.7593 17.8261L86.2215 13.0411C86.7959 12.7161 87.2617 12.9796 87.2617 13.6293Z" fill="#90D87E" />
      <Path d="M78.0279 27.155L77.7051 28.4559C78.3925 28.3209 79.3216 28.5744 80.3636 29.0691C81.3832 29.5529 82.3366 30.1736 83.1513 30.6342L83.8868 29.3862L84.6225 28.1385C83.8829 27.7203 82.8312 27.0435 81.772 26.5406C80.7354 26.0488 79.5126 25.6259 78.3507 25.8541L78.0279 27.155Z" fill="#90D87E" />
      <Path d="M82.8522 30.3178L83.4721 30.721C83.8171 30.1631 84.4336 28.9636 85.1748 27.5327C85.9456 26.0441 86.9189 24.1706 88.0375 22.1209C90.285 18.0024 93.0736 13.2592 95.9177 9.5765L95.4243 8.99041L94.9309 8.4043C91.8748 12.3618 88.9543 17.3492 86.6793 21.5177C85.5366 23.6115 84.5453 25.5206 83.7727 27.0121C82.9703 28.5612 82.4643 29.5392 82.2324 29.9142L82.8522 30.3178Z" fill="#90D87E" />
    </Svg>
  </View>
);

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
export const Step = ({ step, totalSteps = 3, lang = 'en' }: StepProgressProps) => {
  const stepText = lang === 'th'
    ? `ขั้นตอนที่ ${step} จาก ${totalSteps}`
    : `Step ${step} of ${totalSteps}`;
  return (  
    <Text style={styles.Step}>{stepText}</Text>
  );
};

export const StepProgress = ({ step, totalSteps = 3 }: StepProgressProps) => {
  const stepsArray = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <View style={styles.progressContainer}>
      {stepsArray.map((currentLineIndex) => (
        <View
          key={currentLineIndex}
          style={[
            styles.lineSegment,
            currentLineIndex <= step ? styles.lineActive : styles.lineInactive,
          ]}
        />
      ))}
    </View>
  );
};

export const ProfileUpload = () => {
  return (
    <View style={styles.container}>
      <View style={styles.profileWrapper}>
        <View style={styles.mainCircle}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path 
              d="M12 12C10.35 12 8.9375 11.4125 7.7625 10.2375C6.5875 9.0625 6 7.65 6 6C6 4.35 6.5875 2.9375 7.7625 1.7625C8.9375 0.5875 10.35 0 12 0C13.65 0 15.0625 0.5875 16.2375 1.7625C17.4125 2.9375 18 4.35 18 6C18 7.65 17.4125 9.0625 16.2375 10.2375C15.0625 11.4125 13.65 12 12 12ZM0 24V19.8C0 18.95 0.21875 18.1687 0.65625 17.4562C1.09375 16.7437 1.675 16.2 2.4 15.825C3.95 15.05 5.525 14.4688 7.125 14.0813C8.725 13.6938 10.35 13.5 12 13.5C13.65 13.5 15.275 13.6938 16.875 14.0813C18.475 14.4688 20.05 15.05 21.6 15.825C22.325 16.2 22.9062 16.7437 23.3438 17.4562C23.7812 18.1687 24 18.95 24 19.8V24H0ZM3 21H21V19.8C21 19.525 20.9313 19.275 20.7938 19.05C20.6562 18.825 20.475 18.65 20.25 18.525C18.9 17.85 17.5375 17.3438 16.1625 17.0063C14.7875 16.6688 13.4 16.5 12 16.5C10.6 16.5 9.2125 16.6688 7.8375 17.0063C6.4625 17.3438 5.1 17.85 3.75 18.525C3.525 18.65 3.34375 18.825 3.20625 19.05C3.06875 19.275 3 19.525 3 19.8V21ZM12 9C12.825 9 13.5312 8.70625 14.1187 8.11875C14.7062 7.53125 15 6.825 15 6C15 5.175 14.7062 4.46875 14.1187 3.88125C13.5312 3.29375 12.825 3 12 3C11.175 3 10.4688 3.29375 9.88125 3.88125C9.29375 4.46875 9 5.175 9 6C9 6.825 9.29375 7.53125 9.88125 8.11875C10.4688 8.70625 11.175 9 12 9Z" 
              fill="#404941" 
            />
          </Svg>
        </View>
        <TouchableOpacity style={styles.editBadge} activeOpacity={0.8}>
           <Svg width="12" height="12" viewBox="0 0 11 11" fill="none">
            <Path 
              d="M1.16667 9.33333H1.99792L7.7 3.63125L6.86875 2.8L1.16667 8.50208V9.33333ZM0 10.5V8.02083L7.7 0.335417C7.81667 0.228472 7.94549 0.145833 8.08646 0.0875C8.22743 0.0291667 8.37569 0 8.53125 0C8.68681 0 8.8375 0.0291667 8.98333 0.0875C9.12917 0.145833 9.25556 0.233333 9.3625 0.35L10.1646 1.16667C10.2812 1.27361 10.3663 1.4 10.4198 1.54583C10.4733 1.69167 10.5 1.8375 10.5 1.98333C10.5 2.13889 10.4733 2.28715 10.4198 2.42812C10.3663 2.5691 10.2812 2.69792 10.1646 2.81458L2.47917 10.5H0ZM9.33333 1.98333L8.51667 1.16667L9.33333 1.98333ZM7.27708 3.22292L6.86875 2.8L7.7 3.63125L7.27708 3.22292Z" 
              fill="white" 
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const FormSelect = ({
  label,
  placeholder,
  options,
  selectedValue,
  onSelect,
}: FormSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={[styles.inputContainer, { zIndex: isOpen ? 1000 : 1 }]}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.selectBox}
        activeOpacity={0.7}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.selectText, !selectedValue && { color: '#9CA3AF' }]}>
          {selectedValue || placeholder}
        </Text>
        
        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <Path d="M7 10L12 15L17 10H7Z" fill="#374151" />
        </Svg>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownMenu}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
            {options.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionItem}
                onPress={() => {
                  onSelect(item);
                  setIsOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    item === selectedValue && styles.selectedOptionText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export const TermsBox = ({ label, title, content }: TermsBoxProps) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.termsBox}>
        <View>
          {title && <Text style={styles.termsTitle}>{title}</Text>}
          <Text style={styles.termsText}>{content}</Text>
        </View>
      </View>
    </View>
  );
};

export const Checkbox = ({ label, isChecked, onToggle }: CheckboxProps) => {
  return (
    <TouchableOpacity 
      style={styles.checkboxContainer} 
      onPress={onToggle} 
      activeOpacity={0.8}
    >
      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
        {isChecked && (
          <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <Path 
              d="M20 6L9 17L4 12" 
              stroke="#FFFFFF" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </Svg>
        )}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerLogo: {
    color: '#014925',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    textTransform: 'uppercase',
    maxWidth: 200,
    lineHeight: 30,
  },

  // ProgressBar
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 12,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 8,
  },
  progressBarSegment: {
    height: 3,
    flex: 1,
    borderRadius: 999,
  },

  // Inputs
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontFamily: 'NotoSansThai_500Medium',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#404941',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FCF9F8',
    color: '#404941',
  },

  // FormSelect Elements
  optionText: {
    fontSize: 14,
    color: '#1F2937',
  },
  selectText: {
    fontSize: 16,
    color: '#1B1B1B',
    fontFamily: 'NotoSansThai_400Regular',
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#C0C9BE',
  },
  selectBox: {
    height: 50,
    borderWidth: 1,
    borderColor: '#404941',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FCF9F8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: '#FCF9F8',
    borderWidth: 1,
    borderColor: '#404941',
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: '#004D25',
  },

  // Buttons
  button: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: '#014925',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#014925',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textPrimary: {
    color: '#014925',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 16,
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderRadius: 12,
    padding: 12,
  },
  backButton: {
    flex: 1,
    width: '30%', 
  },
  nextButton: {
    flex: 2,
    width: '30%',
  },

  // Registration Specific
  RegistrationHeaderContainer: {
    paddingHorizontal: 8,
    paddingTop: 16,
    alignItems: 'center',
  },
  RegistrationHeaderLogo: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    fontSize: 40,
    color: '#004D25',
    alignSelf: 'flex-start',
    fontFamily: 'BeVietnamPro_700Bold',
  },
  RegistrationHeaderText: {
    fontSize: 24,
    textAlign: 'center',
    color: '#1B1B1B',
    textTransform: 'uppercase',
    maxWidth: "100%",
    lineHeight: 30,
    fontFamily: 'NotoSansThai_600SemiBold',
    paddingTop: 16,
  },
  Step: {
    fontSize: 16,
    fontFamily: 'NotoSansThai_400Regular',
    textAlign: 'center',
    color: '#404941',
    paddingTop: 12,
  },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginVertical: 41,
  },
  lineSegment: {
    flex: 1, 
    height: 4,
    borderRadius: 2,
  },
  lineActive: {
    backgroundColor: '#004D25',
  },
  lineInactive: {
    backgroundColor: '#E5E7EB',
  },

  // Profile Upload
  container: {
    alignItems: 'center',
    marginVertical: 24,
  },
  profileWrapper: {
    width: 96, 
    height: 96,
    position: 'relative', 
  },
  mainCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EAE7E7',
    borderWidth: 2,
    borderColor: '#C0C9BE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#004D25',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  // Terms and Conditions
  termsBox: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#C0C9BE',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F6F3F2',
  },
  termsTitle: {
    fontSize: 14,
    fontFamily: 'NotoSansThai_700Bold',
    color: '#404941',
    marginBottom: 6,
  },
  termsText: {
    fontSize: 14,
    fontFamily: 'NotoSansThai_400Regular', 
    color: '#404941',
    lineHeight: 20,
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 44,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C0C9BE',
    backgroundColor: '#FCF9F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#014925',
    borderColor: '#014925',
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: 'NotoSansThai_400Regular', 
    color: '#1B1B1B',
    flex: 1,
  },

  TopBar: {
    height: 64,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 40,
    backgroundColor: '#FCF9F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1'
  },
  TopBarMenuButton: {
    width: 28,
    height: 24,
    justifyContent: 'center',
  },
  TopBarHeaderLogo: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    fontSize: 24,
    color: '#004D25',
    alignSelf: 'flex-start',
    fontFamily: 'BeVietnamPro_700Bold',
  },
})

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