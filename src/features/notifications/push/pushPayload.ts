import { z } from "zod";
import { serverNow } from "@/api/serverClock";
import {
  QuestV2PushTypeValue,
  questV2PushTypeSchema,
  questV2UnderfilledCancellationReasonSchema,
} from "@/api/questV2Contracts";
import { pushMessage } from "@/locales/pushMessages";
import type { SupportedLocale } from "@/locales/locale";
import type { KeyValueStorage } from "@/infrastructure/storage/keyValueStorage";

export const PUSH_DEDUPE_STORAGE_KEY = "kuquest_push_transition_ids";
export const PUSH_CHANNEL_ID = "kuquest";
const MAX_HANDLED_TRANSITIONS = 100;
const uuidSchema = z.string().uuid();

export const pushPayloadSchema = z.object({
  type: questV2PushTypeSchema,
  questId: uuidSchema,
  transitionId: z.string().trim().min(1),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  cancellationReason: questV2UnderfilledCancellationReasonSchema.optional(),
});
export type PushPayload = z.infer<typeof pushPayloadSchema>;

export function parsePushPayload(value: unknown): PushPayload | null {
  const result = pushPayloadSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function routeForPush(payload: Pick<PushPayload, "type" | "questId">) {
  return payload.type === QuestV2PushTypeValue.UNDERFILLED_CONSENT_PENDING
    ? ({
        pathname: "/quest/[id]/partial-start",
        params: { id: payload.questId },
      } as const)
    : ({ pathname: "/quest/[id]", params: { id: payload.questId } } as const);
}

export function remainingWindow(
  expiresAt: string,
  now = serverNow()
): string | null {
  const remainingMs = Date.parse(expiresAt) - now;
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return null;
  const seconds = Math.ceil(remainingMs / 1000);
  return seconds < 60
    ? `${seconds} ${seconds === 1 ? "second" : "seconds"}`
    : `${Math.ceil(seconds / 60)} min`;
}

export function localizedPushCopy(
  payload: PushPayload,
  locale: SupportedLocale,
  now = serverNow()
): { title: string; body: string } | null {
  const isTimed =
    payload.type === QuestV2PushTypeValue.UNDERFILLED_DECISION_PENDING ||
    payload.type === QuestV2PushTypeValue.UNDERFILLED_CONSENT_PENDING;
  const remaining = isTimed
    ? payload.expiresAt
      ? remainingWindow(payload.expiresAt, now)
      : null
    : undefined;
  if (isTimed && !remaining) return null;
  return pushMessage(locale, payload.type, {
    remaining: remaining ?? undefined,
    cancellationReason: payload.cancellationReason,
  });
}

function parseStoredTransitions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !Array.isArray(value) ||
      !value.every((item) => typeof item === "string")
    )
      return [];
    return value.slice(-MAX_HANDLED_TRANSITIONS);
  } catch {
    return [];
  }
}

export async function hasHandledTransition(
  storage: KeyValueStorage,
  transitionId: string
): Promise<boolean> {
  return parseStoredTransitions(
    await storage.get(PUSH_DEDUPE_STORAGE_KEY)
  ).includes(transitionId);
}

export async function markTransitionHandled(
  storage: KeyValueStorage,
  transitionId: string
): Promise<void> {
  const existing = parseStoredTransitions(
    await storage.get(PUSH_DEDUPE_STORAGE_KEY)
  );
  await storage.set(
    PUSH_DEDUPE_STORAGE_KEY,
    JSON.stringify(
      [...existing.filter((id) => id !== transitionId), transitionId].slice(
        -MAX_HANDLED_TRANSITIONS
      )
    )
  );
}
