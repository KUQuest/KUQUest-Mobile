import React from "react";

import { SafeAreaView } from "@/tw";
import { cn } from "@/tw/cn";

export type ScreenLayoutProps = React.ComponentProps<typeof SafeAreaView>;

export function ScreenLayout({ className, ...props }: ScreenLayoutProps) {
  return <SafeAreaView {...props} className={cn("flex-1", className)} />;
}

ScreenLayout.displayName = "ScreenLayout";
