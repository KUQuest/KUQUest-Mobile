import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import styles from '../styles/profileComponentStyles';

export interface ProfileCertificate {
  title: string;
  detail: string;
  link: string;
}

export interface ProfileWork {
  title: string;
  detail: string;
  imageUri: string;
}

export interface ProfileViewData {
  name: string;
  faculty: string;
  occupation: string;
  department: string;
  profileImage: string;
  about: string;
  certificates: ProfileCertificate[];
  works: ProfileWork[];
}

interface ProfileHeaderProps {
  data: Pick<ProfileViewData, 'name' | 'faculty' | 'occupation' | 'department' | 'profileImage'>;
  editProfileLabel: string;
  onEditPress: () => void;
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

export function ProfileHeader({
  data,
  editProfileLabel,
  onEditPress,
}: ProfileHeaderProps) {
  return (
    <View style={styles.heroCard}>
      <View style={styles.photoFrame}>
        {data.profileImage ? (
          <Image source={{ uri: data.profileImage }} style={styles.photo} />
        ) : (
          <Text style={styles.initials}>{getInitials(data.name)}</Text>
        )}
      </View>
      <Text style={styles.name}>{data.name}</Text>
      {data.faculty ? <Text style={styles.meta}>{data.faculty}</Text> : null}
      {data.occupation ? <Text style={styles.meta}>{data.occupation}</Text> : null}
      {data.department ? <Text style={styles.subtleMeta}>{data.department}</Text> : null}
      <Button onPress={onEditPress} style={styles.editButton}>
        {editProfileLabel}
      </Button>
    </View>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.rule} />
      {children}
    </View>
  );
}

export function AboutMe({ about, sectionTitle, emptyText }: { about: string; sectionTitle: string; emptyText: string }) {
  return (
    <Section title={sectionTitle}>
      <Text style={styles.body}>{about || emptyText}</Text>
    </Section>
  );
}

export function Certificates({ certificates, sectionTitle, emptyText }: { certificates: ProfileCertificate[]; sectionTitle: string; emptyText: string }) {
  return (
    <Section title={sectionTitle}>
      {certificates.length > 0 ? certificates.map((certificate) => (
        <View key={`${certificate.title}-${certificate.link}`} style={styles.listItem}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓</Text>
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>{certificate.title}</Text>
            {certificate.detail ? <Text style={styles.itemDescription}>{certificate.detail}</Text> : null}
            {certificate.link ? <Text style={styles.itemMeta}>{certificate.link}</Text> : null}
          </View>
        </View>
      )) : <Text style={styles.emptyText}>{emptyText}</Text>}
    </Section>
  );
}

export function MyWork({ works, sectionTitle, emptyText }: { works: ProfileWork[]; sectionTitle: string; emptyText: string }) {
  return (
    <Section title={sectionTitle}>
      {works.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workList}>
          {works.map((work) => (
            <View key={`${work.title}-${work.imageUri}`} style={styles.workCard}>
              {work.imageUri ? <Image source={{ uri: work.imageUri }} style={styles.workImage} /> : null}
              <Text style={styles.itemTitle}>{work.title}</Text>
              {work.detail ? <Text style={styles.itemDescription}>{work.detail}</Text> : null}
            </View>
          ))}
        </ScrollView>
      ) : <Text style={styles.emptyText}>{emptyText}</Text>}
    </Section>
  );
}
