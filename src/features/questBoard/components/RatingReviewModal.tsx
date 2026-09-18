import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCircle, Check, Star, User, X } from "lucide-react-native";

import { Image, Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { colors } from "@/theme/colors";
import { useLocale } from "@/locales/LocaleProvider";
import { questBoardMessages } from "@/locales/questBoardMessages";
import type { QuestV2Review } from "@/api/questV2Contracts";

export interface RevieweeProfile {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  role: "HIRER" | "WORKER";
}

export interface RatingReviewModalProps {
  visible: boolean;
  questId: string;
  questTitle: string;
  reviewee: RevieweeProfile;
  initialReview?: QuestV2Review | null;
  isReadOnly?: boolean;
  busy?: boolean;
  onSubmit: (payload: {
    rating: number;
    comment?: string;
    reviewId?: string;
  }) => Promise<void>;
  onClose: () => void;
}

const MAX_COMMENT_LENGTH = 500;

export function RatingReviewModal({
  visible,
  questTitle,
  reviewee,
  initialReview = null,
  isReadOnly = false,
  busy = false,
  onSubmit,
  onClose,
}: RatingReviewModalProps) {
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const messages = questBoardMessages[locale];

  const [prevReview, setPrevReview] = useState(initialReview);
  const [rating, setRating] = useState<number>(initialReview?.rating ?? 0);
  const [comment, setComment] = useState<string>(initialReview?.comment ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (initialReview !== prevReview) {
    setPrevReview(initialReview);
    setRating(initialReview?.rating ?? 0);
    setComment(initialReview?.comment ?? "");
    setErrorMessage(null);
  }

  const isEditing = Boolean(initialReview?.id);
  const characterCount = comment.trim().length;

  const handleSubmit = async () => {
    if (isReadOnly) return;
    if (rating < 1 || rating > 5) {
      setErrorMessage(messages.ratingRequired);
      return;
    }
    setErrorMessage(null);
    const trimmedComment = comment.trim();
    await onSubmit({
      rating,
      comment: trimmedComment.length > 0 ? trimmedComment : undefined,
      reviewId: initialReview?.id,
    });
  };

  const roleLabel =
    reviewee.role === "HIRER"
      ? messages.hirerRoleLabel
      : messages.workerRoleLabel;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-ku-overlay"
      >
        <Pressable
          accessibilityLabel={messages.close}
          accessibilityRole="button"
          className="flex-1"
          onPress={busy ? undefined : onClose}
        />
        <View
          className="bg-ku-card rounded-t-[24px] border-t border-ku-border-subtle max-h-[92%] overflow-hidden shadow-2xl"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          testID="rating-review-modal"
        >
          {/* Header Bar */}
          <View className="flex-row items-center justify-between border-b border-ku-border-subtle px-5 py-4">
            <View className="flex-1 pr-3">
              <Text
                accessibilityRole="header"
                className="text-ku-text font-ku-bold text-lg"
              >
                {isReadOnly
                  ? messages.reviewQuest
                  : isEditing
                    ? messages.editReview
                    : messages.rateAndReview}
              </Text>
              <Text
                className="text-ku-text-secondary font-ku-regular text-xs mt-0.5"
                numberOfLines={1}
              >
                {questTitle}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={messages.close}
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-full bg-ku-surface-subtle"
              disabled={busy}
              onPress={onClose}
              testID="rating-review-close-button"
            >
              <X color={colors.textSecondary} size={18} strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView
            bounces={false}
            contentContainerClassName="px-5 pt-5 pb-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Reviewee Identity Card */}
            <View
              accessibilityLabel={messages.reviewingUserLabel(
                reviewee.displayName,
                roleLabel
              )}
              className="flex-row items-center gap-3.5 rounded-2xl bg-ku-surface-subtle border border-ku-border-subtle p-3.5 mb-5"
            >
              {reviewee.avatarUrl ? (
                <Image
                  alt={reviewee.displayName}
                  className="h-12 w-12 rounded-full bg-ku-surface-accent"
                  source={{ uri: reviewee.avatarUrl }}
                />
              ) : (
                <View className="h-12 w-12 rounded-full bg-ku-surface-accent items-center justify-center">
                  <User color={colors.primary} size={22} strokeWidth={2.2} />
                </View>
              )}
              <View className="flex-1">
                <Text
                  className="text-ku-text font-ku-semibold text-base"
                  numberOfLines={1}
                >
                  {reviewee.displayName}
                </Text>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <View className="px-2 py-0.5 rounded-md bg-ku-surface-accent self-start">
                    <Text className="text-ku-primary-dark font-ku-medium text-[11px]">
                      {roleLabel}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Read-Only Notice if expired */}
            {isReadOnly ? (
              <View
                accessibilityRole="alert"
                className="flex-row items-start gap-2.5 rounded-xl bg-ku-surface-subtle border border-ku-border-accent p-3.5 mb-5"
              >
                <AlertCircle
                  color={colors.textSecondary}
                  size={18}
                  strokeWidth={2}
                />
                <Text className="text-ku-text-secondary font-ku-regular text-xs flex-1 leading-5">
                  {messages.reviewReadOnlyNotice}
                </Text>
              </View>
            ) : null}

            {/* Star Rating Selector */}
            <View className="items-center py-2 mb-4">
              <Text className="text-ku-text-secondary font-ku-medium text-sm mb-3.5 text-center">
                {messages.reviewRatingPrompt}
              </Text>
              <View
                accessibilityLabel={`Rating: ${rating} of 5 stars`}
                className="flex-row items-center gap-2.5"
                testID="rating-stars-container"
              >
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= rating;
                  return (
                    <Pressable
                      accessibilityLabel={`${starValue} star${starValue > 1 ? "s" : ""}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isFilled }}
                      className="p-1 rounded-lg"
                      disabled={isReadOnly || busy}
                      key={starValue}
                      onPress={() => {
                        setRating(starValue);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      testID={`rating-star-${starValue}`}
                    >
                      <Star
                        color={isFilled ? "#EAA023" : colors.border}
                        fill={isFilled ? "#EAA023" : "transparent"}
                        size={36}
                        strokeWidth={1.8}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View
                accessibilityRole="alert"
                className="flex-row items-center gap-2 rounded-xl bg-ku-surface-danger border border-ku-border-danger p-3 mb-4"
              >
                <AlertCircle
                  color={colors.danger}
                  size={16}
                  strokeWidth={2.2}
                />
                <Text className="text-ku-danger font-ku-medium text-xs flex-1">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Review Comment Text Area */}
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-ku-text font-ku-semibold text-xs tracking-wider uppercase">
                  {messages.reviewCommentLabel}
                </Text>
                <Text className="text-ku-text-muted font-ku-regular text-xs">
                  {messages.reviewCharacterCount(
                    characterCount,
                    MAX_COMMENT_LENGTH
                  )}
                </Text>
              </View>
              <TextInput
                accessibilityLabel={messages.reviewCommentLabel}
                className={cn(
                  "bg-ku-surface rounded-2xl border border-ku-border-subtle p-3.5 text-ku-text font-ku-regular text-sm min-h-[110px]",
                  isReadOnly && "opacity-75 bg-ku-surface-subtle"
                )}
                editable={!isReadOnly && !busy}
                maxLength={MAX_COMMENT_LENGTH}
                multiline
                numberOfLines={4}
                onChangeText={(val) => {
                  setComment(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={messages.reviewCommentPlaceholder}
                placeholderTextColor={colors.textMuted}
                textAlignVertical="top"
                testID="rating-comment-input"
                value={comment}
              />
            </View>

            {/* Action Buttons */}
            {!isReadOnly ? (
              <View className="pt-5">
                <Pressable
                  accessibilityLabel={
                    isEditing
                      ? messages.reviewUpdateButton
                      : messages.reviewSubmitButton
                  }
                  accessibilityRole="button"
                  className={cn(
                    "h-13 flex-row items-center justify-center rounded-ku-pill bg-ku-primary px-5 shadow-sm",
                    (busy || rating === 0) && "opacity-60 bg-ku-primary-dark"
                  )}
                  disabled={busy || rating === 0}
                  onPress={handleSubmit}
                  testID="submit-review-button"
                >
                  {busy ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <>
                      <Check color={colors.white} size={18} strokeWidth={2.4} />
                      <Text className="text-ku-white font-ku-semibold text-base ml-2">
                        {isEditing
                          ? messages.reviewUpdateButton
                          : messages.reviewSubmitButton}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

RatingReviewModal.displayName = "RatingReviewModal";
