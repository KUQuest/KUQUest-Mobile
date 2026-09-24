import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useFileDisputeMutation } from "@/features/questBoard/api/questBoardQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { disputeMessages } from "@/locales/disputeMessages";

export function useQuestDisputeFeature(questId: string | undefined) {
  const router = useRouter();
  const { locale } = useLocale();
  const messages = disputeMessages[locale];
  const viewerId = useSessionQuery().data?.user.id ?? "";
  const fileDisputeMutation = useFileDisputeMutation();
  const { error } = fileDisputeMutation;

  const canSubmit =
    Boolean(questId && viewerId) && !fileDisputeMutation.isPending;

  // Filing is final and limited to one case per filer, so confirm first.
  const confirmAndFile = () => {
    if (!questId || !viewerId) return;
    Alert.alert(messages.confirmTitle, messages.confirmDescription, [
      { text: messages.cancel, style: "cancel" },
      {
        text: messages.confirm,
        onPress: () => fileDisputeMutation.mutate({ questId, viewerId }),
      },
    ]);
  };

  return {
    router,
    messages,
    canSubmit,
    confirmAndFile,
    errorMessage: error
      ? (error instanceof Error && error.message) || messages.errorFallback
      : null,
    filedCase: fileDisputeMutation.data,
    submitting: fileDisputeMutation.isPending,
  };
}
