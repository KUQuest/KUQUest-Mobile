import {
  CheckCircle2,
  FileCheck2,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react-native";

import { colors } from "@/theme/colors";
import { Text, View } from "@/tw";

type QuestProofStatusIcon = "approved" | "not-approved" | "pending" | "draft";

export interface QuestProofStatusCardProps {
  icon: QuestProofStatusIcon;
  label: string;
  description?: string | null;
  pendingDescription?: string;
  terminalDescription?: string;
  lockDescription?: string;
}

export function QuestProofStatusCard({
  icon,
  label,
  description,
  pendingDescription,
  terminalDescription,
  lockDescription,
}: QuestProofStatusCardProps) {
  return (
    <View className="mt-[16px] rounded-[18px] border border-ku-border bg-ku-card p-[16px]">
      <View className="flex-row items-center">
        {icon === "approved" ? (
          <CheckCircle2 color={colors.success} size={22} />
        ) : icon === "not-approved" ? (
          <ShieldAlert color={colors.danger} size={22} />
        ) : icon === "pending" ? (
          <LockKeyhole color={colors.primary} size={22} />
        ) : (
          <FileCheck2 color={colors.primary} size={22} />
        )}
        <Text className="ml-[8px] font-ku-bold text-ku-subtitle text-ku-text-strong">
          {label}
        </Text>
      </View>
      {description ? (
        <Text className="mt-[12px] text-ku-body-small text-ku-text-secondary">
          {description}
        </Text>
      ) : null}
      {pendingDescription ? (
        <Text className="mt-[10px] text-ku-body-small text-ku-text-secondary">
          {pendingDescription}
        </Text>
      ) : null}
      {terminalDescription ? (
        <Text className="mt-[10px] text-ku-body-small text-ku-text-secondary">
          {terminalDescription}
        </Text>
      ) : null}
      {lockDescription ? (
        <Text className="mt-[10px] text-ku-body-small text-ku-text-secondary">
          {lockDescription}
        </Text>
      ) : null}
    </View>
  );
}
