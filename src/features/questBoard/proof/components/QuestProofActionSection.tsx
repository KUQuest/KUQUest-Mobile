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
      <View className="mt-ku-18 gap-ku-10">
        {props.canSubmit ? (
          <Button
            onPress={props.onOpenSubmission}
            testID="open-proof-submission"
          >
            <Send color={colors.onPrimary} size={18} />
            <Text className="ml-ku-sm font-ku-semibold text-ku-body text-ku-on-primary">
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
    <View className="mt-ku-18">
      <Text className="mb-ku-10 text-ku-body-small text-ku-text-secondary">
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
