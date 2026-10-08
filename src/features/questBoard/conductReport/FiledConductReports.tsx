import type { ConductReportMessages } from "@/locales/conductReportMessages";
import { Text, View } from "@/tw";

import type { FiledConductReport } from "./useHirerConductReport";

/** The viewer's own Conduct Reports on this Quest and their Admin status. */
export function FiledConductReports({
  messages,
  reports,
}: {
  messages: ConductReportMessages;
  reports: readonly FiledConductReport[];
}) {
  if (reports.length === 0) return null;
  return (
    <View
      className="gap-ku-sm rounded-ku-card border border-ku-border bg-ku-surface p-ku-md"
      testID="conduct-report-filed"
    >
      <Text
        accessibilityRole="header"
        className="font-ku-semibold text-ku-body-small text-ku-text-secondary"
      >
        {messages.filedTitle}
      </Text>
      {reports.map((report) => (
        <View
          accessible
          className="gap-ku-xs"
          key={report.id}
          testID={`conduct-report-filed-${report.id}`}
        >
          <Text className="font-ku-semibold text-ku-body text-ku-text-strong">
            {messages.filedItem(report.displayId, report.workerName)}
          </Text>
          <Text className="text-ku-body-small text-ku-text-secondary">
            {messages.status[report.status]}
          </Text>
        </View>
      ))}
    </View>
  );
}
