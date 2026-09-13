import { render } from "@testing-library/react-native";

import Index from "./index";

it("renders without crashing", () => {
  expect(() => render(<Index />)).not.toThrow();
});
