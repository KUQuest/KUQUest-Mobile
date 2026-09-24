import React from "react";

import { Check, CircleX, Mail, Search } from "lucide-react-native";

import { Pressable, Text, TextInput, View } from "@/tw";
import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { TeamDirectoryMember } from "../types";

import styles from "../groupQuestStyles";

export interface TeamAssembleMemberPickerMessages {
  searchMembers: string;
  searchMembersHint: string;
  clearSearch: string;
  noEligibleMembers: string;
  noSearchResults: string;
  invite: string;
  inviteSelected: (count: number) => string;
}

export interface TeamAssembleMemberPickerProps {
  members: readonly TeamDirectoryMember[];
  eligibleMemberCount: number;
  selectedIds: readonly string[];
  query: string;
  acceptedCount: number;
  requiredHeadcount: number;
  messages: TeamAssembleMemberPickerMessages;
  onQueryChange: (query: string) => void;
  onToggle: (memberId: string) => void;
  onInvite: (memberIds: readonly string[]) => void;
  memberId: (member: TeamDirectoryMember) => string;
}

function initialsFor(value: string): string {
  const words = value
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function TeamAssembleMemberPicker({
  members,
  eligibleMemberCount,
  selectedIds,
  query,
  acceptedCount,
  requiredHeadcount,
  messages,
  onQueryChange,
  onToggle,
  onInvite,
  memberId,
}: TeamAssembleMemberPickerProps) {
  const { colors } = useAppTheme();
  return (
    <View className={styles.section}>
      <Text accessibilityRole="header" className={styles.sectionTitle}>
        {messages.searchMembers}
      </Text>
      <Text className={styles.helper}>{messages.searchMembersHint}</Text>
      <View className={styles.searchField}>
        <Search color={colors.textSecondary} size={20} strokeWidth={2.1} />
        <TextInput
          accessibilityLabel={messages.searchMembersHint}
          accessibilityRole="search"
          autoCapitalize="none"
          autoCorrect={false}
          className={styles.searchInput}
          onChangeText={onQueryChange}
          placeholder={messages.searchMembersHint}
          placeholderTextColor={colors.textFaint}
          testID="team-assemble-member-search"
          value={query}
        />
        {query ? (
          <Pressable
            accessibilityLabel={messages.clearSearch}
            accessibilityRole="button"
            className={styles.searchClear}
            onPress={() => onQueryChange("")}
            testID="team-assemble-clear-search"
          >
            <CircleX color={colors.textMuted} size={18} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
      {members.length === 0 && eligibleMemberCount === 0 ? (
        <View
          className={styles.emptyState}
          testID="team-assemble-members-empty"
        >
          <View className={styles.emptyIcon}>
            <Mail color={colors.primary} size={24} strokeWidth={1.9} />
          </View>
          <Text className={styles.emptyTitle}>
            {messages.noEligibleMembers}
          </Text>
        </View>
      ) : members.length === 0 ? (
        <View className={styles.emptyState} testID="team-assemble-search-empty">
          <Text className={styles.emptyTitle}>{messages.noSearchResults}</Text>
        </View>
      ) : (
        <View className={styles.memberList}>
          {members.map((member) => {
            const id = memberId(member);
            const selected = selectedIds.includes(id);
            const handle =
              member.email ??
              member.kuEmail ??
              member.handle ??
              member.workerId ??
              member.id;
            return (
              <View
                className={`${styles.memberRow} ${selected ? styles.memberRowSelected : ""}`}
                key={id}
              >
                <Pressable
                  accessibilityLabel={`${member.displayName}. ${handle}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  className={styles.memberSelect}
                  onPress={() => onToggle(id)}
                  testID={`team-assemble-select-member-${id}`}
                >
                  <View
                    className={`${styles.memberSelectionBox} ${selected ? styles.memberSelectionBoxSelected : ""}`}
                  >
                    {selected ? (
                      <Check
                        color={colors.onPrimary}
                        size={15}
                        strokeWidth={3}
                      />
                    ) : null}
                  </View>
                  <View className={styles.memberAvatar}>
                    <Text className={styles.memberAvatarText}>
                      {initialsFor(member.displayName)}
                    </Text>
                  </View>
                  <View className={styles.memberCopy}>
                    <Text className={styles.memberName} numberOfLines={1}>
                      {member.displayName}
                    </Text>
                    <Text className={styles.memberHandle} numberOfLines={1}>
                      {handle}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityLabel={`${messages.invite}: ${member.displayName}`}
                  accessibilityRole="button"
                  className={styles.memberInvite}
                  disabled={acceptedCount >= requiredHeadcount}
                  onPress={() => onInvite([id])}
                  testID={`team-assemble-invite-member-${id}`}
                >
                  <Text className={styles.memberInviteText}>
                    {messages.invite}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
      {selectedIds.length > 0 ? (
        <View
          className={styles.bulkInviteBar}
          testID="team-assemble-bulk-invite"
        >
          <View className={styles.bulkInviteCopy}>
            <Text className={styles.bulkInviteText}>
              {messages.inviteSelected(selectedIds.length)}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={messages.inviteSelected(selectedIds.length)}
            accessibilityRole="button"
            className={styles.bulkInviteButton}
            onPress={() => onInvite(selectedIds)}
            testID="team-assemble-invite-selected"
          >
            <Text className={styles.bulkInviteButtonText}>
              {messages.inviteSelected(selectedIds.length)}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
