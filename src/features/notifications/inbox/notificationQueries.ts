import {
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  notificationApi,
  type MarkNotificationsReadTarget,
} from "@/api/NotificationApi";

const PAGE_SIZE = 20;

export const notificationKeys = {
  all: ["member-notifications"] as const,
  list: (unreadOnly: boolean) =>
    [...notificationKeys.all, "list", { unreadOnly }] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function invalidateNotificationQueries(
  queryClient: QueryClient
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useNotificationsQuery(unreadOnly: boolean) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(unreadOnly),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      notificationApi.listNotifications(
        { cursor: pageParam, limit: PAGE_SIZE, unreadOnly },
        { signal }
      ),
    getNextPageParam: (page) => page.nextCursor,
  });
}

/** Badge count; off while signed out so a banned Member makes no call. */
export function useUnreadNotificationCountQuery(enabled = true) {
  return useQuery({
    enabled,
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => notificationApi.countUnread({ signal }),
  });
}

export function useMarkNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (target: MarkNotificationsReadTarget) =>
      notificationApi.markRead(target),
    onSettled: () => invalidateNotificationQueries(queryClient),
  });
}
