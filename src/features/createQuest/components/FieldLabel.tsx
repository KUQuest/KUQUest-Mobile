import { Text } from "@/tw";
import styles from "../createQuestStyles";

export function FieldLabel({
  children,
  required = false,
  optionalLabel,
}: {
  children: string;
  required?: boolean;
  optionalLabel: string;
}) {
  return (
    <Text className={styles.fieldLabel}>
      {children}
      {required ? (
        <Text className={styles.required}> *</Text>
      ) : optionalLabel ? (
        <Text className={styles.optional}> · {optionalLabel}</Text>
      ) : null}
    </Text>
  );
}
