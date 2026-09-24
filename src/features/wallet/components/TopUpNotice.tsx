import React from "react";
import { AlertCircle, Info, type LucideIcon } from "lucide-react-native";
import { Text, View } from "@/tw";
import { cn } from "@/tw/cn";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";

const tones = {
  error: {
    container: "border border-ku-border-danger bg-ku-surface-danger",
    text: "text-ku-danger-dark",
    icon: AlertCircle,
    iconColor: "danger",
  },
  info: {
    container: "bg-ku-surface-raised",
    text: "text-ku-text-secondary",
    icon: Info,
    iconColor: "primary",
  },
} as const;

interface TopUpNoticeProps {
  message: string;
  tone: keyof typeof tones;
  icon?: LucideIcon;
}

export function TopUpNotice({ message, tone, icon }: TopUpNoticeProps) {
  const { colors } = useAppTheme();
  const variant = tones[tone];
  const Icon = icon ?? variant.icon;
  const isError = tone === "error";

  return (
    <View
      accessibilityLiveRegion={isError ? "assertive" : "polite"}
      accessibilityRole={isError ? "alert" : undefined}
      className={cn(
        "flex-row items-start gap-ku-sm rounded-ku-card p-ku-md",
        variant.container
      )}
    >
      <Icon color={colors[variant.iconColor]} size={18} strokeWidth={2.2} />
      <Text
        className={cn("flex-1 font-ku-medium text-ku-body-small", variant.text)}
      >
        {message}
      </Text>
    </View>
  );
}
