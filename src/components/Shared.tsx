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
  review: { score: string; count: string; name: string; date: string; comment: string };
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
      <Svg width="18" height="12" viewBox="0 0 18 12" fill="none">
        <Path d="M0 12V10H18V12H0ZM0 7V5H18V7H0ZM0 2V0H18V2H0Z" fill="#003417" />
      </Svg>
    </TouchableOpacity>
    <Text style={styles.TopBarHeaderLogo}>KUQUEST</Text>
  </View>
);

export const ProfileHeader = ({ data, profileImage, onEditPress }: { data: Pick<ProfileData, 'name' | 'faculty' | 'universityStatus' | 'skills'>; profileImage?: ImageSourcePropType; onEditPress?: () => void }) => (
  <View style={profileStyles.profileHeroCard}>
    <View style={profileStyles.profilePhotoFrame}>{profileImage ? <Image source={profileImage} style={profileStyles.profilePhoto} /> : <Text style={profileStyles.profilePhotoInitials}>JD</Text>}</View>
    <Text style={profileStyles.profilePageName}>{data.name}</Text><Text style={profileStyles.profileFaculty}>{data.faculty}</Text><Text style={profileStyles.profileUniversityStatus}>{data.universityStatus}</Text>
    <View style={profileStyles.profileSkills}>{data.skills.map((skill) => <View key={skill} style={profileStyles.profileSkill}><Text style={profileStyles.profileSkillText}>{skill}</Text></View>)}</View>
    <Button onPress={onEditPress} style={profileStyles.profileEditAction}>
      <Svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <Path d="M1.16667 9.33333H1.99792L7.7 3.63125L6.86875 2.8L1.16667 8.50208V9.33333ZM0 10.5V8.02083L7.7 0.335417C7.81667 0.228472 7.94549 0.145833 8.08646 0.0875C8.22743 0.0291667 8.37569 0 8.53125 0C8.68681 0 8.8375 0.0291667 8.98333 0.0875C9.12917 0.145833 9.25556 0.233333 9.3625 0.35L10.1646 1.16667C10.2812 1.27361 10.3663 1.4 10.4198 1.54583C10.4733 1.69167 10.5 1.8375 10.5 1.98333C10.5 2.13889 10.4733 2.28715 10.4198 2.42812C10.3663 2.5691 10.2812 2.69792 10.1646 2.81458L2.47917 10.5H0ZM7.27708 3.22292L6.86875 2.8L7.7 3.63125L7.27708 3.22292Z" fill="white" />
      </Svg>
      <Text style={profileStyles.profileEditActionText}>Edit Your Profile</Text> 
    </Button>
  </View>
);

export const ProfileStats = ({ rating, completedCases }: Pick<ProfileData, 'rating' | 'completedCases'>) => (
  <View style={profileStyles.profileStatsCard}><View style={profileStyles.profileStat}><Text style={profileStyles.profileStatLabel}>คะแนนจากผู้ใช้</Text><Text style={profileStyles.profileStatValue}>{rating} ★</Text></View><View style={profileStyles.profileStatDivider} /><View style={profileStyles.profileStat}><Text style={profileStyles.profileStatLabel}>จำนวนเควสที่เคยทำ</Text><Text style={profileStyles.profileCasesValue}>{completedCases}</Text></View></View>
);

export const AboutMe = ({ about }: Pick<ProfileData, 'about'>) => (
  <View style={profileStyles.profileSection}><Text style={profileStyles.profileSectionTitle}>About Me</Text><View style={profileStyles.profileSectionRule} /><Text style={profileStyles.profileBody}>{about}</Text></View>
);

export const WorkExperience = ({ experiences }: Pick<ProfileData, 'experiences'>) => (
  <View style={profileStyles.profileSection}><Text style={profileStyles.profileSectionTitle}>ประสบการณ์</Text><View style={profileStyles.profileSectionRule} />{experiences.map((experience) => <View key={experience.title} style={profileStyles.profileExperience}><Text style={profileStyles.profileExperienceIcon}>{experience.icon}</Text><View style={profileStyles.profileExperienceContent}><Text style={profileStyles.profileExperienceTitle}>{experience.title}</Text><Text style={profileStyles.profileExperienceMeta}>{experience.meta}</Text><Text style={profileStyles.profileExperienceDescription}>{experience.description}</Text></View></View>)}</View>
);

export const MyWork = ({ project, projectImage }: Pick<ProfileData, 'project'> & { projectImage?: ImageSourcePropType }) => (
  <View style={profileStyles.profileSection}><Text style={profileStyles.profileSectionTitle}>งานของฉัน</Text><View style={profileStyles.profileSectionRule} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={profileStyles.profileProjects}><View style={profileStyles.profileProject}>{projectImage ? <Image source={projectImage} style={profileStyles.profileProjectImage} /> : <View style={profileStyles.profileProjectPlaceholder} />}<Text style={profileStyles.profileProjectTitle}>{project.title}</Text><Text style={profileStyles.profileProjectDescription}>{project.description}</Text></View></ScrollView></View>
);

export const Achievements = ({ achievements }: Pick<ProfileData, 'achievements'>) => (
  <View style={profileStyles.profileSection}><Text style={profileStyles.profileSectionTitle}>ผลงาน</Text><View style={profileStyles.profileSectionRule} />{achievements.map((achievement) => <View key={achievement.title} style={profileStyles.profileAchievement}><Text style={profileStyles.profileAchievementIcon}>{achievement.icon}</Text><View><Text style={profileStyles.profileAchievementTitle}>{achievement.title}</Text><Text style={profileStyles.profileAchievementMeta}>{achievement.meta}</Text></View></View>)}</View>
);

export const ProfileReviews = ({ review }: Pick<ProfileData, 'review'>) => (
  <View style={profileStyles.profileSection}><Text style={profileStyles.profileSectionTitle}>การรีวิว</Text><View style={profileStyles.profileSectionRule} /><View style={profileStyles.profileReviewSummary}><View><Text style={profileStyles.profileReviewScore}>{review.score}</Text><Text style={profileStyles.profileReviewStars}>★★★★★</Text><Text style={profileStyles.profileReviewCount}>จากการรีวิว{`\n`}{review.count} ครั้ง</Text></View><View style={profileStyles.profileRatingBars}><View style={[profileStyles.profileRatingBar, profileStyles.profileRatingBarFull]} /><View style={[profileStyles.profileRatingBar, profileStyles.profileRatingBarShort]} /><View style={profileStyles.profileRatingBar} /></View></View><View style={profileStyles.profileReviewCard}><View style={profileStyles.profileReviewHeader}><Text style={profileStyles.profileReviewName}>{review.name}</Text><Text style={profileStyles.profileReviewDate}>{review.date}</Text></View><Text style={profileStyles.profileReviewStars}>★★★★★</Text><Text style={profileStyles.profileReviewText}>{review.comment}</Text></View></View>
);

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
    paddingHorizontal: 40,
    backgroundColor: '#FCF9F8',
    borderColor: '#'
  },
  TopBarMenuButton: {
    width: 18,
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
    color: '#005A2A', 
    fontSize: 28, 
    fontWeight: 'bold' 
  }, 
  profileExperienceContent: { 
    flex: 1 
  }, 
  profileExperienceTitle: { 
    color: '#1B1B1B', fontSize: 20, fontFamily: 'BeVietnamPro_700Bold' 
  }, 
  profileExperienceMeta: {
    color: '#404941',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'NotoSansThai_400Regular'
  },
  profileExperienceDescription: {
    color: '#758076',
    fontSize: 16,
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
    fontSize: 24,
    marginTop: 16,
    fontFamily: 'BeVietnamPro_700Bold'
  },
  profileProjectDescription: {
    color: '#758076',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    fontFamily: 'NotoSansThai_400Regular'
  },
  profileAchievement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20
  },
  profileAchievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#26793C',
    backgroundColor: '#A8F3AA',
    fontSize: 32
  },
  profileAchievementTitle: {
    color: '#1B1B1B',
    fontSize: 20,
    fontFamily: 'BeVietnamPro_700Bold'
  },
  profileAchievementMeta: {
    color: '#758076',
    fontSize: 16,
    fontFamily: 'NotoSansThai_400Regular'
  },
  profileReviewSummary: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center'
  },
  profileReviewScore: {
    color: '#005A2A',
    fontSize: 56,
    fontFamily: 'BeVietnamPro_700Bold'
  },
  profileReviewStars: {
    color: '#005A2A',
    fontSize: 18
  },
  profileReviewCount: {
    color: '#758076',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'NotoSansThai_400Regular'
  },
  profileRatingBars: {
    flex: 1,
    gap: 12
  },
  profileRatingBar: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#E5E2E1'
  },
  profileRatingBarFull: {
    backgroundColor: '#005A2A'
  },
  profileRatingBarShort: {
    width: '18%',
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
    fontSize: 18,
    fontFamily: 'BeVietnamPro_700Bold'
  },
  profileReviewDate: {
    color: '#758076',
    fontSize: 14,
    fontFamily: 'NotoSansThai_400Regular'
  },
  profileReviewText: {
    color: '#404941',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    fontFamily: 'NotoSansThai_400Regular'
  },
});