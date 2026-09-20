import React from "react";

import { View } from "@/tw";
import { cn } from "@/tw/cn";
export interface QuestWorkStateCardProps {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "success";
}

export function StateCard({
  children,
  tone = "neutral",
}: QuestWorkStateCardProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border p-4",
        tone === "warning"
          ? "border-ku-border-warning bg-ku-surface-warning"
          : tone === "success"
            ? "border-ku-border-success bg-ku-surface-success"
            : "border-ku-border bg-ku-card"
      )}
    >
      {children}
    </View>
  );
}
