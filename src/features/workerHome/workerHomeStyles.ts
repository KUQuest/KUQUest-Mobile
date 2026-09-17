import { StyleSheet } from "react-native";
import { fontFamily } from "@/theme/typography";

export const workerHomeStyles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  screenHeader: {
    paddingHorizontal: 4,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  roleBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 18,
  },
  switchRoleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 34,
    gap: 6,
  },
  switchRoleText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  screenTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    lineHeight: 34,
  },
  screenSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    height: "100%",
    paddingVertical: 0,
  },
  filterIconButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // Quick Tag Filter Row
  tagFilterScrollView: {
    marginBottom: 14,
  },
  tagFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
  },
  tagPill: {
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
  },
  tagPillText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },

  // Grab-like Quick Access Bar (floating bottom ongoing work tracker)
  quickAccessFloatingContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 50,
  },
  quickAccessTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickAccessLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  quickAccessIndicator: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 10,
  },
  quickAccessTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  quickAccessSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  quickAccessProgressBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 8,
    width: "100%",
    overflow: "hidden",
  },
  quickAccessProgressFill: {
    height: "100%",
    borderRadius: 2,
    width: "70%",
  },

  // Stats Grid
  statsContainer: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
  },
  statLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: "70%",
    alignSelf: "center",
  },

  // Sections
  sectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  sectionSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },

  // Assignment & Feed Cards
  cardList: {
    gap: 12,
    marginBottom: 24,
  },
  assignmentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
    marginRight: 8,
  },
  badgePill: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 16,
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  cardMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardMetaText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  actionButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },

  // Feed Card (Quest A, Quest B)
  feedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  feedCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  feedRewardText: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    lineHeight: 24,
  },
  tagChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  tagText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 15,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 160,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 20,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },
  emptyDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: "center",
  },
  emptyActionBtn: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 14,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyActionBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },

  // Error State
  errorState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  retryText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },

  // Work Management: Current Quest Card
  currentQuestCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  currentQuestTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  currentQuestLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentQuestBody: {
    flexDirection: "row",
    gap: 12,
  },
  currentQuestLeft: {
    flex: 1.2,
    justifyContent: "space-between",
  },
  currentQuestRight: {
    flex: 0.9,
    borderLeftWidth: 1,
    paddingLeft: 12,
    justifyContent: "center",
  },
  hirerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  hirerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  hirerName: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  timelineTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  timelineStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 3,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  timelineStepText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 15,
  },

  // No Work Prompt Card
  noWorkPromptCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    marginBottom: 18,
  },
  noWorkIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  noWorkTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  noWorkDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: "center",
  },
  findQuestsBtn: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 14,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  findQuestsBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },

  // Tabs Row
  managementTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  tabsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  managementTabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 6,
    minHeight: 36,
  },
  managementTabText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  tabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: "700",
  },
  refreshIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Working Now Floating Bar (bottom above nav)
  workingNowBar: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 50,
  },
  workingNowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  workingNowTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  workingNowElapsed: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
