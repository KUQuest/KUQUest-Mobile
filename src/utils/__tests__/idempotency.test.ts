import { createIdempotencyKey } from "../idempotency";

describe("idempotency utils — createIdempotencyKey", () => {
  it("generates a key with the default 'mobile' prefix", () => {
    const key = createIdempotencyKey();
    expect(key.startsWith("mobile-")).toBe(true);
    expect(key.length).toBeGreaterThan(10);
  });

  it("generates a key with custom prefix", () => {
    const key = createIdempotencyKey("quest");
    expect(key.startsWith("quest-")).toBe(true);
  });

  it("generates unique keys on successive calls", () => {
    const key1 = createIdempotencyKey();
    const key2 = createIdempotencyKey();
    expect(key1).not.toBe(key2);
  });
});
