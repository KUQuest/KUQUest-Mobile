import { useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  CheckCircle2,
  ImagePlus,
  RefreshCw,
  Trash2,
} from "lucide-react-native";

import { Image, Pressable, ScrollView, Text, TextInput, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import type { UploadAsset } from "@/api/fileUpload";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useLocale } from "@/features/preferences/localeStore";
import {
  useConfirmCompletionMutation,
  useSubmitProofMutation,
  useWorkerLiveSnapshotQuery,
} from "../api/workerHomeQueries";
import { workerHomeMessages } from "../workerHomeMessages";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";

export interface WorkerProofUploadScreenProps {
  questId?: string;
  viewerId?: string;
  onSuccess?: () => void;
}

export default function WorkerProofUploadScreen({
  questId: propQuestId,
  viewerId: propViewerId,
  onSuccess,
}: WorkerProofUploadScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useAppTheme();
  const { locale } = useLocale();
  const messages = workerHomeMessages[locale];

  const params = useLocalSearchParams<{
    id?: string | string[];
    viewerId?: string | string[];
    studentId?: string | string[];
  }>();

  const resolvedQuestId =
    propQuestId ?? (Array.isArray(params.id) ? params.id[0] : params.id);
  const explicitViewerId =
    propViewerId ??
    (Array.isArray(params.viewerId) ? params.viewerId[0] : params.viewerId) ??
    (Array.isArray(params.studentId) ? params.studentId[0] : params.studentId);

  const sessionQuery = useSessionQuery();
  const resolvedViewerId = explicitViewerId ?? sessionQuery.data?.user.id;

  const snapshotQuery = useWorkerLiveSnapshotQuery(
    resolvedQuestId ?? null,
    resolvedViewerId ?? null
  );
  const snapshot = snapshotQuery.data ?? null;
  const completionMutation = useConfirmCompletionMutation();
  const proofMutation = useSubmitProofMutation();
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [description, setDescription] = useState("");

  const isProofRequired = snapshot?.proofRequired !== false;
  const canSubmitAction = isProofRequired
    ? snapshot?.capabilities.canSubmitProof === true
    : snapshot?.capabilities.canConfirmCompletion === true;
  const submitting = completionMutation.isPending || proofMutation.isPending;
  const mutationError = completionMutation.error ?? proofMutation.error;
  const errorMessage =
    snapshotQuery.error instanceof Error
      ? snapshotQuery.error.message
      : snapshotQuery.error
        ? messages.errorTitle
        : mutationError instanceof Error
          ? mutationError.message
          : mutationError
            ? messages.errorTitle
            : undefined;

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch {
      Alert.alert(messages.errorTitle, messages.imageRequiredAlert);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleConfirmCompletionDirectly = async () => {
    if (
      !resolvedQuestId ||
      !resolvedViewerId ||
      submitting ||
      !canSubmitAction
    ) {
      return;
    }
    completionMutation.reset();
    try {
      await completionMutation.mutateAsync({
        questId: resolvedQuestId,
        viewerId: resolvedViewerId,
      });
      Alert.alert(
        messages.confirmCompleteTitle,
        messages.proofSubmittedSuccess,
        [
          {
            text: "OK",
            onPress: () => {
              if (onSuccess) {
                onSuccess();
              } else {
                router.replace("/(tabs)/my-quests");
              }
            },
          },
        ]
      );
    } catch {
      // The mutation error is rendered in the existing error banner.
    }
  };

  const handleSubmitProof = async () => {
    if (
      !resolvedQuestId ||
      !resolvedViewerId ||
      submitting ||
      !canSubmitAction
    ) {
      return;
    }
    if (!selectedImage) {
      Alert.alert(messages.errorTitle, messages.imageRequiredAlert);
      return;
    }

    proofMutation.reset();
    const uploadAsset: UploadAsset = {
      uri: selectedImage.uri,
      name: selectedImage.fileName ?? `proof-${Date.now()}.jpg`,
      type: selectedImage.mimeType ?? "image/jpeg",
    };
    try {
      await proofMutation.mutateAsync({
        questId: resolvedQuestId,
        viewerId: resolvedViewerId,
        asset: uploadAsset,
        description: description.trim() || undefined,
      });
      Alert.alert(messages.workTitle, messages.proofSubmittedSuccess, [
        {
          text: "OK",
          onPress: () => {
            if (onSuccess) {
              onSuccess();
            } else {
              router.replace("/(tabs)/my-quests");
            }
          },
        },
      ]);
    } catch {
      // The mutation error is rendered in the existing error banner.
    }
  };

  return (
    <ScreenLayout edges={["top", "left", "right"]} className="bg-ku-background">
      <TopBar onBackPress={() => router.back()} title={messages.workTitle} />

      {snapshotQuery.isPending ? (
        <View
          className="flex-1 items-center justify-center p-6"
          testID="worker-proof-loading"
        >
          <ActivityIndicator color={themeColors.primaryDeep} />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-[20px] pt-ku-md"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          testID="worker-proof-scroll"
        >
          {/* Quest Context Banner */}
          {snapshot ? (
            <View
              className="mb-ku-lg rounded-[16px] border border-ku-border-subtle bg-ku-surface p-ku-md"
              testID="worker-proof-quest-summary"
            >
              <Text className="font-ku-semibold text-ku-body text-ku-text-strong">
                {snapshot.quest.title}
              </Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View
              className="mb-ku-md rounded-[12px] border border-ku-border-subtle bg-ku-surface-muted p-ku-sm"
              testID="worker-proof-error-banner"
            >
              <Text className="text-ku-meta text-ku-text-strong">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Case A: Does not require proof */}
          {!isProofRequired ? (
            <View
              className="items-center rounded-[16px] border border-ku-border-subtle bg-ku-surface p-ku-lg"
              testID="worker-proof-not-required-section"
            >
              <CheckCircle2 size={40} color={themeColors.success} />
              <Text className="mt-ku-sm text-center font-ku-semibold text-ku-emphasis text-ku-text-strong">
                {messages.proofNotRequiredNote}
              </Text>
              <Text className="mt-[6px] text-center font-ku-regular text-ku-meta text-ku-text-secondary">
                {messages.confirmCompleteDesc}
              </Text>
              {!canSubmitAction ? (
                <Text
                  className="mt-[10px] text-center font-ku-medium text-ku-meta text-ku-text-secondary"
                  testID="worker-submit-locked-hint"
                >
                  {messages.submitLockedUntilStart}
                </Text>
              ) : null}
              <Pressable
                accessibilityLabel={messages.completeQuestDirectly}
                accessibilityRole="button"
                className="mt-ku-lg min-h-[48px] w-full items-center rounded-[12px] bg-ku-primary-dark py-[14px]"
                disabled={submitting || !canSubmitAction}
                onPress={handleConfirmCompletionDirectly}
                style={{ opacity: submitting || !canSubmitAction ? 0.6 : 1 }}
                testID="worker-direct-complete-button"
              >
                {submitting ? (
                  <ActivityIndicator color={themeColors.onPrimary} />
                ) : (
                  <Text className="font-ku-semibold text-ku-control text-ku-on-primary">
                    {messages.completeQuestDirectly}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            /* Case B: Requires proof -> "+ Image upload" & "Submit" */
            <View testID="worker-proof-required-section">
              {!canSubmitAction ? (
                <Text
                  className="mb-[14px] font-ku-medium text-ku-meta text-ku-text-secondary"
                  testID="worker-submit-locked-hint"
                >
                  {messages.submitLockedUntilStart}
                </Text>
              ) : null}
              {/* Image Upload Box as in sketch */}
              <View className="mb-ku-md">
                {!selectedImage ? (
                  <Pressable
                    accessibilityLabel={messages.uploadImagePrompt}
                    accessibilityRole="button"
                    className="h-[220px] items-center justify-center gap-[10px] rounded-[18px] border-2 border-dashed border-ku-border-subtle bg-ku-surface"
                    onPress={handlePickImage}
                    testID="worker-image-upload-box"
                  >
                    <View className="h-[54px] w-[54px] items-center justify-center rounded-[27px] bg-ku-surface-muted">
                      <ImagePlus size={26} color={themeColors.primaryDeep} />
                    </View>
                    <Text className="font-ku-semibold text-ku-body text-ku-primary-dark">
                      {messages.uploadImagePrompt}
                    </Text>
                  </Pressable>
                ) : (
                  <View
                    className="overflow-hidden rounded-[18px] border border-ku-border-subtle bg-ku-surface"
                    testID="worker-image-preview-container"
                  >
                    <Image
                      accessibilityLabel="Proof preview"
                      contentFit="cover"
                      className="h-[220px] w-full"
                      testID="worker-proof-image-preview"
                    />
                    <View className="flex-row justify-between border-t border-ku-border-subtle p-ku-sm">
                      <Pressable
                        accessibilityLabel={messages.changeImage}
                        accessibilityRole="button"
                        className="flex-row items-center gap-[6px] rounded-[8px] bg-ku-surface-muted px-ku-sm py-[6px]"
                        onPress={handlePickImage}
                        testID="worker-change-image-btn"
                      >
                        <RefreshCw size={14} color={themeColors.primaryDeep} />
                        <Text className="font-ku-medium text-ku-meta text-ku-primary-dark">
                          {messages.changeImage}
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityLabel={messages.removeImage}
                        accessibilityRole="button"
                        className="flex-row items-center gap-[6px] rounded-[8px] px-ku-sm py-[6px]"
                        onPress={handleRemoveImage}
                        testID="worker-remove-image-btn"
                      >
                        <Trash2
                          size={14}
                          color={themeColors.danger ?? "#ef4444"}
                        />
                        <Text className="font-ku-medium text-ku-meta text-ku-danger">
                          {messages.removeImage}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>

              {/* Note / Description */}
              <View className="mb-ku-lg">
                <TextInput
                  accessibilityLabel={messages.proofDescriptionPlaceholder}
                  className="min-h-[100px] rounded-[14px] border border-ku-border-subtle bg-ku-surface px-[14px] py-ku-sm text-ku-body-small text-ku-text-strong"
                  multiline
                  numberOfLines={4}
                  onChangeText={setDescription}
                  placeholder={messages.proofDescriptionPlaceholder}
                  placeholderTextColor={themeColors.textSecondary}
                  style={{ textAlignVertical: "top" }}
                  testID="worker-proof-description-input"
                  value={description}
                />
              </View>

              <Pressable
                accessibilityLabel={messages.submitWork}
                accessibilityRole="button"
                className="min-h-[50px] items-center justify-center rounded-[14px] bg-ku-primary-dark py-[14px]"
                disabled={submitting || !selectedImage || !canSubmitAction}
                onPress={handleSubmitProof}
                style={{
                  opacity:
                    submitting || !selectedImage || !canSubmitAction ? 0.5 : 1,
                }}
                testID="worker-proof-submit-button"
              >
                {submitting ? (
                  <ActivityIndicator color={themeColors.onPrimary} />
                ) : (
                  <Text className="font-ku-semibold text-ku-body text-ku-on-primary">
                    {messages.submitWork}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}
