import { screen, waitFor } from "@testing-library/react-native";

import Index from "@/app/index";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

it("renders without crashing", async () => {
  await renderWithQueryClient(<Index />);

  await waitFor(() => {
    expect(screen.getByTestId("signin-button")).toBeTruthy();
  });
});
