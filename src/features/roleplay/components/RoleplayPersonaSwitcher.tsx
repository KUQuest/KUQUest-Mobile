import { Check } from "lucide-react-native";

import { PROTOTYPE_PERSONAS } from "@/components/ui/prototypeMenuData";
import type { PrototypePersonaId } from "@/components/ui/prototypeMenuData";
import { colors } from "@/theme/colors";
import { cn } from "@/tw/cn";
import { Pressable, Text, View } from "@/tw";

import styles from "../roleplayStyles";

const ROLEPLAY_PERSONA_IDS: readonly PrototypePersonaId[] = [
  "demo-hirer",
  "student-demo",
  "demo-worker-2",
];

interface RoleplayPersonaSwitcherProps {
  activePersonaId: PrototypePersonaId;
  locale: "en" | "th";
  title: string;
  description: string;
  onPersonaChange: (personaId: PrototypePersonaId) => void;
}

export function RoleplayPersonaSwitcher({
  activePersonaId,
  locale,
  title,
  description,
  onPersonaChange,
}: RoleplayPersonaSwitcherProps) {
  const personas = PROTOTYPE_PERSONAS.filter(({ id }) =>
    ROLEPLAY_PERSONA_IDS.includes(id)
  );

  return (
    <View
      accessibilityLabel={title}
      accessibilityRole="radiogroup"
      className={styles.panel}
      testID="roleplay-persona-switcher"
    >
      <Text className={styles.sectionTitle}>{title}</Text>
      <Text className={styles.sectionHint}>{description}</Text>
      <View className={styles.applicationList}>
        {personas.map((persona) => {
          const selected = activePersonaId === persona.id;
          const label = persona.label[locale];

          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={cn(
                styles.personaOption,
                selected && styles.personaOptionSelected
              )}
              key={persona.id}
              onPress={() => onPersonaChange(persona.id)}
              testID={`roleplay-persona-${persona.id}`}
            >
              <View className={styles.personaOptionCopy}>
                <Text
                  className={styles.personaOptionLabel}
                  testID={`roleplay-persona-label-${persona.id}`}
                >
                  {label}
                </Text>
                <Text className={styles.personaOptionMeta}>
                  {persona.id}
                </Text>
              </View>
              <View className={styles.personaOptionIndicator}>
                {selected ? (
                  <Check
                    accessible={false}
                    color={colors.primary}
                    size={20}
                    strokeWidth={2.5}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

RoleplayPersonaSwitcher.displayName = "RoleplayPersonaSwitcher";
