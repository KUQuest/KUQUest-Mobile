import { useCallback, useState } from "react";
import type { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";

export type OnboardingDatePickerTarget = {
  index: number;
  value: string;
  kind: "certificate" | "experience";
  field?: "startedAt" | "endedAt";
};
export type OnboardingDatePickerState = {
  target: OnboardingDatePickerTarget | null;
  today: Date;
  datePickerIndex: number | null;
  openCertificate: (index: number, value: string) => void;
  openExperience: (
    index: number,
    field: "startedAt" | "endedAt",
    value: string
  ) => void;
  handleChange: (event: DateTimePickerChangeEvent, selectedDate?: Date) => void;
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
  const [today] = useState(() => new Date());

  const openCertificate = useCallback((index: number, value: string) => {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date();
    setTarget({
      index,
      value: Number.isNaN(parsed.getTime())
        ? new Date().toISOString()
        : parsed.toISOString(),
      kind: "certificate",
    });
  }, []);

  const openExperience = useCallback(
    (index: number, field: "startedAt" | "endedAt", value: string) => {
      const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date();
      setTarget({
        index,
        field,
        value: Number.isNaN(parsed.getTime())
          ? new Date().toISOString()
          : parsed.toISOString(),
        kind: "experience",
      });
    },
    []
  );

  const close = useCallback(() => setTarget(null), []);

  const handleChange = useCallback(
    (_event: DateTimePickerChangeEvent, selectedDate?: Date) => {
      if (!selectedDate || !target) {
        setTarget(null);
        return;
      }
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const date =
        target.kind === "experience"
          ? `${year}-${month}-01`
          : `${year}-${month}-${day}`;
      if (target.kind === "certificate") {
        onCertificateDate(target.index, date);
      } else if (target.field) {
        onExperienceDate(target.index, target.field, date);
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
    handleChange,
    close,
  };
}
