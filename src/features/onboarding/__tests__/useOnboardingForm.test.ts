import { act, renderHook } from "@testing-library/react-native";

import { onboardingMessages } from "../../../locales/registrationOnboarding";
import { createEmptyProfile, type ProfileDraft } from "../../profile/types";
import { useOnboardingForm } from "../useOnboardingForm";

function createForm(name: string): ProfileDraft {
  return { ...createEmptyProfile(), name };
}

describe("useOnboardingForm hydration", () => {
  it("keeps an edit when the server snapshot changes", async () => {
    const initialForm = createForm("Server Name");
    const refetchedForm = createForm("Refetched Name");
    const { result, rerender } = await renderHook(
      ({ serverForm }: { serverForm: ProfileDraft }) =>
        useOnboardingForm({
          serverForm,
          isEditMode: true,
          messages: onboardingMessages.en,
          onMarkCertificateDeleted: jest.fn(),
          onMarkExperienceDeleted: jest.fn(),
          onMarkPortfolioDeleted: jest.fn(),
        }),
      { initialProps: { serverForm: initialForm } }
    );

    expect(result.current.form.name).toBe("Server Name");
    expect(result.current.hydrationState).toBe("hydrated");

    await act(async () => {
      result.current.updateField("name", "Edited Name");
    });
    expect(result.current.form.name).toBe("Edited Name");

    await rerender({ serverForm: refetchedForm });

    expect(result.current.form.name).toBe("Edited Name");
    expect(result.current.hydrationState).toBe("editing");

    await act(async () => {
      result.current.resetToServer();
    });

    expect(result.current.form.name).toBe("Refetched Name");
    expect(result.current.hydrationState).toBe("hydrated");
  });
});
