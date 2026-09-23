import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import type { DisputeReason } from "@/api/DisputeApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useFileDisputeMutation } from "@/features/questBoard/api/questBoardQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { questWorkMessages } from "@/locales/questWorkMessages";

export function useQuestDisputeFeature(questId: string | undefined) {
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

  return {
    router,
    messages,
    selectedReason,
    setSelectedReason,
    statement,
    setStatement,
    errorMessage,
    fileDisputeMutation,
    isTh,
    statementTooLongMessage,
    canSubmit,
    handleSubmit,
  };
}
