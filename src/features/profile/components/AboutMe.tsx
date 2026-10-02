import { Text } from "@/tw";
import styles from "../styles/profileComponentStyles";
import { EmptyState, Section } from "./ProfileSection";

export function AboutMe({
  about,
  sectionTitle,
  emptyText,
  emptyActionLabel,
  onEditPress,
}: {
  about: string;
  sectionTitle: string;
  emptyText: string;
  emptyActionLabel?: string;
  onEditPress?: () => void;
}) {
  return (
    <Section title={sectionTitle}>
      {(metrics) =>
        about ? (
          <Text
            className={styles.body}
            maxFontSizeMultiplier={2}
            style={{ lineHeight: metrics.bodyLineHeight }}
          >
            {about}
          </Text>
        ) : (
          <EmptyState
            message={emptyText}
            actionLabel={emptyActionLabel}
            onAction={onEditPress}
          />
        )
      }
    </Section>
  );
}
