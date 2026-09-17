import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  Check,
  ChevronLeft,
  CircleAlert,
  CircleX,
  RefreshCw,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  PROTOTYPE_PERSONAS,
  type PrototypePersonaId,
} from "@/components/ui/prototypeMenuData";
import { QuestTeamStatus } from "@/features/questBoard/types";
import { useLocale } from "@/locales/LocaleProvider";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "@/tw";
import { cn } from "@/tw/cn";

import {
  RoleplayActionButton,
  type RoleplayActionButtonVariant,
} from "./components/RoleplayActionButton";
import { RoleplayPersonaSwitcher } from "./components/RoleplayPersonaSwitcher";
import { roleplayMock } from "./roleplayMock";
import type {
  RoleplayAction,
  RoleplayActionType,
  RoleplayViewModel,
} from "./roleplayTypes";
import { ROLEPLAY_SCENARIOS, type RoleplayScenarioId } from "./roleplayTypes";
import styles from "./roleplayStyles";

interface RoleplayMessages {
  back: string;
  eyebrow: string;
  title: string;
  description: string;
  scenarios: string;
  scenariosDescription: string;
  scenario: string;
  scenarioDescription: string;
  state: string;
  activePersona: string;
  personas: string;
  personasDescription: string;
  applications: string;
  applicationId: string;
  applicant: string;
  noApplications: string;
  teams: string;
  teamsDescription: string;
  teamMembers: string;
  selectTeam: string;
  rejectTeam: string;
  invitations: string;
  invitationDescription: string;
  acceptInvitation: string;
  declineInvitation: string;
  actions: string;
  actionsDescription: string;
  noActions: string;
  reset: string;
  resetDescription: string;
  resetFeedback: string;
  switchedPersona: (label: string) => string;
  actionSucceeded: (label: string, state: string) => string;
  actionBlocked: (code: string) => string;
  ineligible: string;
  approve: string;
  decline: string;
  actionLabels: Partial<Record<RoleplayActionType, string>>;
  actionDescriptions: Partial<Record<RoleplayActionType, string>>;
}

const roleplayMessages: Record<"en" | "th", RoleplayMessages> = {
  en: {
    back: "Back",
    eyebrow: "Development-only prototype",
    title: "Roleplay Quest",
    description:
      "Switch demo personas and observe the same in-memory Quest workflow.",
    scenarios: "Roleplay scenarios",
    scenariosDescription:
      "Choose one of the four canonical participation and selection modes.",
    scenario: "Selected scenario",
    scenarioDescription:
      "This screen reads the stable roleplay fixture contract.",
    state: "Canonical Quest state",
    activePersona: "Active persona",
    personas: "Switch persona",
    personasDescription:
      "Only the personas supported by this roleplay scenario are shown.",
    applications: "Candidate applications",
    applicationId: "Application",
    applicant: "Applicant",
    noApplications: "No Candidate applications are available.",
    teams: "Candidate Teams",
    teamsDescription:
      "Team Candidate proposals are formed by members and selected by the Hirer.",
    teamMembers: "Members",
    selectTeam: "Accept",
    rejectTeam: "Decline",
    invitations: "Team invitations",
    invitationDescription: "Respond to an invitation from a Candidate Team.",
    acceptInvitation: "Accept invitation",
    declineInvitation: "Decline invitation",
    actions: "Allowed actions",
    actionsDescription:
      "Actions come from the active persona's capability projection.",
    noActions: "No actions are currently available for this persona.",
    reset: "Reset prototype state",
    resetDescription: "Restore the deterministic in-memory fixture.",
    resetFeedback: "Prototype state reset.",
    switchedPersona: (label) => `Active persona changed to ${label}.`,
    actionSucceeded: (label, state) =>
      `${label} completed. Quest state is now ${state}.`,
    actionBlocked: (code) =>
      `Action blocked by the fixture contract (${code}).`,
    ineligible: "This action is not available for the active persona.",
    approve: "Approve",
    decline: "Decline",
    // English action labels
    actionLabels: {
      DIRECT_JOIN: "Join Quest",
      APPLY: "Apply as Candidate",
      CREATE_TEAM: "Create Candidate Team",
      INVITE_WORKER: "Invite Worker",
      RESPOND_INVITATION: "Respond to Invitation",
      SUBMIT_TEAM: "Submit Team",
      SELECT_CANDIDATE: "Accept",
      REJECT_CANDIDATE: "Decline",
      REJECT_TEAM: "Decline",
      VOTE_PARTIAL_GROUP_START_CONSENT: "Approve partial start",
      CANCEL: "Cancel Quest",
    },
    actionDescriptions: {
      DIRECT_JOIN:
        "Join directly; the first eligible Worker receives the slot.",
      APPLY: "Submit an individual Candidate application.",
      CREATE_TEAM: "Start a Candidate Team for a GROUP Quest.",
      INVITE_WORKER: "Invite another Worker to your forming Team.",
      RESPOND_INVITATION: "Accept or decline a Candidate Team invitation.",
      SUBMIT_TEAM: "Submit the exact-headcount Team to the Hirer.",
      SELECT_CANDIDATE: "Accept this Candidate for the Quest.",
      REJECT_CANDIDATE: "Reject this Candidate application.",
      REJECT_TEAM: "Reject this submitted Candidate Team.",
      VOTE_PARTIAL_GROUP_START_CONSENT:
        "Approve the revised roster and reward for an underfilled Team Quest.",
      CANCEL: "Cancel the open Quest and end the prototype flow.",
    },
  },
  th: {
    scenarios: "Roleplay scenarios",
    scenariosDescription:
      "Choose one of the four canonical participation and selection modes.",
    teams: "Candidate Teams",
    teamsDescription:
      "Team Candidate proposals are formed by members and selected by the Hirer.",
    teamMembers: "Members",
    selectTeam: "รับ",
    rejectTeam: "ปฏิเสธ",
    invitations: "Team invitations",
    invitationDescription: "Respond to an invitation from a Candidate Team.",
    acceptInvitation: "Accept invitation",
    declineInvitation: "Decline invitation",
    approve: "Approve",
    decline: "Decline",
    back: "ย้อนกลับ",
    eyebrow: "ต้นแบบสำหรับการพัฒนาเท่านั้น",
    title: "จำลองบทบาท Quest",
    description:
      "สลับตัวตนตัวอย่างและดูการทำงานของ Quest เดียวกันในหน่วยความจำ",
    scenario: "สถานการณ์ที่เลือก",
    scenarioDescription:
      "หน้าจอนี้อ่านข้อมูลจากสัญญา roleplay fixture ที่เสถียร",
    state: "สถานะ Quest มาตรฐาน",
    activePersona: "ตัวตนที่ใช้งาน",
    personas: "สลับตัวตน",
    personasDescription: "แสดงเฉพาะตัวตนที่สถานการณ์ roleplay นี้รองรับ",
    applications: "ใบสมัคร Candidate",
    applicationId: "ใบสมัคร",
    applicant: "ผู้สมัคร",
    noApplications: "ไม่มีใบสมัคร Candidate",
    actions: "การกระทำที่อนุญาต",
    actionsDescription: "การกระทำมาจากความสามารถของตัวตนที่ใช้งาน",
    noActions: "ตัวตนนี้ไม่มีการกระทำที่ใช้งานได้ในขณะนี้",
    reset: "รีเซ็ตสถานะต้นแบบ",
    resetDescription: "คืนค่าข้อมูลตัวอย่างในหน่วยความจำให้เป็นค่าเริ่มต้น",
    resetFeedback: "รีเซ็ตสถานะต้นแบบแล้ว",
    switchedPersona: (label) => `เปลี่ยนตัวตนที่ใช้งานเป็น ${label} แล้ว`,
    actionSucceeded: (label, state) =>
      `${label} สำเร็จ สถานะ Quest คือ ${state}`,
    actionBlocked: (code) => `การกระทำถูกปฏิเสธโดยสัญญา fixture (${code})`,
    ineligible: "ตัวตนที่ใช้งานไม่มีสิทธิ์ทำการกระทำนี้",
    actionLabels: {
      APPLY: "สมัครเป็น Candidate",
      SELECT_CANDIDATE: "รับ",
      REJECT_CANDIDATE: "ปฏิเสธ",
      REJECT_TEAM: "ปฏิเสธ",
      CANCEL: "ยกเลิก Quest",
    },
    actionDescriptions: {
      APPLY: "ส่งใบสมัคร Candidate แบบรายบุคคล",
      SELECT_CANDIDATE: "รับ Candidate นี้เข้าร่วม Quest",
      REJECT_CANDIDATE: "ปฏิเสธใบสมัครของ Candidate นี้",
      CANCEL: "ยกเลิก Quest ที่เปิดอยู่และจบการจำลอง",
    },
  },
};

type Feedback = {
  kind: "success" | "error";
  message: string;
};

function getPersonaLabel(
  personaId: PrototypePersonaId,
  locale: "en" | "th"
): string {
  return (
    PROTOTYPE_PERSONAS.find((persona) => persona.id === personaId)?.label[
      locale
    ] ?? personaId
  );
}

function actionVariant(
  action: RoleplayActionType
): RoleplayActionButtonVariant {
  return action === "CANCEL" ||
    action === "REJECT_CANDIDATE" ||
    action === "REJECT_TEAM"
    ? "danger"
    : "primary";
}

function getActionLabel(
  messages: RoleplayMessages,
  action: RoleplayActionType
): string {
  return (
    messages.actionLabels[action] ??
    roleplayMessages.en.actionLabels[action] ??
    action
  );
}

function getActionDescription(
  messages: RoleplayMessages,
  action: RoleplayActionType
): string {
  return (
    messages.actionDescriptions[action] ??
    roleplayMessages.en.actionDescriptions[action] ??
    action
  );
}

function actionTestId(action: RoleplayAction): string {
  if (action.type === "SELECT_CANDIDATE")
    return `roleplay-action-select-${action.applicationId}`;
  if (action.type === "REJECT_CANDIDATE")
    return `roleplay-action-reject-${action.applicationId}`;
  if (action.type === "REJECT_TEAM")
    return `roleplay-action-reject-team-${action.teamId}`;
  return `roleplay-action-${action.type.toLowerCase().replaceAll("_", "-")}`;
}

export default function RoleplayScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const messages = roleplayMessages[locale];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)");
  };
  const [viewModel, setViewModel] = useState<RoleplayViewModel>(() =>
    roleplayMock.getViewModel()
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    return roleplayMock.subscribe(() => {
      setViewModel(roleplayMock.getViewModel());
    });
  }, []);

  const selectedScenario = ROLEPLAY_SCENARIOS.find(
    (scenario) => scenario.id === viewModel.scenario.id
  );
  const personaLabel = getPersonaLabel(viewModel.activePersonaId, locale);
  const availableActions = viewModel.visibleActions;
  const applications = viewModel.state.applications;
  const teams = viewModel.state.teams;
  const invitations = viewModel.state.invitations;

  const updateFromMock = () => {
    setViewModel(roleplayMock.getViewModel());
  };

  const handlePersonaChange = (personaId: PrototypePersonaId) => {
    const next = roleplayMock.setPersona(personaId);
    setViewModel(next);
    setFeedback({
      kind: "success",
      message: messages.switchedPersona(getPersonaLabel(personaId, locale)),
    });
  };

  const handleScenarioChange = (scenarioId: RoleplayScenarioId) => {
    const next = roleplayMock.setScenario(scenarioId);
    setViewModel(next);
    setFeedback(null);
  };

  const handleAction = (action: RoleplayAction) => {
    if (!availableActions.includes(action.type)) {
      setFeedback({ kind: "error", message: messages.ineligible });
      return;
    }

    const result = roleplayMock.dispatch(action);
    updateFromMock();
    if (result.ok) {
      setFeedback({
        kind: "success",
        message: messages.actionSucceeded(
          getActionLabel(messages, action.type),
          result.state.quest.status
        ),
      });
      return;
    }

    setFeedback({
      kind: "error",
      message: messages.actionBlocked(result.error.code),
    });
  };

  const handleReset = () => {
    const next = roleplayMock.reset();
    setViewModel(next);
    setFeedback({ kind: "success", message: messages.resetFeedback });
  };

  if (!__DEV__) return null;

  return (
    <SafeAreaView edges={["top", "left", "right"]} className={styles.safeArea}>
      <View className={styles.header}>
        <Pressable
          accessibilityLabel={messages.back}
          accessibilityRole="button"
          className={styles.backButton}
          onPress={handleBack}
          testID="roleplay-back"
        >
          <ChevronLeft color={colors.textStrong} size={22} strokeWidth={2.25} />
        </Pressable>
        <View className={styles.headerCopy}>
          <Text className={styles.eyebrow}>{messages.eyebrow}</Text>
          <Text accessibilityRole="header" className={styles.title}>
            {messages.title}
          </Text>
          <Text className={styles.description}>{messages.description}</Text>
        </View>
        <View className={styles.prototypeBadge}>
          <Text className={styles.prototypeBadgeText}>DEV</Text>
        </View>
      </View>

      <ScrollView
        className={styles.scroll}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xl),
        }}
        showsVerticalScrollIndicator={false}
        testID="roleplay-scroll"
      >
        <View className={styles.content} testID="roleplay-screen">
          <View className={styles.panel} testID="roleplay-scenarios">
            <Text className={styles.sectionTitle}>{messages.scenarios}</Text>
            <Text className={styles.sectionHint}>
              {messages.scenariosDescription}
            </Text>
            <View className={styles.scenarioList}>
              {ROLEPLAY_SCENARIOS.map((scenario) => {
                const selected = scenario.id === viewModel.scenario.id;

                return (
                  <Pressable
                    accessibilityLabel={scenario.label[locale]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    className={cn(
                      styles.scenarioOption,
                      selected && styles.scenarioOptionSelected
                    )}
                    key={scenario.id}
                    onPress={() => handleScenarioChange(scenario.id)}
                    testID={`roleplay-scenario-${scenario.id}`}
                  >
                    <View className={styles.scenarioOptionCopy}>
                      <Text className={styles.scenarioOptionLabel}>
                        {scenario.label[locale]}
                      </Text>
                      <Text className={styles.scenarioOptionMeta}>
                        {scenario.id}
                      </Text>
                    </View>
                    {selected ? (
                      <Check
                        accessible={false}
                        color={colors.primary}
                        size={20}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className={styles.panel} testID="roleplay-scenario">
            <Text className={styles.sectionTitle}>{messages.scenario}</Text>
            <Text className={styles.sectionHint}>
              {messages.scenarioDescription}
            </Text>
            <Text className={styles.scenarioLabel}>
              {selectedScenario?.label[locale] ?? viewModel.scenario.id}
            </Text>
            <Text className={styles.scenarioName}>{viewModel.scenario.id}</Text>
            <Text className={styles.scenarioRoute}>
              {viewModel.scenario.route}
            </Text>
          </View>

          <View className={styles.statusPanel} testID="roleplay-state">
            <Text className={styles.statusLabel}>{messages.state}</Text>
            <Text className={styles.statusValue}>
              {viewModel.state.quest.status}
            </Text>
            <Text className={styles.questTitle}>
              {viewModel.state.quest.title}
            </Text>
            <Text className={styles.questDescription}>
              {viewModel.state.quest.description}
            </Text>
            <View className={styles.statusMeta}>
              <Text className={styles.metaLabel}>{messages.activePersona}</Text>
              <Text className={styles.metaValue}>
                {personaLabel} ({viewModel.activePersonaId})
              </Text>
            </View>
          </View>

          <RoleplayPersonaSwitcher
            activePersonaId={viewModel.activePersonaId}
            description={messages.personasDescription}
            locale={locale}
            onPersonaChange={handlePersonaChange}
            title={messages.personas}
          />

          <View className={styles.panel} testID="roleplay-applications">
            <Text className={styles.sectionTitle}>{messages.applications}</Text>
            {applications.length === 0 ? (
              <View className={styles.empty}>
                <Text className={styles.emptyText}>
                  {messages.noApplications}
                </Text>
              </View>
            ) : (
              <View className={styles.applicationList}>
                {applications.map((application) => {
                  const isPending =
                    application.status === "APPLICATION_APPLIED";
                  const isTeamApplication = Boolean(application.teamId);
                  const canSelect =
                    !isTeamApplication &&
                    isPending &&
                    availableActions.includes("SELECT_CANDIDATE");
                  const canReject =
                    !isTeamApplication &&
                    isPending &&
                    availableActions.includes("REJECT_CANDIDATE");
                  const statusStyle =
                    application.status === "APPLICATION_SELECTED"
                      ? styles.applicationStatusSelected
                      : application.status === "APPLICATION_REJECTED"
                        ? styles.applicationStatusRejected
                        : styles.applicationStatusPending;

                  return (
                    <View
                      className={styles.application}
                      key={application.id}
                      testID={`roleplay-application-${application.id}`}
                    >
                      <View className={styles.applicationHeader}>
                        <View className={styles.applicationCopy}>
                          <Text className={styles.applicationId}>
                            {messages.applicationId}: {application.id}
                          </Text>
                          <Text className={styles.applicationApplicant}>
                            {messages.applicant}:{" "}
                            {application.applicantId ?? "-"}
                          </Text>
                        </View>
                        <Text
                          className={cn(styles.applicationStatus, statusStyle)}
                        >
                          {application.status}
                        </Text>
                      </View>
                      {canSelect || canReject ? (
                        <View className={styles.decisionActions}>
                          {canSelect ? (
                            <RoleplayActionButton
                              description={getActionDescription(
                                messages,
                                "SELECT_CANDIDATE"
                              )}
                              label={getActionLabel(
                                messages,
                                "SELECT_CANDIDATE"
                              )}
                              onPress={() =>
                                handleAction({
                                  type: "SELECT_CANDIDATE",
                                  applicationId: application.id,
                                })
                              }
                              compact
                              icon={
                                <Check
                                  accessible={false}
                                  color={colors.white}
                                  size={18}
                                  strokeWidth={2.7}
                                />
                              }
                              testID={`roleplay-action-select-${application.id}`}
                            />
                          ) : null}
                          {canReject ? (
                            <RoleplayActionButton
                              description={getActionDescription(
                                messages,
                                "REJECT_CANDIDATE"
                              )}
                              label={getActionLabel(
                                messages,
                                "REJECT_CANDIDATE"
                              )}
                              onPress={() =>
                                handleAction({
                                  type: "REJECT_CANDIDATE",
                                  applicationId: application.id,
                                })
                              }
                              testID={`roleplay-action-reject-${application.id}`}
                              compact
                              icon={
                                <CircleX
                                  accessible={false}
                                  color={colors.textSecondary}
                                  size={18}
                                  strokeWidth={2.3}
                                />
                              }
                              variant="neutral"
                            />
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {teams.length > 0 ? (
            <View className={styles.panel} testID="roleplay-teams">
              <Text className={styles.sectionTitle}>{messages.teams}</Text>
              <Text className={styles.sectionHint}>
                {messages.teamsDescription}
              </Text>
              <View className={styles.applicationList}>
                {teams.map((team) => {
                  const teamApplication = applications.find(
                    (application) => application.teamId === team.id
                  );
                  const canSelect =
                    team.status === QuestTeamStatus.TEAM_SUBMITTED &&
                    Boolean(teamApplication) &&
                    availableActions.includes("SELECT_CANDIDATE");
                  const canReject =
                    team.status === QuestTeamStatus.TEAM_SUBMITTED &&
                    availableActions.includes("REJECT_TEAM");

                  return (
                    <View
                      className={styles.application}
                      key={team.id}
                      testID={`roleplay-team-${team.id}`}
                    >
                      <View className={styles.applicationHeader}>
                        <View className={styles.applicationCopy}>
                          <Text className={styles.applicationId}>
                            {team.id}
                          </Text>
                          <Text className={styles.applicationApplicant}>
                            {messages.teamMembers}:{" "}
                            {team.members
                              .map((member) => member.workerId)
                              .join(", ")}
                          </Text>
                        </View>
                        <Text className={styles.applicationStatus}>
                          {team.status}
                        </Text>
                      </View>
                      {canSelect || canReject ? (
                        <View className={styles.decisionActions}>
                          {canSelect && teamApplication ? (
                            <RoleplayActionButton
                              description={getActionDescription(
                                messages,
                                "SELECT_CANDIDATE"
                              )}
                              label={messages.selectTeam}
                              onPress={() =>
                                handleAction({
                                  type: "SELECT_CANDIDATE",
                                  applicationId: teamApplication.id,
                                })
                              }
                              compact
                              icon={
                                <Check
                                  accessible={false}
                                  color={colors.white}
                                  size={18}
                                  strokeWidth={2.7}
                                />
                              }
                              testID={`roleplay-action-select-team-${team.id}`}
                            />
                          ) : null}
                          {canReject ? (
                            <RoleplayActionButton
                              description={getActionDescription(
                                messages,
                                "REJECT_TEAM"
                              )}
                              label={messages.rejectTeam}
                              onPress={() =>
                                handleAction({
                                  type: "REJECT_TEAM",
                                  teamId: team.id,
                                })
                              }
                              testID={`roleplay-action-reject-team-${team.id}`}
                              compact
                              icon={
                                <CircleX
                                  accessible={false}
                                  color={colors.textSecondary}
                                  size={18}
                                  strokeWidth={2.3}
                                />
                              }
                              variant="neutral"
                            />
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {invitations.length > 0 ? (
            <View className={styles.panel} testID="roleplay-invitations">
              <Text className={styles.sectionTitle}>
                {messages.invitations}
              </Text>
              <Text className={styles.sectionHint}>
                {messages.invitationDescription}
              </Text>
              <View className={styles.applicationList}>
                {invitations.map((invitation) => {
                  const canRespond =
                    availableActions.includes("RESPOND_INVITATION") &&
                    invitation.status === "INVITATION_PENDING";

                  return (
                    <View
                      className={styles.application}
                      key={invitation.id}
                      testID={`roleplay-invitation-${invitation.id}`}
                    >
                      <Text className={styles.applicationId}>
                        {invitation.id}
                      </Text>
                      {canRespond ? (
                        <View className={styles.applicationActions}>
                          <RoleplayActionButton
                            description={messages.invitationDescription}
                            label={messages.acceptInvitation}
                            onPress={() =>
                              handleAction({
                                type: "RESPOND_INVITATION",
                                invitationId: invitation.id,
                                accept: true,
                              })
                            }
                            testID={`roleplay-action-accept-invitation-${invitation.id}`}
                          />
                          <RoleplayActionButton
                            description={messages.invitationDescription}
                            label={messages.declineInvitation}
                            onPress={() =>
                              handleAction({
                                type: "RESPOND_INVITATION",
                                invitationId: invitation.id,
                                accept: false,
                              })
                            }
                            testID={`roleplay-action-decline-invitation-${invitation.id}`}
                            variant="danger"
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View className={styles.panel} testID="roleplay-actions">
            <Text className={styles.sectionTitle}>{messages.actions}</Text>
            <Text className={styles.sectionHint}>
              {messages.actionsDescription}
            </Text>
            {availableActions.length === 0 ? (
              <View className={styles.empty}>
                <Text className={styles.emptyText}>{messages.noActions}</Text>
              </View>
            ) : (
              <View className={styles.actionList}>
                {availableActions.map((action) => {
                  if (
                    action === "SELECT_CANDIDATE" ||
                    action === "REJECT_CANDIDATE" ||
                    action === "REJECT_TEAM" ||
                    action === "RESPOND_INVITATION"
                  )
                    return null;

                  if (action === "INVITE_WORKER") {
                    const workerId =
                      viewModel.activePersonaId === "student-demo"
                        ? "demo-worker-2"
                        : viewModel.activePersonaId === "demo-worker-2"
                          ? "student-demo"
                          : null;
                    if (!workerId) return null;

                    return (
                      <RoleplayActionButton
                        description={getActionDescription(messages, action)}
                        key={action}
                        label={`${getActionLabel(messages, action)} (${workerId})`}
                        onPress={() => handleAction({ type: action, workerId })}
                        testID={actionTestId({ type: action, workerId })}
                        variant={actionVariant(action)}
                      />
                    );
                  }

                  if (action === "VOTE_PARTIAL_GROUP_START_CONSENT") {
                    return (
                      <View className={styles.actionChoiceList} key={action}>
                        <RoleplayActionButton
                          description={getActionDescription(messages, action)}
                          label={messages.approve}
                          onPress={() =>
                            handleAction({
                              type: action,
                              approve: true,
                            })
                          }
                          testID="roleplay-action-partial-start-approve"
                        />
                        <RoleplayActionButton
                          description={getActionDescription(messages, action)}
                          label={messages.decline}
                          onPress={() =>
                            handleAction({
                              type: action,
                              approve: false,
                            })
                          }
                          testID="roleplay-action-partial-start-decline"
                          variant="danger"
                        />
                      </View>
                    );
                  }

                  return (
                    <RoleplayActionButton
                      description={getActionDescription(messages, action)}
                      key={action}
                      label={getActionLabel(messages, action)}
                      onPress={() => handleAction({ type: action })}
                      testID={actionTestId({ type: action })}
                      variant={actionVariant(action)}
                    />
                  );
                })}
              </View>
            )}
          </View>

          {feedback ? (
            <View
              accessibilityRole="alert"
              className={cn(
                styles.feedback,
                feedback.kind === "error" && styles.feedbackError
              )}
              testID="roleplay-feedback"
            >
              <View
                className={cn(
                  styles.feedbackIcon,
                  feedback.kind === "error"
                    ? styles.feedbackIconError
                    : styles.feedbackIconSuccess
                )}
              >
                {feedback.kind === "error" ? (
                  <CircleAlert
                    color={colors.danger}
                    size={20}
                    strokeWidth={2.2}
                  />
                ) : (
                  <Check color={colors.success} size={20} strokeWidth={2.5} />
                )}
              </View>
              <View className={styles.feedbackCopy}>
                <Text className={styles.feedbackLabel}>{messages.state}</Text>
                <Text className={styles.feedbackMessage}>
                  {feedback.message}
                </Text>
              </View>
            </View>
          ) : null}

          <View className={styles.panel}>
            <Text className={styles.sectionTitle}>{messages.reset}</Text>
            <Text className={styles.sectionHint}>
              {messages.resetDescription}
            </Text>
            <Pressable
              accessibilityLabel={messages.reset}
              accessibilityRole="button"
              className={styles.resetButton}
              onPress={handleReset}
              testID="roleplay-reset"
            >
              <RefreshCw color={colors.primary} size={18} strokeWidth={2.2} />
              <Text className={styles.resetButtonText}>{messages.reset}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
