import { render, screen, waitFor } from "@testing-library/react-native";

import Index from "@/app/index";

it("renders without crashing", async () => {
  render(<Index />);

  await waitFor(() => {
    expect(screen.getByTestId("signin-button")).toBeTruthy();
  });
});
