import { useState } from 'react';
import { Modal } from 'react-native';
import { Check, Settings2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocale } from '@/locales/LocaleProvider';
import { prototypeMenuMessages } from '@/locales/prototypeMenuMessages';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { cn } from '@/tw/cn';
import { Pressable, ScrollView, Text, View } from '@/tw';
import {
  PROTOTYPE_PERSONAS,
  PROTOTYPE_SCENARIOS,
  type PrototypePersonaChangeHandler,
  type PrototypePersonaId,
  type PrototypeResetHandler,
  type PrototypeScenarioRoute,
  type PrototypeScenarioSelectHandler,
} from './prototypeMenuData';
import styles from './prototypeMenuStyles';

export interface PrototypeMenuProps {
  activePersonaId: PrototypePersonaId;
  currentScenario?: PrototypeScenarioRoute;
  onPersonaChange: PrototypePersonaChangeHandler;
  onReset: PrototypeResetHandler;
  onScenarioPress: PrototypeScenarioSelectHandler;
  onVisibleChange?: (visible: boolean) => void;
  compact?: boolean;
  testID?: string;
  visible?: boolean;
}

function labelFor(label: { en: string; th: string }, locale: 'en' | 'th'): string {
  return label[locale];
}

export function PrototypeMenu({
  activePersonaId,
  currentScenario,
  onPersonaChange,
  onReset,
  onScenarioPress,
  onVisibleChange,
  compact = false,
  testID = 'prototype-menu',
  visible,
}: PrototypeMenuProps) {
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const [uncontrolledVisible, setUncontrolledVisible] = useState(false);
  const messages = prototypeMenuMessages[locale];
  const isVisible = visible ?? uncontrolledVisible;
  const paddingBottom = Math.max(spacing.md, insets.bottom + spacing.sm);

  if (!__DEV__) return null;

  const setVisible = (nextVisible: boolean) => {
    if (visible === undefined) setUncontrolledVisible(nextVisible);
    onVisibleChange?.(nextVisible);
  };

  const handlePersonaChange = (personaId: PrototypePersonaId) => {
    onPersonaChange(personaId);
    setVisible(false);
  };

  const handleScenarioPress = (route: PrototypeScenarioRoute) => {
    onScenarioPress(route);
    setVisible(false);
  };

  const handleReset = (scope: Parameters<PrototypeResetHandler>[0]) => {
    onReset(scope);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        accessibilityLabel={messages.openMenu}
        accessibilityRole="button"
        accessibilityState={{ expanded: isVisible }}
        className={cn(styles.trigger, compact && styles.triggerCompact)}
        onPress={() => setVisible(true)}
        testID={`${testID}-trigger`}
      >
        <Settings2 color={colors.primary} size={17} strokeWidth={2.2} />
        {!compact ? <Text className={styles.triggerText}>{messages.openMenu}</Text> : null}
      </Pressable>

      <Modal animationType="slide" onRequestClose={() => setVisible(false)} transparent visible={isVisible}>
        <View className={styles.overlay}>
          <Pressable
            accessibilityLabel={messages.close}
            accessibilityRole="button"
            className={styles.backdrop}
            onPress={() => setVisible(false)}
            testID={`${testID}-backdrop`}
          />
          <View
            accessibilityViewIsModal
            className={styles.sheet}
            style={{ paddingBottom }}
            testID={`${testID}-sheet`}
          >
            <View className={styles.handle} />
            <View className={styles.header}>
              <View className={styles.heading}>
                <Text accessibilityRole="header" className={styles.title}>{messages.title}</Text>
                <Text className={styles.subtitle}>{messages.subtitle}</Text>
              </View>
              <Pressable
                accessibilityLabel={messages.close}
                accessibilityRole="button"
                className={styles.close}
                onPress={() => setVisible(false)}
                testID={`${testID}-close`}
              >
                <X accessible={false} color={colors.textStrong} size={20} strokeWidth={2.3} />
              </Pressable>
            </View>

            <ScrollView
              className={styles.scroll}
              contentContainerClassName={styles.content}
              showsVerticalScrollIndicator={false}
              testID={`${testID}-scroll`}
            >
              <View className={cn(styles.section, styles.sectionFirst)}>
                <Text className={styles.sectionTitle}>{messages.personas}</Text>
                <Text className={styles.sectionHint}>
                  {messages.activePersona}: {labelFor(PROTOTYPE_PERSONAS.find((persona) => persona.id === activePersonaId)?.label ?? PROTOTYPE_PERSONAS[0].label, locale)}
                </Text>
                <View className={styles.optionList}>
                  {PROTOTYPE_PERSONAS.map((persona) => {
                    const selected = persona.id === activePersonaId;
                    const label = labelFor(persona.label, locale);
                    return (
                      <Pressable
                        accessibilityLabel={`${label} (${persona.id})`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        className={cn(styles.personaOption, selected && styles.personaOptionSelected)}
                        key={persona.id}
                        onPress={() => handlePersonaChange(persona.id)}
                        testID={`${testID}-persona-${persona.id}`}
                      >
                        <View className={cn(styles.optionControl, selected && styles.optionControlSelected)}>
                          {selected ? <Check accessible={false} color={colors.white} size={15} strokeWidth={2.7} /> : null}
                        </View>
                        <View className={styles.optionCopy}>
                          <Text className={styles.optionLabel}>{label}</Text>
                          <Text className={styles.optionRoute}>{persona.id}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className={styles.section}>
                <Text className={styles.sectionTitle}>{messages.scenarios}</Text>
                <View className={styles.optionList}>
                  {PROTOTYPE_SCENARIOS.map((scenario) => {
                    const selected = scenario.route === currentScenario;
                    const label = labelFor(scenario.label, locale);
                    return (
                      <Pressable
                        accessibilityLabel={`${label} (${scenario.route})`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        className={cn(styles.scenarioOption, selected && styles.scenarioOptionSelected)}
                        key={scenario.id}
                        onPress={() => handleScenarioPress(scenario.route)}
                        testID={`${testID}-scenario-${scenario.id}`}
                      >
                        <View className={styles.scenarioCopy}>
                          <Text className={styles.scenarioLabel}>{label}</Text>
                          <Text className={styles.scenarioRoute}>{scenario.route}</Text>
                        </View>
                        {selected ? <Check accessible={false} color={colors.primary} size={18} strokeWidth={2.5} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className={styles.resetSection}>
                <Text className={styles.sectionTitle}>{messages.reset}</Text>
                <Text className={styles.sectionHint}>{messages.resetDescription}</Text>
                <View className={styles.resetList}>
                  <ResetButton
                    label={messages.resetCurrent}
                    onPress={() => handleReset('current')}
                    testID={`${testID}-reset-current`}
                  />
                  <ResetButton
                    all
                    label={messages.resetAll}
                    onPress={() => handleReset('all')}
                    testID={`${testID}-reset-all`}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ResetButton({ all = false, label, onPress, testID }: { all?: boolean; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className={cn(styles.resetOption, all && styles.resetOptionAll)}
      onPress={onPress}
      testID={testID}
    >
      <Text className={cn(styles.resetOptionText, all && styles.resetOptionTextAll)}>{label}</Text>
    </Pressable>
  );
}

PrototypeMenu.displayName = 'PrototypeMenu';
