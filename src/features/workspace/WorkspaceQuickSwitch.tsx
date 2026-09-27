import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { ArrowLeftRight } from "lucide-react-native";

import { Pressable } from "@/tw";
import { useLocale } from "@/features/preferences/localeStore";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { useRoleWorkspace } from "@/features/workspace/roleWorkspaceStore";
import { navigationMessages } from "@/locales/navigationMessages";

export function WorkspaceQuickSwitch() {
  const router = useRouter();
  const { locale } = useLocale();
  const { colors } = useAppTheme();
  const { isWorker, switchWorkspace } = useRoleWorkspace();
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);
  const switchingRef = useRef(false);
  const messages = navigationMessages[locale];

  const handleSwitchWorkspace = () => {
    if (switchingRef.current) return;
    switchingRef.current = true;
    setSwitchingWorkspace(true);
    void switchWorkspace().finally(() => {
      router.replace("/(tabs)");
    });
  };

  return (
    <Pressable
      accessibilityLabel={
        isWorker
          ? messages.switchToHirerWorkspace
          : messages.switchToWorkerWorkspace
      }
      accessibilityRole="button"
      accessibilityState={{
        busy: switchingWorkspace,
        disabled: switchingWorkspace,
      }}
      className="h-[48px] w-[48px] items-center justify-center rounded-ku-pill bg-ku-surface"
      disabled={switchingWorkspace}
      onPress={handleSwitchWorkspace}
      testID="workspace-quick-switch"
    >
      <ArrowLeftRight color={colors.primary} size={20} strokeWidth={2} />
    </Pressable>
  );
}
