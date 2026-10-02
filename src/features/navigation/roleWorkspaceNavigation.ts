import type { LucideIcon } from "lucide-react-native";

import { RoleWorkspace } from "@/features/workspace/roleWorkspaceStore";
import type { SupportedLocale } from "@/locales/locale";
import { navigationMessages } from "@/locales/navigationMessages";

const navigationHomeIcon = require("@/assets/icons/navigation-home.svg");
const navigationWalletIcon = require("@/assets/icons/navigation-wallet.svg");
const navigationProfileIcon = require("@/assets/icons/navigation-profile.svg");
const navigationCreateIcon = require("@/assets/icons/navigation-create.svg");
const navigationChatIcon = require("@/assets/icons/navigation-chat.svg");
const navigationWorkIcon = require("@/assets/icons/navigation-work.svg");

type NavigationAsset = number;
type NavigationIcon = LucideIcon;

export type NavigationItem = {
  routeName: string;
  labelKey:
    "board" | "money" | "create" | "workManagement" | "chat" | "profile";
  icon?: NavigationIcon;
  asset?: NavigationAsset;
  isCreate?: boolean;
  hasUnread?: boolean;
};

const baseNavigationItems = {
  home: {
    routeName: "index",
    labelKey: "board",
    asset: navigationHomeIcon,
  },
  money: {
    routeName: "money",
    labelKey: "money",
    asset: navigationWalletIcon,
  },
  chat: {
    routeName: "chat",
    labelKey: "chat",
    asset: navigationChatIcon,
  },
  profile: {
    routeName: "profile",
    labelKey: "profile",
    asset: navigationProfileIcon,
  },
} satisfies Record<string, NavigationItem>;

export const hirerNavigationItems: readonly NavigationItem[] = [
  baseNavigationItems.home,
  baseNavigationItems.money,
  {
    routeName: "create",
    labelKey: "create",
    asset: navigationCreateIcon,
    isCreate: true,
  },
  baseNavigationItems.chat,
  baseNavigationItems.profile,
];

export const workerNavigationItems: readonly NavigationItem[] = [
  baseNavigationItems.home,
  baseNavigationItems.money,
  {
    routeName: "my-quests",
    labelKey: "workManagement",
    asset: navigationWorkIcon,
    isCreate: true,
  },
  baseNavigationItems.chat,
  baseNavigationItems.profile,
];

export function getRoleWorkspaceNavigation(
  workspace: RoleWorkspace
): readonly NavigationItem[] {
  return workspace === RoleWorkspace.WORKER
    ? workerNavigationItems
    : hirerNavigationItems;
}

export function getRoleWorkspaceAccessibilityLabel(
  workspace: RoleWorkspace,
  locale: SupportedLocale
): string {
  const messages = navigationMessages[locale];
  return workspace === RoleWorkspace.WORKER
    ? messages.workerWorkspace
    : messages.hirerWorkspace;
}
