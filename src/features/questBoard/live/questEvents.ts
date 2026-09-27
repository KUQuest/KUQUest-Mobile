import { z } from "zod";

import { openServerSocket, type ServerSocket } from "@/api/ServerSocket";

const questSubscribedEventSchema = z.object({
  type: z.literal("SUBSCRIBED"),
  version: z.literal(1),
  questId: z.string().min(1),
});

const questUpdatedEventSchema = z
  .object({
    type: z.literal("QUEST_UPDATED"),
    version: z.literal(1),
    questId: z.string().min(1),
    changeType: z.string().min(1),
    editRequestId: z.string().min(1).optional(),
  })
  .refine(
    (event) =>
      event.changeType !== "QUEST_EDIT_UPDATED" || Boolean(event.editRequestId)
  );

type QuestUpdatedEvent = z.infer<typeof questUpdatedEventSchema>;

const candidateRosterUpdatedEventSchema = z
  .object({
    type: z.literal("CANDIDATE_ROSTER_UPDATED"),
    version: z.literal(1),
    questId: z.string().uuid(),
  })
  .strict();

export type CandidateRosterUpdatedEvent = z.infer<
  typeof candidateRosterUpdatedEventSchema
>;

const questBoardSubscribedEventSchema = z
  .object({
    type: z.literal("SUBSCRIBED"),
    version: z.literal(1),
    scope: z.literal("QUEST_BOARD"),
  })
  .strict();

const questBoardInvalidatedEventSchema = z
  .object({
    type: z.literal("QUEST_BOARD_INVALIDATED"),
    version: z.literal(1),
    questId: z.string().uuid(),
  })
  .strict();

export type QuestBoardInvalidatedEvent = z.infer<
  typeof questBoardInvalidatedEventSchema
>;
const hirerQuestSubscribedEventSchema = z
  .object({
    type: z.literal("SUBSCRIBED"),
    version: z.literal(1),
  })
  .strict();

const hirerQuestUpdatedEventSchema = z
  .object({
    type: z.literal("HIRER_QUEST_UPDATED"),
    version: z.literal(1),
    questId: z.string().uuid(),
    changeType: z.string().min(1),
  })
  .strict();

export type HirerQuestUpdatedEvent = z.infer<
  typeof hirerQuestUpdatedEventSchema
>;

type HirerQuestListener = {
  onQuestUpdated: (event: HirerQuestUpdatedEvent) => void;
  onSubscribed?: () => void;
};

const hirerQuestListeners = new Set<HirerQuestListener>();
let hirerQuestSocket: ServerSocket | null = null;
let hirerQuestSubscribed = false;

function subscribeToEventStream<TSubscription, TUpdate>(
  path: string,
  subscriptionSchema: z.ZodType<TSubscription>,
  acceptsSubscription: (value: TSubscription) => boolean,
  updateSchema: z.ZodType<TUpdate>,
  acceptsUpdate: (value: TUpdate) => boolean,
  onUpdate: (event: TUpdate) => void,
  onSubscribed?: () => void
): () => void {
  let subscribed = false;
  const socket = openServerSocket(path, {
    onClose: () => {
      subscribed = false;
    },
    onFrame: (payload) => {
      const subscription = subscriptionSchema.safeParse(payload);
      if (subscription.success) {
        subscribed = acceptsSubscription(subscription.data);
        if (subscribed) onSubscribed?.();
        return;
      }
      if (!subscribed) return;

      const parsed = updateSchema.safeParse(payload);
      if (parsed.success && acceptsUpdate(parsed.data)) {
        onUpdate(parsed.data);
      }
    },
  });
  return socket.close;
}

export function subscribeToQuestEvents(
  questId: string,
  onQuestUpdated: (event: QuestUpdatedEvent) => void,
  onSubscribed?: () => void
): () => void {
  if (!questId) return () => {};
  return subscribeToEventStream(
    `/api/v2/quests/${encodeURIComponent(questId)}/events`,
    questSubscribedEventSchema,
    (event) => event.questId === questId,
    questUpdatedEventSchema,
    (event) => event.questId === questId,
    onQuestUpdated,
    onSubscribed
  );
}

export function subscribeToCandidateRosterEvents(
  questId: string,
  onRosterUpdated: (event: CandidateRosterUpdatedEvent) => void,
  onSubscribed?: () => void
): () => void {
  if (!questId) return () => {};
  return subscribeToEventStream(
    `/api/v2/quests/${encodeURIComponent(questId)}/candidate-roster/events`,
    questSubscribedEventSchema,
    (event) => event.questId === questId,
    candidateRosterUpdatedEventSchema,
    (event) => event.questId === questId,
    onRosterUpdated,
    onSubscribed
  );
}

export function subscribeToQuestBoardEvents(
  onInvalidated: (event: QuestBoardInvalidatedEvent) => void,
  onSubscribed?: () => void
): () => void {
  return subscribeToEventStream(
    "/api/v2/quests/board/events",
    questBoardSubscribedEventSchema,
    (event) => event.scope === "QUEST_BOARD",
    questBoardInvalidatedEventSchema,
    () => true,
    onInvalidated,
    onSubscribed
  );
}
export function subscribeToHirerQuestEvents(
  onQuestUpdated: (event: HirerQuestUpdatedEvent) => void,
  onSubscribed?: () => void
): () => void {
  const listener = { onQuestUpdated, onSubscribed };
  hirerQuestListeners.add(listener);

  if (hirerQuestSubscribed) onSubscribed?.();

  if (!hirerQuestSocket) {
    let terminalCloseDuringOpen = false;
    const socket = openServerSocket("/api/v2/me/hirer-quests/events", {
      onClose: (close) => {
        hirerQuestSubscribed = false;
        if (close.terminal) {
          terminalCloseDuringOpen = true;
          hirerQuestSocket = null;
        }
      },
      onFrame: (payload) => {
        const subscription = hirerQuestSubscribedEventSchema.safeParse(payload);
        if (subscription.success) {
          hirerQuestSubscribed = true;
          for (const current of hirerQuestListeners) {
            current.onSubscribed?.();
          }
          return;
        }
        if (!hirerQuestSubscribed) return;

        const update = hirerQuestUpdatedEventSchema.safeParse(payload);
        if (update.success) {
          for (const current of hirerQuestListeners) {
            current.onQuestUpdated(update.data);
          }
        }
      },
    });
    if (!terminalCloseDuringOpen) hirerQuestSocket = socket;
  }

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    hirerQuestListeners.delete(listener);
    if (hirerQuestListeners.size === 0) {
      const socket = hirerQuestSocket;
      hirerQuestSocket = null;
      hirerQuestSubscribed = false;
      socket?.close();
    }
  };
}
