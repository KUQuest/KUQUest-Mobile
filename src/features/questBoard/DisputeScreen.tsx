import React, { useState } from "react";
import { Alert, Platform } from "react-native";
import { useRouter } from "expo-router";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { cn } from "@/tw/cn";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from "lucide-react-native";

import type { DisputeReason } from "@/api/DisputeApi";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/TopBar";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useFileDisputeMutation } from "@/features/questBoard/api/questBoardQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { questWorkMessages } from "@/locales/questWorkMessages";
import { colors } from "@/theme/colors";

interface ReasonOption {
  value: DisputeReason;
  labelEn: string;
  labelTh: string;
  descEn: string;
  descTh: string;
}

const REASON_OPTIONS: ReasonOption[] = [
  {
    value: "PROOF_REJECTED_UNFAIRLY",
    labelEn: "Proof rejected unfairly",
    labelTh: "หลักฐานถูกปฏิเสธอย่างไม่เป็นธรรม",
    descEn: "Completed work met the requirements but proof was rejected.",
    descTh: "ส่งงานถูกต้องตามเงื่อนไขครบถ้วนแต่หลักฐานถูกปฏิเสธ",
  },
  {
    value: "CONDITIONS_BREACHED",
    labelEn: "Conditions breached",
    labelTh: "มีการละเมิดเงื่อนไขข้อตกลง",
    descEn: "Agreed terms, timeline, or requirements were breached.",
    descTh: "มีการผิดเงื่อนไขข้อตกลง กรอบเวลา หรือขอบเขตงาน",
  },
  {
    value: "COMMUNICATION_BREAKDOWN",
    labelEn: "Communication breakdown",
    labelTh: "ไม่สามารถติดต่อสื่อสารได้",
    descEn: "Other party became unresponsive or refused coordination.",
    descTh: "อีกฝ่ายไม่ตอบข้อความหรือปฏิเสธที่จะประสานงาน",
  },
  {
    value: "OTHER",
    labelEn: "Other reason",
    labelTh: "เหตุผลอื่นๆ",
    descEn: "Other issue requiring administrative arbitration.",
    descTh: "ปัญหาอื่นๆ ที่ต้องการให้ผู้ดูแลระบบเข้ามาตัดสิน",
  },
];

export default function DisputeScreen({
  questId,
}: {
  questId: string | undefined;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const sessionQuery = useSessionQuery();
  const viewerId = sessionQuery.data?.user.id ?? "";
  const messages = questWorkMessages[locale];

  const [selectedReason, setSelectedReason] = useState<DisputeReason>(
    "PROOF_REJECTED_UNFAIRLY"
  );
  const [statement, setStatement] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileDisputeMutation = useFileDisputeMutation();

  const isTh = locale === "th";
  const trimmedStatement = statement.trim();
  const isStatementValid =
    trimmedStatement.length > 0 && trimmedStatement.length <= 1000;
  const statementTooLongMessage =
    statement.length > 1000
      ? isTh
        ? "คำชี้แจงมีความยาวเกิน 1,000 ตัวอักษร"
        : "Statement exceeds the 1000 character limit."
      : undefined;
  const canSubmit =
    isStatementValid &&
    !fileDisputeMutation.isPending &&
    Boolean(questId) &&
    Boolean(viewerId);

  const handleSubmit = async () => {
    if (!questId) {
      Alert.alert(
        isTh ? "ไม่พบข้อมูลเควสต์" : "Quest Missing",
        isTh
          ? "ไม่สามารถระบุรหัสเควสต์ได้"
          : "Quest ID could not be identified."
      );
      return;
    }

    if (!trimmedStatement) {
      setErrorMessage(
        isTh
          ? "กรุณาระบุรายละเอียดข้อพิพาท"
          : "Please provide a statement explaining the dispute."
      );
      return;
    }

    setErrorMessage(null);

    try {
      await fileDisputeMutation.mutateAsync({
        questId,
        viewerId,
        reason: selectedReason,
        statement: trimmedStatement,
      });

      Alert.alert(
        isTh ? "ยื่นคำร้องสำเร็จ" : "Dispute Filed",
        isTh
          ? "คำร้องข้อพิพาทของคุณถูกส่งไปยังผู้ดูแลระบบเรียบร้อยแล้ว เงินประกันจะถูกระงับไว้จนกว่าจะมีการตัดสิน"
          : "Your dispute case has been submitted for admin review. Reserved funds are held pending resolution.",
        [
          {
            text: isTh ? "ตกลง" : "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : isTh
            ? "ไม่สามารถยื่นคำร้องข้อพิพาทได้ โปรดลองอีกครั้ง"
            : "Failed to submit dispute. Please try again.";
      setErrorMessage(message);
      Alert.alert(isTh ? "เกิดข้อผิดพลาด" : "Submission Failed", message);
    }
  };

  return (
    <ScreenLayout
      edges={["top", "left", "right", "bottom"]}
      className="flex-1 bg-ku-background"
    >
      <TopBar
        title={isTh ? "ยื่นคำร้องข้อพิพาท" : "File Dispute"}
        onBackPress={() => router.back()}
        backLabel={isTh ? "ย้อนกลับ" : "Back"}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-5 pt-4 pb-12"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header & Escrow Notice */}
          <View className="mb-5 rounded-2xl border border-ku-border-warning bg-ku-surface-warning p-4">
            <View className="flex-row items-center gap-2">
              <AlertTriangle color={colors.warningDark} size={20} />
              <Text className="font-ku-bold text-ku-body text-ku-warning-dark">
                {isTh ? "ข้อกำหนดการยื่นข้อพิพาท" : "Dispute Case Filing"}
              </Text>
            </View>
            <Text className="mt-2 text-ku-body-small text-ku-warning-dark">
              {isTh
                ? "สามารถยื่นข้อพิพาทได้ภายใน 24 ชั่วโมงหลังเควสต์ล้มเหลว เมื่อยื่นแล้ว เงินประกันจะถูกระงับไว้ 7 วันเพื่อรอการตรวจสอบจากผู้ดูแลระบบ"
                : "Disputes can be filed within 24 hours of quest failure. Upon filing, held funding is preserved for 7 days pending admin investigation."}
            </Text>
          </View>

          {/* Reason Selector */}
          <Text className="mb-3 font-ku-bold text-ku-body text-ku-text-strong">
            {isTh ? "สาเหตุของข้อพิพาท" : "Reason for Dispute"}
          </Text>
          <View className="mb-6 gap-2.5">
            {REASON_OPTIONS.map((option) => {
              const isSelected = selectedReason === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={isTh ? option.labelTh : option.labelEn}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelectedReason(option.value)}
                  className={cn(
                    "flex-row items-start gap-3 rounded-2xl border p-4 transition-colors",
                    isSelected
                      ? "border-ku-border-success bg-ku-surface-success"
                      : "border-ku-border bg-ku-card"
                  )}
                >
                  <View className="mt-0.5">
                    {isSelected ? (
                      <CheckCircle2 color={colors.primary} size={20} />
                    ) : (
                      <Circle color={colors.textSubtle} size={20} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={cn(
                        "font-ku-semibold text-ku-body-small",
                        isSelected ? "text-ku-success" : "text-ku-text-strong"
                      )}
                    >
                      {isTh ? option.labelTh : option.labelEn}
                    </Text>
                    <Text className="mt-1 text-ku-label text-ku-text-secondary">
                      {isTh ? option.descTh : option.descEn}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Statement Input */}
          <View className="mb-6">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-ku-bold text-ku-body text-ku-text-strong">
                {isTh ? "คำชี้แจงและหลักฐาน" : "Statement & Details"}
                <Text className="text-ku-danger"> *</Text>
              </Text>
              <Text
                className={cn(
                  "text-ku-label",
                  statement.length > 1000
                    ? "font-ku-bold text-ku-danger"
                    : "text-ku-text-subtle"
                )}
              >
                {statement.length}/1000
              </Text>
            </View>
            <View className="rounded-2xl border border-ku-border bg-ku-surface p-3">
              <TextInput
                multiline
                numberOfLines={6}
                maxLength={1000}
                accessibilityLabel={messages.fileDispute}
                accessibilityHint={errorMessage ?? statementTooLongMessage}
                placeholder={
                  isTh
                    ? "อธิบายเหตุการณ์และข้อเท็จจริงโดยละเอียด..."
                    : "Describe the situation, conditions, and relevant facts in detail..."
                }
                placeholderTextColor={colors.textSubtle}
                value={statement}
                onChangeText={setStatement}
                className="min-h-[140px] text-ku-body-small text-ku-text-strong"
                textAlignVertical="top"
                editable={!fileDisputeMutation.isPending}
              />
            </View>
            {statementTooLongMessage ? (
              <Text className="mt-1 text-ku-label text-ku-danger">
                {statementTooLongMessage}
              </Text>
            ) : null}
          </View>

          {/* Error notice if present */}
          {errorMessage ? (
            <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-ku-border-danger bg-ku-surface-danger p-3">
              <AlertCircle color={colors.danger} size={18} />
              <Text className="flex-1 text-ku-label text-ku-danger">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <Button
            variant="primary"
            disabled={!canSubmit}
            onPress={() => void handleSubmit()}
            className="w-full"
            accessibilityLabel={isTh ? "ยื่นคำร้องข้อพิพาท" : "Submit Dispute"}
          >
            {fileDisputeMutation.isPending ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : isTh ? (
              "ยื่นคำร้องข้อพิพาท"
            ) : (
              "Submit Dispute"
            )}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
