import { Fragment } from "react";
import { ActivityIndicator, RefreshControl } from "react-native";
import { Users } from "lucide-react-native";

import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { StateView } from "@/components/ui/StateView";
import { TopBar } from "@/components/ui/TopBar";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import { ScrollView, Text, View } from "@/tw";
import type {
  RosterSelection,
  SelectRosterScreenViewModel,
} from "../selectRosterViewModel";
import { ProposalCard, WorkerRow } from "./SelectRosterMemberRows";
import styles from "./selectRosterStyles";

type ReadyViewModel = Extract<SelectRosterScreenViewModel, { status: "ready" }>;

function assertNever(value: never): never {
  throw new Error(`Unknown select-roster view state: ${String(value)}`);
}

function WorkersSection({ vm }: { vm: ReadyViewModel }) {
  return (
    <View className={styles.section}>
      <View className={styles.sectionHeader}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {vm.workersTitle}
        </Text>
        <Text className={styles.sectionMeta}>{vm.workerCountLabel}</Text>
      </View>
      <View
        accessibilityElementsHidden
        className={styles.progressTrack}
        importantForAccessibility="no-hide-descendants"
      >
        <View
          className={styles.progressFill}
          style={{ width: `${vm.filledRatio * 100}%` }}
        />
      </View>
      {vm.workerIds.length === 0 ? (
        <Text className={styles.emptyText}>{vm.noWorkersLabel}</Text>
      ) : (
        vm.workerIds.map((workerId, index) => (
          <Fragment key={workerId}>
            {index > 0 ? <View className={styles.divider} /> : null}
            <WorkerRow
              onOpenProfile={vm.onOpenProfile}
              openProfileLabel={vm.openProfileLabel}
              workerId={workerId}
            />
          </Fragment>
        ))
      )}
    </View>
  );
}

function SelectionSection({
  selection,
  vm,
}: {
  selection: RosterSelection;
  vm: ReadyViewModel;
}) {
  const { colors } = useAppTheme();

  if (selection.mode === "automatic") {
    return (
      <View className={styles.automaticNote}>
        <Users color={colors.primaryDeep} size={22} />
        <Text className={styles.automaticText}>{selection.message}</Text>
      </View>
    );
  }

  return (
    <View className={styles.section}>
      <View className={styles.sectionHeader}>
        <Text accessibilityRole="header" className={styles.sectionTitle}>
          {selection.title}
        </Text>
        <Text className={styles.countPill}>{selection.countLabel}</Text>
      </View>
      <Text className={styles.sectionSubtitle}>{selection.subtitle}</Text>
      {selection.proposals.length === 0 ? (
        <Text className={styles.emptyText}>{selection.emptyLabel}</Text>
      ) : (
        selection.proposals.map((proposal) => (
          <ProposalCard
            canReject={selection.canReject}
            canSelect={selection.canSelect}
            key={proposal.id}
            onOpenProfile={vm.onOpenProfile}
            openProfileLabel={vm.openProfileLabel}
            pendingAction={selection.pendingAction}
            proposal={proposal}
            rejectLabel={selection.rejectLabel}
            selectLabel={selection.selectLabel}
          />
        ))
      )}
    </View>
  );
}

function ReadyContent({ vm }: { vm: ReadyViewModel }) {
  const { colors } = useAppTheme();
  // Pending proposals lead while the Hirer still has a decision to make.
  const selectionFirst =
    vm.selection.mode === "candidate" && vm.selection.proposals.length > 0;
  const selection = <SelectionSection selection={vm.selection} vm={vm} />;

  return (
    <ScrollView
      contentContainerClassName={styles.content}
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          onRefresh={vm.onRefresh}
          refreshing={vm.refreshing}
          tintColor={colors.primary}
        />
      }
    >
      <Text accessibilityRole="header" className={styles.questTitle}>
        {vm.questTitle}
      </Text>
      {selectionFirst ? selection : null}
      <WorkersSection vm={vm} />
      {selectionFirst ? null : selection}
    </ScrollView>
  );
}

function StatusBody({ vm }: { vm: SelectRosterScreenViewModel }) {
  const { colors } = useAppTheme();

  switch (vm.status) {
    case "loading":
      return (
        <View accessibilityLiveRegion="polite" className={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text className={styles.loadingText}>{vm.loadingMessage}</Text>
        </View>
      );
    case "error":
      return (
        <StateView
          actionLabel={vm.retryLabel}
          description={vm.errorMessage}
          onAction={vm.onRetry}
          title={vm.errorTitle}
          variant="error"
        />
      );
    case "ready":
      return <ReadyContent vm={vm} />;
    default:
      return assertNever(vm);
  }
}

export function SelectRosterScreenView({
  vm,
}: {
  vm: SelectRosterScreenViewModel;
}) {
  return (
    <ScreenLayout className="bg-ku-background" edges={["top", "left", "right"]}>
      <TopBar onBackPress={vm.onBack} title={vm.title} />
      <StatusBody vm={vm} />
    </ScreenLayout>
  );
}
