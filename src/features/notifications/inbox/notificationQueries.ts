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
  type MemberNotificationCategory,
  type MemberUnreadSummary,
} from "@/api/NotificationApi";

const PAGE_SIZE = 20;

export const notificationKeys = {
  all: ["member-notifications"] as const,
  list: (unreadOnly: boolean, category: MemberNotificationCategory | null) =>
    [...notificationKeys.all, "list", { unreadOnly, category }] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function invalidateNotificationQueries(
  queryClient: QueryClient
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useNotificationsQuery(
  unreadOnly: boolean,
  category: MemberNotificationCategory | null = null
) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(unreadOnly, category),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      notificationApi.listNotifications(
        {
          cursor: pageParam,
          limit: PAGE_SIZE,
          unreadOnly,
          category: category ?? undefined,
        },
        { signal }
      ),
    getNextPageParam: (page) => page.nextCursor,
  });
}

function useUnreadSummaryQuery<T>(
  enabled: boolean,
  select: (summary: MemberUnreadSummary) => T
) {
  return useQuery({
    enabled,
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => notificationApi.unreadSummary({ signal }),
    select,
  });
}

const selectCount = (summary: MemberUnreadSummary) => summary.count;
const selectSummary = (summary: MemberUnreadSummary) => summary;

/** Badge count; off while signed out so a banned Member makes no call. */
export function useUnreadNotificationCountQuery(enabled = true) {
  return useUnreadSummaryQuery(enabled, selectCount);
}

/** Total and per-category unread counts for the inbox filter chips. */
export function useUnreadNotificationSummaryQuery() {
  return useUnreadSummaryQuery(true, selectSummary);
}

export function useMarkNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (target: MarkNotificationsReadTarget) =>
      notificationApi.markRead(target),
    onSettled: () => invalidateNotificationQueries(queryClient),
  });
}
