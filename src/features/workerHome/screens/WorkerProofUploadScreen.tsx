import { useState } from "react";
import { ActivityIndicator, Alert, useColorScheme } from "react-native";
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
import { getThemeColors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

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
  const colorScheme = useColorScheme();
  const themeColors = getThemeColors(colorScheme);
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
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 32,
          }}
          showsVerticalScrollIndicator={false}
          testID="worker-proof-scroll"
        >
          {/* Quest Context Banner */}
          {snapshot ? (
            <View
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.borderSubtle,
                borderRadius: 16,
                borderWidth: 1,
                padding: 16,
                marginBottom: 20,
              }}
              testID="worker-proof-quest-summary"
            >
              <Text
                style={{
                  fontFamily: fontFamily.semiBold,
                  fontSize: 16,
                  color: themeColors.textStrong,
                }}
              >
                {snapshot.quest.title}
              </Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View
              style={{
                backgroundColor: themeColors.surfaceMuted,
                borderColor: themeColors.borderSubtle,
                borderRadius: 12,
                borderWidth: 1,
                padding: 12,
                marginBottom: 16,
              }}
              testID="worker-proof-error-banner"
            >
              <Text style={{ color: themeColors.textStrong, fontSize: 13 }}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Case A: Does not require proof */}
          {!isProofRequired ? (
            <View
              style={{
                backgroundColor: themeColors.surface,
                borderColor: themeColors.borderSubtle,
                borderRadius: 16,
                borderWidth: 1,
                padding: 20,
                alignItems: "center",
              }}
              testID="worker-proof-not-required-section"
            >
              <CheckCircle2 size={40} color={themeColors.success} />
              <Text
                style={{
                  fontFamily: fontFamily.semiBold,
                  fontSize: 17,
                  color: themeColors.textStrong,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                {messages.proofNotRequiredNote}
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily.regular,
                  fontSize: 13,
                  color: themeColors.textSecondary,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                {messages.confirmCompleteDesc}
              </Text>
              {!canSubmitAction ? (
                <Text
                  style={{
                    color: themeColors.textSecondary,
                    fontFamily: fontFamily.medium,
                    fontSize: 13,
                    marginTop: 10,
                    textAlign: "center",
                  }}
                  testID="worker-submit-locked-hint"
                >
                  {messages.submitLockedUntilStart}
                </Text>
              ) : null}

              <Pressable
                accessibilityLabel={messages.completeQuestDirectly}
                accessibilityRole="button"
                disabled={submitting || !canSubmitAction}
                onPress={handleConfirmCompletionDirectly}
                style={{
                  backgroundColor: themeColors.primaryDeep,
                  borderRadius: 12,
                  width: "100%",
                  paddingVertical: 14,
                  alignItems: "center",
                  marginTop: 24,
                  minHeight: 48,
                  opacity: submitting || !canSubmitAction ? 0.6 : 1,
                }}
                testID="worker-direct-complete-button"
              >
                {submitting ? (
                  <ActivityIndicator color={themeColors.white} />
                ) : (
                  <Text
                    style={{
                      fontFamily: fontFamily.semiBold,
                      fontSize: 15,
                      color: themeColors.white,
                    }}
                  >
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
                  style={{
                    color: themeColors.textSecondary,
                    fontFamily: fontFamily.medium,
                    fontSize: 13,
                    marginBottom: 14,
                  }}
                  testID="worker-submit-locked-hint"
                >
                  {messages.submitLockedUntilStart}
                </Text>
              ) : null}
              {/* Image Upload Box as in sketch */}
              <View style={{ marginBottom: 16 }}>
                {!selectedImage ? (
                  <Pressable
                    accessibilityLabel={messages.uploadImagePrompt}
                    accessibilityRole="button"
                    onPress={handlePickImage}
                    style={{
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.borderSubtle,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderRadius: 18,
                      height: 220,
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                    testID="worker-image-upload-box"
                  >
                    <View
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 27,
                        backgroundColor: themeColors.surfaceMuted,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ImagePlus size={26} color={themeColors.primaryDeep} />
                    </View>
                    <Text
                      style={{
                        fontFamily: fontFamily.semiBold,
                        fontSize: 16,
                        color: themeColors.primaryDeep,
                      }}
                    >
                      {messages.uploadImagePrompt}
                    </Text>
                  </Pressable>
                ) : (
                  <View
                    style={{
                      borderRadius: 18,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: themeColors.borderSubtle,
                      backgroundColor: themeColors.surface,
                    }}
                    testID="worker-image-preview-container"
                  >
                    <Image
                      accessibilityLabel="Proof preview"
                      contentFit="cover"
                      source={{ uri: selectedImage.uri }}
                      style={{ width: "100%", height: 220 }}
                      testID="worker-proof-image-preview"
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        padding: 12,
                        borderTopWidth: 1,
                        borderColor: themeColors.borderSubtle,
                      }}
                    >
                      <Pressable
                        accessibilityLabel={messages.changeImage}
                        accessibilityRole="button"
                        onPress={handlePickImage}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: themeColors.surfaceMuted,
                        }}
                        testID="worker-change-image-btn"
                      >
                        <RefreshCw size={14} color={themeColors.primaryDeep} />
                        <Text
                          style={{
                            fontFamily: fontFamily.medium,
                            fontSize: 13,
                            color: themeColors.primaryDeep,
                          }}
                        >
                          {messages.changeImage}
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityLabel={messages.removeImage}
                        accessibilityRole="button"
                        onPress={handleRemoveImage}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                        }}
                        testID="worker-remove-image-btn"
                      >
                        <Trash2
                          size={14}
                          color={themeColors.danger ?? "#ef4444"}
                        />
                        <Text
                          style={{
                            fontFamily: fontFamily.medium,
                            fontSize: 13,
                            color: themeColors.danger ?? "#ef4444",
                          }}
                        >
                          {messages.removeImage}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>

              {/* Note / Description */}
              <View style={{ marginBottom: 24 }}>
                <TextInput
                  accessibilityLabel={messages.proofDescriptionPlaceholder}
                  multiline
                  numberOfLines={4}
                  onChangeText={setDescription}
                  placeholder={messages.proofDescriptionPlaceholder}
                  placeholderTextColor={themeColors.textSecondary}
                  style={{
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.borderSubtle,
                    borderRadius: 14,
                    borderWidth: 1,
                    color: themeColors.textStrong,
                    fontFamily: fontFamily.regular,
                    fontSize: 14,
                    minHeight: 100,
                    paddingHorizontal: 14,
                    paddingTop: 12,
                    paddingBottom: 12,
                    textAlignVertical: "top",
                  }}
                  testID="worker-proof-description-input"
                  value={description}
                />
              </View>

              {/* Submit Button */}
              <Pressable
                accessibilityLabel={messages.submitWork}
                accessibilityRole="button"
                disabled={submitting || !selectedImage || !canSubmitAction}
                onPress={handleSubmitProof}
                style={{
                  backgroundColor: themeColors.primaryDeep,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 50,
                  opacity:
                    submitting || !selectedImage || !canSubmitAction ? 0.5 : 1,
                }}
                testID="worker-proof-submit-button"
              >
                {submitting ? (
                  <ActivityIndicator color={themeColors.white} />
                ) : (
                  <Text
                    style={{
                      fontFamily: fontFamily.semiBold,
                      fontSize: 16,
                      color: themeColors.white,
                    }}
                  >
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
