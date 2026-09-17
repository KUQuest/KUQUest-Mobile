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
    <View className="bg-ku-card border-ku-border rounded-[18px] border mt-[16px] p-[16px]">
      <View className="items-center flex-row">
        {icon === "approved" ? (
          <CheckCircle2 color={colors.success} size={22} />
        ) : icon === "not-approved" ? (
          <ShieldAlert color={colors.danger} size={22} />
        ) : icon === "pending" ? (
          <LockKeyhole color={colors.primary} size={22} />
        ) : (
          <FileCheck2 color={colors.primary} size={22} />
        )}
        <Text className="text-ku-text-strong font-ku-bold text-ku-subtitle ml-[8px]">
          {label}
        </Text>
      </View>
      {description ? (
        <Text className="text-ku-text-secondary text-ku-body-small mt-[12px]">
          {description}
        </Text>
      ) : null}
      {pendingDescription ? (
        <Text className="text-ku-text-secondary text-ku-body-small mt-[10px]">
          {pendingDescription}
        </Text>
      ) : null}
      {terminalDescription ? (
        <Text className="text-ku-text-secondary text-ku-body-small mt-[10px]">
          {terminalDescription}
        </Text>
      ) : null}
      {lockDescription ? (
        <Text className="text-ku-text-secondary text-ku-body-small mt-[10px]">
          {lockDescription}
        </Text>
      ) : null}
    </View>
  );
}
