import React from "react";

import { View } from "@/tw";

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
      className={`rounded-2xl border p-4 ${
        tone === "warning"
          ? "border-amber-300 bg-amber-50"
          : tone === "success"
            ? "border-emerald-300 bg-emerald-50"
            : "border-slate-200 bg-white"
      }`}
    >
      {children}
    </View>
  );
}
