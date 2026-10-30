import { ChevronRight, Flag } from "lucide-react-native";

import { ConductReportSheet } from "@/features/questBoard/conductReport/ConductReportSheet";
import { FiledConductReports } from "@/features/questBoard/conductReport/FiledConductReports";
import {
  ConductReportRole,
  useConductReport,
} from "@/features/questBoard/conductReport/useConductReport";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { Pressable, Text, View } from "@/tw";

import type { LiveQuestSnapshot } from "../../live/liveQuestTypes";

/**
 * A Worker's Conduct Report entry in the Work Hub: report the Hirer
 * (CONDUCT_OUT_OF_SCOPE) or, on a group Quest, a teammate who delivered
 * nothing (CONDUCT_NO_SHOW). The Server decides who is reportable, so the
 * entry appears only when it lists someone.
 */
export function QuestWorkConductReport({
  snapshot,
}: {
  snapshot: LiveQuestSnapshot;
}) {
  const { colors } = useAppTheme();
  const report = useConductReport({
    role: ConductReportRole.WORKER,
    questId: snapshot.quest.id,
    viewerId: snapshot.viewerId,
    assignments: snapshot.assignments,
    participants: snapshot.participants,
    hirerName:
      "hirerName" in snapshot.quest ? snapshot.quest.hirerName : undefined,
    questState: snapshot.state,
  });

  return (
    <>
      {report.canReport ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${report.copy.entry}. ${report.copy.entryHint}`}
          className="min-h-[60px] flex-row items-center gap-ku-12 rounded-ku-card border border-ku-border bg-ku-surface px-ku-md py-ku-sm active:bg-ku-surface-raised"
          onPress={report.openReport}
          testID="quest-work-conduct-report"
        >
          <Flag color={colors.primaryDark} size={20} />
          <View className="min-w-0 flex-1 gap-ku-xs">
            <Text className="font-ku-medium text-ku-body text-ku-text-strong">
              {report.copy.entry}
            </Text>
            <Text className="text-ku-body-small text-ku-text-secondary">
              {report.copy.entryHint}
            </Text>
          </View>
          <ChevronRight color={colors.textSecondary} size={20} />
        </Pressable>
      ) : null}
      <FiledConductReports
        messages={report.messages}
        reports={report.filedReports}
      />
      <ConductReportSheet {...report} />
    </>
  );
}
