import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { openServerSocket } from "@/api/ServerSocket";
import { chatKeys } from "./chatQueries";

/** Keeps inbox previews and unread summaries current while a Member is signed in. */
export function useChatInboxRealtime(viewerId: string, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!viewerId || !enabled) return;
    const syncInbox = () => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: chatKeys.conversations(viewerId),
        }),
        queryClient.invalidateQueries({
          queryKey: chatKeys.candidateInquiries(viewerId),
        }),
        queryClient.invalidateQueries({ queryKey: chatKeys.unread(viewerId) }),
      ]);
    };
    const socket = openServerSocket("/api/v1/chat/events", {
      onOpen: syncInbox,
      onFrame: syncInbox,
    });
    return () => socket.close();
  }, [enabled, queryClient, viewerId]);
}
