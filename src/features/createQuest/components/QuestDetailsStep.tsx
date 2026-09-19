import type { ComponentRef, Ref } from "react";
import { Check, Tag } from "lucide-react-native";
import type { Pressable as RNPressable } from "react-native";
import type { TextInput as RNTextInput } from "react-native";

import { Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { createQuestMessages } from "@/locales/createQuestMessages";
import { colors } from "@/theme/colors";
import styles from "../createQuestStyles";
import type { QuestDraft } from "../createQuestModel";
import { SectionHeading } from "./SectionHeading";

export function QuestDetailsStep({
  messages,
  draft,
  errors,
  tagOptions,
  proofRequired,
  titleRef,
  tagRef,
  descriptionRef,
  conditionsRef,
  updateDraft,
}: {
  messages: typeof createQuestMessages.en;
  draft: QuestDraft;
  errors: Record<string, string>;
  tagOptions: { label: string; value: string }[];
  proofRequired: boolean;
  titleRef: Ref<ComponentRef<typeof RNTextInput>>;
  tagRef: Ref<ComponentRef<typeof RNPressable>>;
  descriptionRef: Ref<ComponentRef<typeof RNTextInput>>;
  conditionsRef: Ref<ComponentRef<typeof RNTextInput>>;
  updateDraft: <K extends keyof QuestDraft>(
    field: K,
    value: QuestDraft[K]
  ) => void;
}) {
  return (
    <View className={styles.sectionCard}>
      <SectionHeading
        icon={Tag}
        title={messages.questDetails}
        description={messages.questDetailsDescription}
      />
      <Input
        ref={titleRef}
        label={`${messages.titleLabel} *`}
        placeholder={messages.titlePlaceholder}
        value={draft.title}
        onChangeText={(value) => updateDraft("title", value)}
        error={errors.title}
        maxLength={100}
      />
      <Select
        ref={tagRef}
        label={`${messages.questTag} *`}
        options={tagOptions}
        value={draft.tag}
        onValueChange={(value) => updateDraft("tag", value)}
        placeholder={messages.chooseQuestTag}
        error={errors.tag}
        searchable
        searchPlaceholder={messages.searchQuestTags}
        noResultsMessage={messages.noMatchingQuestTags}
        clearSearchLabel={messages.clearSearch}
        closeLabel={messages.close}
      />
      <TextArea
        ref={descriptionRef}
        label={`${messages.description} *`}
        placeholder={messages.descriptionPlaceholder}
        value={draft.description}
        onChangeText={(value) => updateDraft("description", value)}
        error={errors.description}
        maxLength={300}
      />
      <TextArea
        ref={conditionsRef}
        label={`${messages.completionCriteria} *`}
        placeholder={messages.completionCriteriaPlaceholder}
        value={draft.conditions}
        onChangeText={(value) => updateDraft("conditions", value)}
        error={errors.conditions}
        maxLength={300}
      />
      <View className={styles.fieldGroup}>
        <Pressable
          accessibilityLabel={messages.proofRequiredToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: proofRequired }}
          className={styles.proofToggle}
          onPress={() =>
            updateDraft("proofRequired", proofRequired ? "none" : "required")
          }
          testID="create-quest-proof-toggle"
        >
          <View
            className={cn(
              styles.checkbox,
              proofRequired && styles.checkboxChecked
            )}
          >
            {proofRequired ? (
              <Check color={colors.white} size={15} strokeWidth={3} />
            ) : null}
          </View>
          <Text className={styles.proofToggleLabel}>
            {messages.proofRequiredToggle}
          </Text>
        </Pressable>
        <Text className={styles.proofDescription}>
          {proofRequired
            ? messages.proofRequiredDescription
            : messages.proofNotNeededDescription}
        </Text>
      </View>
    </View>
  );
}
