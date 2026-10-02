import { useCallback, useMemo, useState } from "react";

import {
  createEmptyProfile,
  type Certificate,
  type Experience,
  type ProfileDraft,
  type Work,
} from "../profile/types";
import {
  validateProfileBasics,
  validateProfileDetails,
  type OnboardingValidationMessages,
} from "./validation";

export type OnboardingHydrationState = "waiting" | "hydrated" | "editing";

type BasicField =
  | "name"
  | "telephone"
  | "occupation"
  | "studentId"
  | "faculty"
  | "department"
  | "acceptedTerms"
  | "description"
  | "profileImage";
export type OnboardingFormState = {
  form: ProfileDraft;
  errors: Record<string, string>;
  hydrationState: OnboardingHydrationState;
  isDirty: boolean;
  updateField: <K extends BasicField>(field: K, value: ProfileDraft[K]) => void;
  updateCertificate: (
    index: number,
    field: keyof Certificate,
    value: string
  ) => void;
  updateExperience: (
    index: number,
    field: keyof Experience,
    value: string
  ) => void;
  updateWork: (index: number, field: keyof Work, value: string) => void;
  addCertificate: () => void;
  addExperience: () => void;
  addWork: () => void;
  removeCertificate: (index: number) => void;
  removeExperience: (index: number) => void;
  removeWork: (index: number) => void;
  clearErrors: (...keys: string[]) => void;
  validateBasics: (requiresStudentId: boolean) => boolean;
  validateDetails: () => boolean;
  replaceForm: (nextForm: ProfileDraft, dirty: boolean) => void;
  resetToServer: () => void;
};

type LocalFormState = {
  form: ProfileDraft | null;
  dirty: boolean;
  sourceVersion: ProfileDraft | undefined;
};

/**
 * Query data remains the source snapshot until an edit promotes it to local
 * form state. Later query snapshots cannot replace dirty local state; reset
 * and persistence completion are the explicit reconciliation points.
 */

function createEmptyCertificate(): Certificate {
  return { name: "", issuer: "", issuedAt: "", imageUri: "" };
}

function createEmptyWork(): Work {
  return { imageUri: "", title: "", detail: "" };
}

function createEmptyExperience(): Experience {
  return {
    title: "",
    employmentType: "",
    organization: "",
    description: "",
    startedAt: "",
    endedAt: "",
  };
}

function removeIndexedErrors(
  errors: Record<string, string>,
  prefix: string,
  removedIndex: number
): Record<string, string> {
  const prefixWithSeparator = `${prefix}_`;
  return Object.entries(errors).reduce<Record<string, string>>(
    (next, [key, value]) => {
      if (!key.startsWith(prefixWithSeparator)) {
        next[key] = value;
        return next;
      }

      const remainder = key.slice(prefixWithSeparator.length);
      const separatorIndex = remainder.indexOf("_");
      const itemIndex = Number.parseInt(remainder.slice(0, separatorIndex), 10);
      if (!Number.isInteger(itemIndex) || separatorIndex === -1) {
        next[key] = value;
        return next;
      }
      if (itemIndex < removedIndex) {
        next[key] = value;
      } else if (itemIndex > removedIndex) {
        next[
          `${prefix}_${itemIndex - 1}_${remainder.slice(separatorIndex + 1)}`
        ] = value;
      }
      return next;
    },
    {}
  );
}

export function useOnboardingForm({
  serverForm,
  isEditMode,
  messages,
  onMarkCertificateDeleted,
  onMarkExperienceDeleted,
  onMarkPortfolioDeleted,
}: {
  serverForm?: ProfileDraft;
  isEditMode: boolean;
  messages: OnboardingValidationMessages;
  onMarkCertificateDeleted: (id: string) => void;
  onMarkExperienceDeleted: (id: string) => void;
  onMarkPortfolioDeleted: (id: string) => void;
}) {
  const sourceVersion = serverForm;
  const [localState, setLocalState] = useState<LocalFormState>({
    form: null,
    dirty: false,
    sourceVersion: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const form = useMemo<ProfileDraft>(() => {
    if (
      localState.form &&
      (localState.dirty || localState.sourceVersion === sourceVersion)
    ) {
      return localState.form;
    }
    return serverForm ?? localState.form ?? createEmptyProfile();
  }, [localState, serverForm, sourceVersion]);

  const updateForm = useCallback(
    (update: (current: ProfileDraft) => ProfileDraft) => {
      setLocalState((previous) => ({
        form: update(previous.form ?? serverForm ?? form),
        dirty: true,
        sourceVersion,
      }));
    },
    [form, serverForm, sourceVersion]
  );

  const updateField = useCallback(
    <K extends BasicField>(field: K, value: ProfileDraft[K]) => {
      updateForm((current) => ({ ...current, [field]: value }));
      setErrors((previous) => {
        if (!(field in previous)) return previous;
        const next = { ...previous };
        delete next[field];
        return next;
      });
    },
    [updateForm]
  );

  const updateCertificate = useCallback(
    (index: number, field: keyof Certificate, value: string) => {
      updateForm((current) => ({
        ...current,
        certificates: current.certificates.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      }));
      setErrors((previous) => {
        const key = `cert_${index}_${String(field)}`;
        if (!(key in previous)) return previous;
        const next = { ...previous };
        delete next[key];
        return next;
      });
    },
    [updateForm]
  );

  const updateExperience = useCallback(
    (index: number, field: keyof Experience, value: string) => {
      updateForm((current) => ({
        ...current,
        experiences: current.experiences.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      }));
      setErrors((previous) => {
        const key = `experience_${index}_${String(field)}`;
        if (!(key in previous)) return previous;
        const next = { ...previous };
        delete next[key];
        return next;
      });
    },
    [updateForm]
  );

  const updateWork = useCallback(
    (index: number, field: keyof Work, value: string) => {
      updateForm((current) => ({
        ...current,
        works: current.works.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      }));
      setErrors((previous) => {
        const key = `work_${index}_${String(field)}`;
        if (!(key in previous)) return previous;
        const next = { ...previous };
        delete next[key];
        return next;
      });
    },
    [updateForm]
  );

  const addCertificate = useCallback(() => {
    updateForm((current) => ({
      ...current,
      certificates: [...current.certificates, createEmptyCertificate()],
    }));
  }, [updateForm]);

  const addExperience = useCallback(() => {
    updateForm((current) => ({
      ...current,
      experiences: [...current.experiences, createEmptyExperience()],
    }));
  }, [updateForm]);

  const addWork = useCallback(() => {
    updateForm((current) => ({
      ...current,
      works: [...current.works, createEmptyWork()],
    }));
  }, [updateForm]);

  const clearRemovedItemErrors = useCallback(
    (prefix: string, index: number) => {
      setErrors((previous) => removeIndexedErrors(previous, prefix, index));
    },
    []
  );

  const removeCertificate = useCallback(
    (index: number) => {
      const certificate = form.certificates[index];
      if (certificate?.id) onMarkCertificateDeleted(certificate.id);
      clearRemovedItemErrors("cert", index);
      updateForm((current) => ({
        ...current,
        certificates: current.certificates.filter(
          (_, itemIndex) => itemIndex !== index
        ),
      }));
    },
    [
      clearRemovedItemErrors,
      form.certificates,
      onMarkCertificateDeleted,
      updateForm,
    ]
  );

  const removeExperience = useCallback(
    (index: number) => {
      const experience = form.experiences[index];
      if (experience?.id) onMarkExperienceDeleted(experience.id);
      clearRemovedItemErrors("experience", index);
      updateForm((current) => ({
        ...current,
        experiences: current.experiences.filter(
          (_, itemIndex) => itemIndex !== index
        ),
      }));
    },
    [
      clearRemovedItemErrors,
      form.experiences,
      onMarkExperienceDeleted,
      updateForm,
    ]
  );

  const removeWork = useCallback(
    (index: number) => {
      const work = form.works[index];
      if (work?.id) onMarkPortfolioDeleted(work.id);
      clearRemovedItemErrors("work", index);
      updateForm((current) => ({
        ...current,
        works: current.works.filter((_, itemIndex) => itemIndex !== index),
      }));
    },
    [clearRemovedItemErrors, form.works, onMarkPortfolioDeleted, updateForm]
  );

  const clearErrors = useCallback((...keys: string[]) => {
    setErrors((previous) => {
      let changed = false;
      const next = { ...previous };
      for (const key of keys) {
        if (!(key in next)) continue;
        delete next[key];
        changed = true;
      }
      return changed ? next : previous;
    });
  }, []);

  const validateBasics = useCallback(
    (requiresStudentId: boolean) => {
      const nextErrors = validateProfileBasics(
        form,
        isEditMode,
        messages,
        requiresStudentId
      );
      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    },
    [form, isEditMode, messages]
  );

  const validateDetails = useCallback(() => {
    const nextErrors = validateProfileDetails(form, messages);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form, messages]);

  const replaceForm = useCallback(
    (nextForm: ProfileDraft, dirty: boolean) => {
      setLocalState({
        form: nextForm,
        dirty,
        sourceVersion,
      });
    },
    [sourceVersion]
  );

  const resetToServer = useCallback(() => {
    setLocalState({ form: null, dirty: false, sourceVersion: undefined });
    setErrors({});
  }, []);

  return {
    form,
    errors,
    hydrationState: !serverForm
      ? ("waiting" as const)
      : localState.dirty
        ? ("editing" as const)
        : ("hydrated" as const),
    isDirty: localState.dirty,
    updateField,
    updateCertificate,
    updateExperience,
    updateWork,
    addCertificate,
    addExperience,
    addWork,
    removeCertificate,
    removeExperience,
    removeWork,
    clearErrors,
    validateBasics,
    validateDetails,
    replaceForm,
    resetToServer,
  };
}
