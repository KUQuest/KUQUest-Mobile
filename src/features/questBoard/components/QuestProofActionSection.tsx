import { Send } from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { colors } from "@/theme/colors";
import { Text, View } from "@/tw";

type QuestProofActionSectionProps =
  | {
      variant: "proof";
      canSubmit: boolean;
      refreshing: boolean;
      onOpenSubmission: () => void;
      onRefresh: () => void;
      retryLabel: string;
      submitLabel: string;
    }
  | {
      variant: "completion";
      refreshing: boolean;
      description: string;
      canConfirm: boolean;
      onConfirm: () => void;
      confirmLabel: string;
    };

export type { QuestProofActionSectionProps };

export function QuestProofActionSection(props: QuestProofActionSectionProps) {
  if (props.variant === "proof") {
    return (
      <View className="mt-[18px] gap-[10px]">
        {props.canSubmit ? (
          <Button
            onPress={props.onOpenSubmission}
            testID="open-proof-submission"
          >
            <Send color={colors.white} size={18} />
            <Text className="ml-[8px] font-ku-semibold text-ku-body text-ku-white">
              {props.submitLabel}
            </Text>
          </Button>
        ) : null}
        <Button
          disabled={props.refreshing}
          onPress={props.onRefresh}
          testID="proof-refresh"
          variant="secondary"
        >
          {props.retryLabel}
        </Button>
      </View>
    );
  }

  return (
    <View className="mt-[18px]">
      <Text className="mb-[10px] text-ku-body-small text-ku-text-secondary">
        {props.description}
      </Text>
      {props.canConfirm ? (
        <Button
          disabled={props.refreshing}
          onPress={props.onConfirm}
          testID="confirm-proof-free-completion"
        >
          {props.confirmLabel}
        </Button>
      ) : null}
    </View>
  );
}
