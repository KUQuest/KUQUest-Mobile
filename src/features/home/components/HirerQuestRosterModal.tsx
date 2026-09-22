import React from "react";
import { Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, Users, X } from "lucide-react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Pressable, ScrollView, Text, TouchableOpacity, View } from "@/tw";
import { Chip } from "@/components/ui/Chip";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { useLocale } from "@/features/preferences/localeStore";
import { spacing } from "@/theme/spacing";

import type {
  CanonicalHirerQuestStatus,
  QuestMemberProfile,
} from "../hirerHomeData";
import { hirerHomeMessages } from "../hirerHomeMessages";

export interface HirerQuestRosterModalProps {
  visible: boolean;
  questTitle: string;
  questId: string;
  status: CanonicalHirerQuestStatus;
  headcount: number;
  assignedWorkers: QuestMemberProfile[];
  applicants: QuestMemberProfile[];
  onClose: () => void;
  onOpenWorkerProfile: (workerId: string) => void;
  onOpenManageQuest: (questId: string) => void;
}

export function HirerQuestRosterModal({
  visible,
  questTitle,
  questId,
  status,
  headcount,
  assignedWorkers,
  applicants,
  onClose,
  onOpenWorkerProfile,
  onOpenManageQuest,
}: HirerQuestRosterModalProps) {
  const { locale } = useLocale();
  const { colors: themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const messages = hirerHomeMessages[locale];
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end bg-ku-overlay"
        testID="hirer-roster-modal-backdrop"
      >
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={messages.close}
        />
        <View
          className="w-full rounded-t-3xl bg-ku-surface px-ku-lg pt-ku-lg"
          style={{
            maxHeight: "85%",
            paddingBottom: Math.max(insets.bottom, spacing.px20),
          }}
          accessibilityViewIsModal
        >
          <View className="mb-ku-md flex-row items-center justify-between">
            <View className="flex-1 pr-ku-lg">
              <Text
                className="font-ku-bold text-ku-subtitle text-ku-text-strong"
                numberOfLines={1}
              >
                {messages.rosterModalTitle}
              </Text>
              <Text
                className="mt-ku-xs text-ku-body-small text-ku-text-secondary"
                numberOfLines={1}
              >
                {questTitle}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full bg-ku-surface-accent p-ku-sm"
              testID="hirer-roster-close"
              accessibilityRole="button"
              accessibilityLabel={messages.close}
            >
              <X size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Counter Pills */}
          <View className="mt-ku-sm flex-row gap-ku-sm">
            <Chip
              className="rounded-full border-0 bg-ku-surface-accent px-ku-12 py-ku-xs"
              label={messages.joinedLabel(assignedWorkers.length, headcount)}
              textClassName="font-ku-medium text-ku-label text-ku-primary"
              tone="accent"
            />
            {applicants.length > 0 && (
              <Chip
                className="rounded-full border-0 bg-ku-surface-muted px-ku-12 py-ku-xs"
                label={messages.applicantsLabel(applicants.length)}
                textClassName="font-ku-medium text-ku-label text-ku-text-strong"
                tone="accent"
              />
            )}
          </View>

          {/* Member Lists */}
          <ScrollView
            className="mt-ku-md"
            contentContainerStyle={{ paddingBottom: spacing.px20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Joined Section */}
            {assignedWorkers.length > 0 && (
              <View className="mb-ku-20">
                <View className="mb-ku-10 flex-row items-center gap-ku-6">
                  <CheckCircle2 size={16} color={themeColors.primary} />
                  <Text className="font-ku-bold text-ku-body-small text-ku-text-strong">
                    {messages.joinedSectionTitle} ({assignedWorkers.length})
                  </Text>
                </View>
                {assignedWorkers.map((worker) => (
                  <View
                    key={worker.id}
                    className="mb-ku-sm flex-row items-center justify-between rounded-xl border border-ku-border bg-ku-surface-muted p-ku-12"
                    testID={`roster-worker-${worker.id}`}
                  >
                    <View className="flex-1 flex-row items-center">
                      <Avatar
                        name={worker.displayName}
                        size={40}
                        className="mr-ku-12 h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-ku-surface-accent"
                        textClassName="font-ku-bold text-sm"
                        uri={worker.avatarUri}
                      />
                      <View className="flex-1 pr-ku-sm">
                        <Text
                          className="font-ku-bold text-ku-text-strong"
                          numberOfLines={1}
                        >
                          {worker.displayName}
                        </Text>
                        <Text
                          className="text-ku-body-small text-ku-text-secondary"
                          numberOfLines={1}
                        >
                          {worker.faculty || messages.assignedWorkerRole}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        onClose();
                        onOpenWorkerProfile(worker.id);
                      }}
                      className="rounded-lg bg-ku-surface-accent px-ku-12 py-ku-6"
                      testID={`roster-worker-profile-${worker.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={messages.viewProfile}
                    >
                      <Text className="font-ku-bold text-ku-label text-ku-primary">
                        {messages.viewProfile}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Applicants Section */}
            {applicants.length > 0 && (
              <View className="mb-ku-md">
                <View className="mb-ku-10 flex-row items-center gap-ku-6">
                  <Users size={16} color={themeColors.primary} />
                  <Text className="font-ku-bold text-ku-body-small text-ku-text-strong">
                    {messages.applicantsSectionTitle} ({applicants.length})
                  </Text>
                </View>
                {applicants.map((applicant) => (
                  <View
                    key={applicant.id}
                    className="mb-ku-sm flex-row items-center justify-between rounded-xl border border-ku-border bg-ku-surface-muted p-ku-12"
                    testID={`roster-applicant-${applicant.id}`}
                  >
                    <View className="flex-1 flex-row items-center">
                      <Avatar
                        className="mr-ku-12 h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-ku-surface-accent"
                        name={applicant.displayName}
                        size={40}
                        textClassName="font-ku-bold text-sm"
                        uri={applicant.avatarUri}
                      />
                      <View className="flex-1 pr-ku-sm">
                        <Text
                          className="font-ku-bold text-ku-text-strong"
                          numberOfLines={1}
                        >
                          {applicant.displayName}
                        </Text>
                        <Text
                          className="text-ku-body-small text-ku-text-secondary"
                          numberOfLines={1}
                        >
                          {applicant.faculty || messages.applicantsSectionTitle}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        onClose();
                        onOpenWorkerProfile(applicant.id);
                      }}
                      className="rounded-lg bg-ku-surface-accent px-ku-12 py-ku-6"
                      testID={`roster-applicant-profile-${applicant.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={messages.viewProfile}
                    >
                      <Text className="font-ku-bold text-ku-label text-ku-primary">
                        {messages.viewProfile}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Empty State when no workers and no applicants */}
            {assignedWorkers.length === 0 && applicants.length === 0 && (
              <View className="items-center justify-center py-ku-xl">
                <Users size={36} color={themeColors.textSecondary} />
                <Text className="mt-ku-12 text-center text-ku-body-small text-ku-text-secondary">
                  {messages.noRosterYet}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action: Manage Quest */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              onOpenManageQuest(questId);
            }}
            className="mt-ku-sm w-full items-center rounded-2xl bg-ku-primary p-ku-md"
            testID="hirer-roster-manage-button"
            accessibilityRole="button"
            accessibilityLabel={messages.openManageQuest}
          >
            <Text className="font-ku-bold text-ku-body text-ku-on-primary">
              {messages.openManageQuest}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
