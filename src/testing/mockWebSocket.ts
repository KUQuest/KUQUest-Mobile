/** Test adapter for `globalThis.WebSocket`; see `installMockWebSocket`. */
export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static readonly OPEN = 1;
  static readonly CLOSED = 3;

  readonly close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
  });
  readonly send = jest.fn();
  readyState = 0;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onopen: (() => void) | null = null;

  constructor(
    readonly url: string,
    readonly protocols?: string | string[] | null,
    readonly options?: { headers?: Record<string, string> }
  ) {
    MockWebSocket.instances.push(this);
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  receive(data: unknown) {
    this.onmessage?.({ data });
  }

  disconnect(code = 1006, reason = "network closed") {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason });
  }
}

/** Replaces `globalThis.WebSocket`; returns a restore function. */
export function installMockWebSocket(): () => void {
  const original = globalThis.WebSocket;
  MockWebSocket.instances = [];
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    value: MockWebSocket,
  });
  return () =>
    Object.defineProperty(globalThis, "WebSocket", {
      configurable: true,
      value: original,
    });
}
