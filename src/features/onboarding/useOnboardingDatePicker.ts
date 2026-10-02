import { useCallback, useState } from "react";

export type OnboardingDatePickerTarget = {
  index: number;
  value: string;
  kind: "certificate" | "experience";
  field?: "startedAt" | "endedAt";
};
export type OnboardingDatePickerState = {
  target: OnboardingDatePickerTarget | null;
  today: string;
  datePickerIndex: number | null;
  openCertificate: (index: number, value: string) => void;
  openExperience: (
    index: number,
    field: "startedAt" | "endedAt",
    value: string
  ) => void;
  handleDate: (date: string) => void;
  close: () => void;
};

export function useOnboardingDatePicker({
  onCertificateDate,
  onExperienceDate,
}: {
  onCertificateDate: (index: number, value: string) => void;
  onExperienceDate: (
    index: number,
    field: "startedAt" | "endedAt",
    value: string
  ) => void;
}) {
  const [target, setTarget] = useState<OnboardingDatePickerTarget | null>(null);
  const [today] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });

  const openCertificate = useCallback(
    (index: number, value: string) => {
      setTarget({
        index,
        value:
          /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= today ? value : today,
        kind: "certificate",
      });
    },
    [today]
  );

  const openExperience = useCallback(
    (index: number, field: "startedAt" | "endedAt", value: string) => {
      setTarget({
        index,
        field,
        value:
          /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= today ? value : today,
        kind: "experience",
      });
    },
    [today]
  );

  const close = useCallback(() => setTarget(null), []);

  const handleDate = useCallback(
    (date: string) => {
      if (!target) return;
      if (target.kind === "certificate") {
        onCertificateDate(target.index, date);
      } else if (target.field) {
        onExperienceDate(target.index, target.field, `${date.slice(0, 7)}-01`);
      }
      setTarget(null);
    },
    [onCertificateDate, onExperienceDate, target]
  );

  return {
    target,
    today,
    datePickerIndex: target?.index ?? null,
    openCertificate,
    openExperience,
    handleDate,
    close,
  };
}
