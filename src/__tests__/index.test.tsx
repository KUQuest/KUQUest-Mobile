import { render } from "@testing-library/react-native";

import Index from "../app/index";

it("renders without crashing", () => {
  expect(() => render(<Index />)).not.toThrow();
});
