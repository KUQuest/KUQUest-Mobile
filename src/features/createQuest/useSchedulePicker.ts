import { useState } from "react";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Platform } from "react-native";

import {
  getSchedulePickerValue,
  getScheduleTimeValue,
  toDateValue,
  type QuestDraft,
} from "./createQuestModel";
import { getDateTimePickerValue } from "./createQuestDates";
import type { PickerMode, ScheduleField } from "./createQuestTypes";

export function useSchedulePicker({
  draft,
  updateDraft,
}: {
  draft: QuestDraft;
  updateDraft: <K extends keyof QuestDraft>(
    field: K,
    value: QuestDraft[K]
  ) => void;
}) {
  const [scheduleField, setScheduleField] = useState<ScheduleField | null>(
    null
  );
  const [pickerMode, setPickerMode] = useState<PickerMode>("date");
  const [iosPickerValue, setIosPickerValue] = useState<Date | null>(null);

  const closePicker = () => {
    setScheduleField(null);
    setPickerMode("date");
    setIosPickerValue(null);
  };

  const openPicker = (field: ScheduleField) => {
    const dateValue = field === "start" ? draft.startDate : draft.deadline;
    const timeValue = field === "start" ? draft.startTime : draft.endTime;
    setScheduleField(field);
    setPickerMode("date");
    setIosPickerValue(
      Platform.OS === "ios"
        ? getDateTimePickerValue(dateValue, timeValue)
        : null
    );
  };

  const saveScheduleValue = (field: ScheduleField, value: Date) => {
    const dateKey = field === "start" ? "startDate" : "deadline";
    const timeKey = field === "start" ? "startTime" : "endTime";
    updateDraft(dateKey, toDateValue(value));
    updateDraft(timeKey, getScheduleTimeValue(value));
  };

  const saveScheduleTime = (field: ScheduleField, value: Date) => {
    const timeKey = field === "start" ? "startTime" : "endTime";
    updateDraft(timeKey, getScheduleTimeValue(value));
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      closePicker();
      return;
    }
    if (!selectedDate || !scheduleField) return;

    if (Platform.OS === "ios") {
      setIosPickerValue(selectedDate);
      return;
    }

    if (pickerMode === "date") {
      const dateKey = scheduleField === "start" ? "startDate" : "deadline";
      updateDraft(dateKey, toDateValue(selectedDate));
      setPickerMode("time");
      return;
    }

    saveScheduleTime(scheduleField, selectedDate);
    closePicker();
  };

  const confirmIos = () => {
    if (scheduleField && iosPickerValue)
      saveScheduleValue(scheduleField, iosPickerValue);
    closePicker();
  };

  const draftDate =
    scheduleField === "start" ? draft.startDate : draft.deadline;
  const draftTime = scheduleField === "start" ? draft.startTime : draft.endTime;
  const pickerValue = getSchedulePickerValue(
    Platform.OS,
    getDateTimePickerValue(draftDate, draftTime),
    iosPickerValue
  );
  const minimumDate =
    scheduleField === "start"
      ? new Date()
      : draft.startDate
        ? getDateTimePickerValue(draft.startDate, draft.startTime)
        : undefined;

  return {
    activeField: scheduleField,
    pickerMode,
    pickerValue,
    minimumDate,
    openPicker,
    closePicker,
    handleChange,
    confirmIos,
  };
}
