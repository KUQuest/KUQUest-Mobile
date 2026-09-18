import React from "react";
import { Modal, TouchableOpacity, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, CircleUserRound, Users, X } from "lucide-react-native";

import { Image, Pressable, ScrollView, Text, View } from "@/tw";
import { useLocale } from "@/locales/LocaleProvider";
import { getThemeColors } from "@/theme/colors";

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
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
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
        className="flex-1 justify-end bg-black/50"
        testID="hirer-roster-modal-backdrop"
      >
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityLabel={messages.close}
        />
        <View
          className="w-full rounded-t-3xl px-6 pt-6"
          style={{
            backgroundColor: themeColors.surface,
            maxHeight: "85%",
            paddingBottom: Math.max(insets.bottom, 20),
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 pr-4">
              <Text
                className="text-lg font-ku-bold"
                style={{ color: themeColors.textStrong }}
                numberOfLines={1}
              >
                {messages.rosterModalTitle}
              </Text>
              <Text
                className="mt-1 text-sm"
                style={{ color: themeColors.textSecondary }}
                numberOfLines={1}
              >
                {questTitle}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full p-2"
              style={{ backgroundColor: themeColors.surfaceAccent }}
              testID="hirer-roster-close"
              accessibilityLabel={messages.close}
            >
              <X size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Counter Pills */}
          <View className="mt-2 flex-row gap-2">
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: themeColors.surfaceAccent }}
            >
              <Text
                className="text-xs font-ku-medium"
                style={{ color: themeColors.primary }}
              >
                {messages.joinedLabel(assignedWorkers.length, headcount)}
              </Text>
            </View>
            {applicants.length > 0 && (
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: themeColors.surfaceMuted }}
              >
                <Text
                  className="text-xs font-ku-medium"
                  style={{ color: themeColors.textStrong }}
                >
                  {messages.applicantsLabel(applicants.length)}
                </Text>
              </View>
            )}
          </View>

          {/* Member Lists */}
          <ScrollView
            className="mt-4"
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Joined Section */}
            {assignedWorkers.length > 0 && (
              <View className="mb-5">
                <View className="mb-2.5 flex-row items-center gap-1.5">
                  <CheckCircle2 size={16} color={themeColors.primary} />
                  <Text
                    className="text-sm font-ku-bold"
                    style={{ color: themeColors.textStrong }}
                  >
                    {messages.joinedSectionTitle} ({assignedWorkers.length})
                  </Text>
                </View>
                {assignedWorkers.map((worker) => (
                  <View
                    key={worker.id}
                    className="mb-2 flex-row items-center justify-between rounded-xl border p-3"
                    style={{
                      backgroundColor: themeColors.surfaceMuted,
                      borderColor: themeColors.borderSubtle,
                    }}
                    testID={`roster-worker-${worker.id}`}
                  >
                    <View className="flex-1 flex-row items-center">
                      <View
                        className="mr-3 h-10 w-10 overflow-hidden rounded-full items-center justify-center"
                        style={{ backgroundColor: themeColors.surfaceAccent }}
                      >
                        {worker.avatarUri ? (
                          <Image
                            source={{ uri: worker.avatarUri }}
                            className="h-full w-full"
                            contentFit="cover"
                          />
                        ) : (
                          <CircleUserRound
                            size={24}
                            color={themeColors.primary}
                          />
                        )}
                      </View>
                      <View className="flex-1 pr-2">
                        <Text
                          className="font-ku-bold"
                          style={{ color: themeColors.textStrong }}
                          numberOfLines={1}
                        >
                          {worker.displayName}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: themeColors.textSecondary }}
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
                      className="rounded-lg px-3 py-1.5"
                      style={{ backgroundColor: themeColors.surfaceAccent }}
                      testID={`roster-worker-profile-${worker.id}`}
                    >
                      <Text
                        className="text-xs font-ku-bold"
                        style={{ color: themeColors.primary }}
                      >
                        {messages.viewProfile}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Applicants Section */}
            {applicants.length > 0 && (
              <View className="mb-4">
                <View className="mb-2.5 flex-row items-center gap-1.5">
                  <Users size={16} color={themeColors.primary} />
                  <Text
                    className="text-sm font-ku-bold"
                    style={{ color: themeColors.textStrong }}
                  >
                    {messages.applicantsSectionTitle} ({applicants.length})
                  </Text>
                </View>
                {applicants.map((applicant) => (
                  <View
                    key={applicant.id}
                    className="mb-2 flex-row items-center justify-between rounded-xl border p-3"
                    style={{
                      backgroundColor: themeColors.surfaceMuted,
                      borderColor: themeColors.borderSubtle,
                    }}
                    testID={`roster-applicant-${applicant.id}`}
                  >
                    <View className="flex-1 flex-row items-center">
                      <View
                        className="mr-3 h-10 w-10 overflow-hidden rounded-full items-center justify-center"
                        style={{ backgroundColor: themeColors.surfaceAccent }}
                      >
                        {applicant.avatarUri ? (
                          <Image
                            source={{ uri: applicant.avatarUri }}
                            className="h-full w-full"
                            contentFit="cover"
                          />
                        ) : (
                          <CircleUserRound
                            size={24}
                            color={themeColors.primary}
                          />
                        )}
                      </View>
                      <View className="flex-1 pr-2">
                        <Text
                          className="font-ku-bold"
                          style={{ color: themeColors.textStrong }}
                          numberOfLines={1}
                        >
                          {applicant.displayName}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: themeColors.textSecondary }}
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
                      className="rounded-lg px-3 py-1.5"
                      style={{ backgroundColor: themeColors.surfaceAccent }}
                      testID={`roster-applicant-profile-${applicant.id}`}
                    >
                      <Text
                        className="text-xs font-ku-bold"
                        style={{ color: themeColors.primary }}
                      >
                        {messages.viewProfile}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Empty State when no workers and no applicants */}
            {assignedWorkers.length === 0 && applicants.length === 0 && (
              <View className="items-center justify-center py-8">
                <Users size={36} color={themeColors.textSecondary} />
                <Text
                  className="mt-3 text-center text-sm font-ku-medium"
                  style={{ color: themeColors.textSecondary }}
                >
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
            className="mt-2 w-full rounded-2xl p-4 items-center"
            style={{ backgroundColor: themeColors.primary }}
            testID="hirer-roster-manage-button"
          >
            <Text className="text-white font-ku-bold text-base">
              {messages.openManageQuest}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
