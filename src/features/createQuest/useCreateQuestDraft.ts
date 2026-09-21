import { useCallback, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  getHeadcountForParticipation,
  initialDraft,
  type QuestDraft,
} from "./createQuestModel";

export function useCreateQuestDraft() {
  const [draft, setDraft] = useState<QuestDraft>(initialDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<string | null>(
    null
  );
  const draftChangedRef = useRef(false);

  const updateDraft = useCallback(
    <K extends keyof QuestDraft>(field: K, value: QuestDraft[K]) => {
      draftChangedRef.current = true;
      setDraft((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
      setValidationSummary(null);
    },
    []
  );

  const updateParticipation = useCallback(
    (value: QuestDraft["participation"]) => {
      draftChangedRef.current = true;
      setDraft((current) => ({
        ...current,
        participation: value,
        headcount: getHeadcountForParticipation(value, current.headcount),
      }));
      setErrors((current) => {
        if (!current.headcount) return current;
        const next = { ...current };
        delete next.headcount;
        return next;
      });
      setValidationSummary(null);
    },
    []
  );

  const resetDraft = useCallback(() => {
    draftChangedRef.current = false;
    setDraft(initialDraft);
    setErrors({});
    setValidationSummary(null);
  }, []);

  return {
    draft,
    setDraft: setDraft as Dispatch<SetStateAction<QuestDraft>>,
    errors,
    setErrors,
    validationSummary,
    setValidationSummary,
    draftChangedRef,
    updateDraft,
    updateParticipation,
    resetDraft,
  };
}
