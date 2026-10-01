import { resetServerClock, serverNow, syncServerClock } from "../serverClock";

describe("server clock", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
    resetServerClock();
  });

  afterEach(() => {
    resetServerClock();
    jest.useRealTimers();
  });

  test("uses the HTTP Date header to offset device time", () => {
    syncServerClock("Wed, 01 Oct 2026 00:01:00 GMT", null);

    expect(serverNow()).toBe(Date.parse("2026-10-01T00:01:00.000Z"));
  });

  test("ignores cached and invalid server timestamps", () => {
    syncServerClock("Wed, 01 Oct 2026 00:01:00 GMT", "30");
    expect(serverNow()).toBe(Date.parse("2026-10-01T00:00:00.000Z"));

    syncServerClock("not a date", null);
    expect(serverNow()).toBe(Date.parse("2026-10-01T00:00:00.000Z"));
  });
});
