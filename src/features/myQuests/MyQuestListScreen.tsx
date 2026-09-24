import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { View } from "@/tw";

import { MyQuestListContent } from "./components/MyQuestListContent";
import { MyQuestListHeader } from "./components/MyQuestListHeader";
import {
  useMyQuestListController,
  type MyQuestListScreenProps,
} from "./workflow/useMyQuestListController";
export type { MyQuestListScreenProps };
export type { MyQuestTab } from "./myQuestWorkspaceProjection";

/** Hirer Work Management; the Worker workspace uses `WorkerWorkManagementScreen`. */
export default function MyQuestListScreen({
  initialTab,
}: MyQuestListScreenProps = {}) {
  const { frame, content } = useMyQuestListController({ initialTab });

  return (
    <ScreenLayout
      className="flex-1 bg-ku-background"
      edges={["top", "left", "right"]}
    >
      <View className="flex-1 bg-ku-background">
        <MyQuestListHeader {...frame.headerProps} />
        <MyQuestListContent {...content.listProps} />
      </View>
    </ScreenLayout>
  );
}
