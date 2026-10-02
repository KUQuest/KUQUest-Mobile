import { getRouteParam, goBackOrReplace, routeValue } from "../navigation";

describe("navigation utils — getRouteParam", () => {
  it("returns a string value as is", () => {
    expect(getRouteParam("quest-123")).toBe("quest-123");
  });

  it("extracts the first element from a string array", () => {
    expect(getRouteParam(["first-id", "second-id"])).toBe("first-id");
  });

  it("converts finite numbers to strings", () => {
    expect(getRouteParam(42)).toBe("42");
    expect(getRouteParam(0)).toBe("0");
  });

  it("handles nested single-element arrays recursively", () => {
    expect(getRouteParam([["nested-id"]])).toBe("nested-id");
  });

  it("returns undefined for undefined or null inputs", () => {
    expect(getRouteParam(undefined)).toBeUndefined();
    expect(getRouteParam(null)).toBeUndefined();
  });

  it("returns undefined for empty strings or empty arrays", () => {
    expect(getRouteParam("")).toBeUndefined();
    expect(getRouteParam([])).toBeUndefined();
  });

  it("returns undefined for NaN or infinite numbers", () => {
    expect(getRouteParam(Number.NaN)).toBeUndefined();
    expect(getRouteParam(Number.POSITIVE_INFINITY)).toBeUndefined();
  });

  it("ensures routeValue behaves identically as an alias", () => {
    expect(routeValue("abc")).toBe("abc");
    expect(routeValue(["abc"])).toBe("abc");
    expect(routeValue(undefined)).toBeUndefined();
  });
});

describe("navigation utils — goBackOrReplace", () => {
  const makeRouter = (canGoBack: boolean) => ({
    canGoBack: jest.fn(() => canGoBack),
    back: jest.fn(),
    replace: jest.fn(),
  });

  it("goBackOrReplace goes back when history exists", () => {
    const router = makeRouter(true);
    goBackOrReplace(router, "/(tabs)");
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("goBackOrReplace replaces with the fallback when there is no history", () => {
    const router = makeRouter(false);
    goBackOrReplace(router, "/(tabs)/money");
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/money");
    expect(router.back).not.toHaveBeenCalled();
  });
});
