import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Modal, Platform } from "react-native";

import { Pressable, Text, View } from "@/tw";
import { createQuestMessages } from "@/locales/createQuestMessages";
import styles from "../createQuestStyles";
import type { PickerMode } from "../../createQuestTypes";

export function SchedulePickerModal({
  messages,
  visible,
  field,
  mode,
  value,
  minimumDate,
  onChange,
  onConfirmIos,
  onClose,
}: {
  messages: typeof createQuestMessages.en;
  visible: boolean;
  field: "start" | "end" | null;
  mode: PickerMode;
  value: Date;
  minimumDate?: Date;
  onChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onConfirmIos: () => void;
  onClose: () => void;
}) {
  if (!visible || !field) return null;

  return Platform.OS === "ios" ? (
    <Modal transparent animationType="slide" onRequestClose={onClose} visible>
      <View className={styles.modalBackdrop}>
        <View accessibilityViewIsModal className={styles.pickerSheet}>
          <View className={styles.pickerHeader}>
            <Text className={styles.pickerTitle}>
              {field === "start"
                ? messages.startDateTime
                : messages.deadlineDateTime}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messages.dateDone}
              onPress={onConfirmIos}
              className={styles.pickerDoneButton}
            >
              <Text className={styles.pickerDoneText}>{messages.dateDone}</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={value}
            mode="datetime"
            display="spinner"
            onChange={onChange}
            minimumDate={minimumDate}
          />
        </View>
      </View>
    </Modal>
  ) : (
    <DateTimePicker
      value={value}
      mode={mode}
      display="default"
      is24Hour
      onChange={onChange}
      minimumDate={mode === "date" ? minimumDate : undefined}
    />
  );
}
