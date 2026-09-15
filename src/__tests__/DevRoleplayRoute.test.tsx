import { render } from "@testing-library/react-native";

import DevRoleplayRoute from "@/app/dev/roleplay";

const mockRedirect = jest.fn();
const mockRoleplayScreen = jest.fn();

jest.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => {
    mockRedirect(href);
    return null;
  },
}));

jest.mock("@/features/roleplay/RoleplayScreen", () => ({
  __esModule: true,
  default: () => {
    mockRoleplayScreen();
    return null;
  },
}));

const devFlag = globalThis as typeof globalThis & { __DEV__?: boolean };
const initialDevFlag = devFlag.__DEV__;

describe("dev roleplay route", () => {
  afterEach(() => {
    if (initialDevFlag === undefined) delete devFlag.__DEV__;
    else devFlag.__DEV__ = initialDevFlag;
    jest.clearAllMocks();
  });

  it("composes the roleplay screen in development", async () => {
    devFlag.__DEV__ = true;

    await render(<DevRoleplayRoute />);

    expect(mockRoleplayScreen).toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("keeps the mock unreachable outside development", async () => {
    devFlag.__DEV__ = false;

    await render(<DevRoleplayRoute />);

    expect(mockRoleplayScreen).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });
});
