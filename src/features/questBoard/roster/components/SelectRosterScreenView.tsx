import { type ListRenderItemInfo } from "react-native";
import { Users } from "lucide-react-native";

import { FlatList, Pressable, Text, View } from "@/tw";
import { ScreenLayout } from "@/components/layout/ScreenLayout";
import { TopBar } from "@/components/ui/TopBar";
import type { QuestV2Application, QuestV2Team } from "@/api/questV2Contracts";
import { CandidateRow, TeamRow } from "./SelectRosterProposalRows";
import { SelectRosterHeader } from "./SelectRosterHeader";
import type { SelectRosterScreenViewModel } from "../selectRosterViewModel";

function assertNever(value: never): never {
  throw new Error(`Unknown select-roster view state: ${String(value)}`);
}

export function SelectRosterScreenView({
  vm,
}: {
  vm: SelectRosterScreenViewModel;
}) {
  switch (vm.status) {
    case "loading":
      return (
        <ScreenLayout className="flex-1 bg-ku-background">
          <TopBar title={vm.title} onBackPress={vm.onBack} />
          <View className="p-ku-lg">
            <Text style={{ color: vm.colors.textSecondary }}>
              {vm.loadingMessage}
            </Text>
          </View>
        </ScreenLayout>
      );
    case "error":
      return (
        <ScreenLayout className="flex-1 bg-ku-background">
          <TopBar title={vm.title} onBackPress={vm.onBack} />
          <View className="p-ku-lg">
            <Text
              style={{ color: vm.colors.textStrong }}
              className="font-ku-bold"
            >
              {vm.errorTitle}
            </Text>
            <Text
              className="mt-ku-xs"
              style={{ color: vm.colors.textSecondary }}
            >
              {vm.errorMessage}
            </Text>
            <Pressable
              className="mt-ku-md rounded-xl p-ku-md"
              style={{ backgroundColor: vm.colors.primary }}
              onPress={vm.onRetry}
            >
              <Text className="text-center font-ku-bold text-ku-on-primary">
                {vm.retryLabel}
              </Text>
            </Pressable>
          </View>
        </ScreenLayout>
      );
    case "not-required":
      return (
        <ScreenLayout className="flex-1 bg-ku-background">
          <TopBar title={vm.title} onBackPress={vm.onBack} />
          <View className="items-center justify-center p-ku-xl">
            <Users size={36} color={vm.colors.textSecondary} />
            <Text
              className="mt-ku-12 text-center font-ku-medium"
              style={{ color: vm.colors.textSecondary }}
            >
              {vm.message}
            </Text>
          </View>
        </ScreenLayout>
      );
    case "ready": {
      const header = (
        <SelectRosterHeader
          questTitle={vm.questTitle}
          subtitle={vm.subtitle}
          requestedHeadcountLabel={vm.requestedHeadcountLabel}
          requestedHeadcount={vm.requestedHeadcount}
          actualHeadcountLabel={vm.actualHeadcountLabel}
          actualHeadcount={vm.actualHeadcount}
          proposalCountLabel={vm.proposalCountLabel}
          colors={vm.colors}
        />
      );
      const emptyState = (
        <Text
          className="text-center"
          style={{ color: vm.colors.textSecondary }}
        >
          {vm.noProposalsLabel}
        </Text>
      );

      return (
        <ScreenLayout
          edges={["top", "left", "right"]}
          className="flex-1 bg-ku-background"
        >
          <TopBar title={vm.title} onBackPress={vm.onBack} />
          {vm.isGroup ? (
            <FlatList
              data={vm.pendingTeams}
              keyExtractor={(team) => team.id}
              refreshing={vm.refreshing}
              onRefresh={vm.onRefresh}
              ListHeaderComponent={header}
              ListEmptyComponent={emptyState}
              renderItem={({ item }: ListRenderItemInfo<QuestV2Team>) => (
                <TeamRow
                  team={item}
                  canSelect={vm.canSelectTeam}
                  canReject={vm.canRejectTeam}
                  locale={vm.locale}
                  colors={vm.colors}
                  selectLabel={vm.selectLabel}
                  rejectLabel={vm.rejectLabel}
                  teamProposalLabel={vm.teamProposalLabel}
                  memberCount={vm.memberCount}
                  onSelect={vm.onSelectTeam}
                  onReject={vm.onRejectTeam}
                />
              )}
              contentContainerClassName="p-ku-20 pb-ku-48"
              initialNumToRender={12}
              windowSize={7}
              removeClippedSubviews
            />
          ) : (
            <FlatList
              data={vm.pendingApplications}
              keyExtractor={(application) => application.id}
              refreshing={vm.refreshing}
              onRefresh={vm.onRefresh}
              ListHeaderComponent={header}
              ListEmptyComponent={emptyState}
              renderItem={({
                item,
              }: ListRenderItemInfo<QuestV2Application>) => (
                <CandidateRow
                  application={item}
                  canSelect={vm.canSelectCandidate}
                  canReject={vm.canRejectCandidate}
                  locale={vm.locale}
                  colors={vm.colors}
                  selectLabel={vm.selectLabel}
                  rejectLabel={vm.rejectLabel}
                  submittedLabel={vm.submittedLabel}
                  onSelect={vm.onSelectApplication}
                  onReject={vm.onRejectApplication}
                />
              )}
              contentContainerClassName="p-ku-20 pb-ku-48"
              initialNumToRender={12}
              windowSize={7}
              removeClippedSubviews
            />
          )}
        </ScreenLayout>
      );
    }
    default:
      return assertNever(vm);
  }
}
