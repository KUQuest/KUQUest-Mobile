import { useCallback } from "react";
import { Alert } from "react-native";

import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useFileDisputeMutation } from "@/features/questBoard/api/questBoardQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { disputeMessages } from "@/locales/disputeMessages";

/**
 * Files the viewer's Dispute Case on a failed Quest. `fileQuestDispute` takes
 * no request body, so filing is a confirmation, not a form. Filing is final
 * and limited to one case per filer, so the rules are shown before it.
 */
export function useFileDispute() {
  const { locale } = useLocale();
  const messages = disputeMessages[locale];
  const viewerId = useSessionQuery().data?.user.id ?? "";
  const { mutate, isPending } = useFileDisputeMutation();

  const confirmFileDispute = useCallback(
    (questId: string) => {
      if (!viewerId || isPending) return;
      Alert.alert(
        messages.confirmTitle,
        messages.rules.map((rule) => `• ${rule}`).join("\n"),
        [
          { text: messages.cancel, style: "cancel" },
          {
            text: messages.confirm,
            style: "destructive",
            onPress: () =>
              mutate(
                { questId, viewerId },
                {
                  onSuccess: (filedCase) =>
                    Alert.alert(
                      messages.successTitle,
                      messages.successDescription(filedCase.displayId)
                    ),
                  onError: (error) =>
                    Alert.alert(
                      messages.errorTitle,
                      error.message || messages.errorFallback
                    ),
                }
              ),
          },
        ]
      );
    },
    [isPending, messages, mutate, viewerId]
  );

  return { confirmFileDispute, filingDispute: isPending };
}
