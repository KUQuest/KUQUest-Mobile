import { act, renderHook } from "@testing-library/react-native";

import { useOnboardingDatePicker } from "../useOnboardingDatePicker";

describe("useOnboardingDatePicker", () => {
  it("keeps certificate day and normalizes experience selection to month", async () => {
    const onCertificateDate = jest.fn();
    const onExperienceDate = jest.fn();
    const { result } = await renderHook(() =>
      useOnboardingDatePicker({ onCertificateDate, onExperienceDate })
    );

    await act(async () => {
      result.current.openCertificate(0, "2024-02-29");
    });
    await act(async () => {
      result.current.handleDate("2024-03-18");
    });
    expect(onCertificateDate).toHaveBeenCalledWith(0, "2024-03-18");

    await act(async () => {
      result.current.openExperience(1, "startedAt", "2023-01-01");
    });
    await act(async () => {
      result.current.handleDate("2024-03-18");
    });
    expect(onExperienceDate).toHaveBeenCalledWith(1, "startedAt", "2024-03-01");
  });

  it("does not commit a date when picker closes", async () => {
    const onCertificateDate = jest.fn();
    const onExperienceDate = jest.fn();
    const { result } = await renderHook(() =>
      useOnboardingDatePicker({ onCertificateDate, onExperienceDate })
    );

    await act(async () => {
      result.current.openCertificate(0, "2024-02-29");
      result.current.close();
    });

    expect(onCertificateDate).not.toHaveBeenCalled();
    expect(onExperienceDate).not.toHaveBeenCalled();
  });
});
