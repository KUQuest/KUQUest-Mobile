import React, { useState } from "react";
import { Alert, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

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

import { disputeApi, type DisputeReason } from "@/api/DisputeApi";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/TopBar";
import { useLocale } from "@/features/preferences/localeStore";
import { colors } from "@/theme/colors";

function routeValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

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

export default function QuestDisputeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const questId = routeValue(params.id);
  const { locale } = useLocale();

  const [selectedReason, setSelectedReason] = useState<DisputeReason>(
    "PROOF_REJECTED_UNFAIRLY"
  );
  const [statement, setStatement] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileDisputeMutation = useMutation({
    mutationFn: ({
      questId: id,
      reason,
      statement: value,
    }: {
      questId: string;
      reason: DisputeReason;
      statement: string;
    }) => disputeApi.fileDispute(id, { reason, statement: value }),
  });

  const isTh = locale === "th";
  const trimmedStatement = statement.trim();
  const isStatementValid =
    trimmedStatement.length > 0 && trimmedStatement.length <= 1000;
  const canSubmit =
    isStatementValid && !fileDisputeMutation.isPending && Boolean(questId);

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
      className="flex-1 bg-slate-50"
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
          <View className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <View className="flex-row items-center gap-2">
              <AlertTriangle color="#B45309" size={20} />
              <Text className="text-base font-bold text-amber-950">
                {isTh ? "ข้อกำหนดการยื่นข้อพิพาท" : "Dispute Case Filing"}
              </Text>
            </View>
            <Text className="mt-2 text-sm leading-5 text-amber-900">
              {isTh
                ? "สามารถยื่นข้อพิพาทได้ภายใน 24 ชั่วโมงหลังเควสต์ล้มเหลว เมื่อยื่นแล้ว เงินประกันจะถูกระงับไว้ 7 วันเพื่อรอการตรวจสอบจากผู้ดูแลระบบ"
                : "Disputes can be filed within 24 hours of quest failure. Upon filing, held funding is preserved for 7 days pending admin investigation."}
            </Text>
          </View>

          {/* Reason Selector */}
          <Text className="mb-3 text-base font-bold text-slate-950">
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
                      ? "border-emerald-700 bg-emerald-50/60"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <View className="mt-0.5">
                    {isSelected ? (
                      <CheckCircle2 color={colors.primary} size={20} />
                    ) : (
                      <Circle color="#94A3B8" size={20} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={cn(
                        "text-sm font-semibold",
                        isSelected ? "text-emerald-950" : "text-slate-900"
                      )}
                    >
                      {isTh ? option.labelTh : option.labelEn}
                    </Text>
                    <Text className="mt-1 text-xs leading-4 text-slate-600">
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
              <Text className="text-base font-bold text-slate-950">
                {isTh ? "คำชี้แจงและหลักฐาน" : "Statement & Details"}
                <Text className="text-red-500"> *</Text>
              </Text>
              <Text
                className={cn(
                  "text-xs",
                  statement.length > 1000
                    ? "font-bold text-red-500"
                    : "text-slate-500"
                )}
              >
                {statement.length}/1000
              </Text>
            </View>
            <View className="rounded-2xl border border-slate-200 bg-white p-3">
              <TextInput
                multiline
                numberOfLines={6}
                maxLength={1000}
                placeholder={
                  isTh
                    ? "อธิบายเหตุการณ์และข้อเท็จจริงโดยละเอียด..."
                    : "Describe the situation, conditions, and relevant facts in detail..."
                }
                placeholderTextColor="#94A3B8"
                value={statement}
                onChangeText={setStatement}
                className="min-h-[140px] text-sm leading-5 text-slate-900"
                textAlignVertical="top"
                editable={!fileDisputeMutation.isPending}
              />
            </View>
            {statement.length > 1000 ? (
              <Text className="mt-1 text-xs text-red-500">
                {isTh
                  ? "คำชี้แจงมีความยาวเกิน 1,000 ตัวอักษร"
                  : "Statement exceeds the 1000 character limit."}
              </Text>
            ) : null}
          </View>

          {/* Error notice if present */}
          {errorMessage ? (
            <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle color="#DC2626" size={18} />
              <Text className="flex-1 text-xs text-red-700">
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
              <ActivityIndicator color="white" />
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
