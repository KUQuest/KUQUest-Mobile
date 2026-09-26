import { fetch as expoFetch } from "expo/fetch";
import { z } from "zod";
import { authClient } from "../features/auth/authClient";
import { debugLog, errorDetails } from "./debugLog";

export interface ApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  cookieProvider?: () => string;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export type QueryValue = string | number | boolean | null | undefined;

export interface CallOptions extends RequestOptions {
  /** Appended to the path; `null`, `undefined`, and `""` are omitted, `0` and `false` are sent. */
  query?: Record<string, QueryValue>;
  /** Sent as the `idempotency-key` header; must be non-blank and at most 200 characters. */
  idempotencyKey?: string;
  /** Extra request headers such as `If-Match`. */
  headers?: Record<string, string>;
}

export interface SendOptions extends CallOptions {
  /** JSON request body. */
  json?: unknown;
  /** Multipart request body; takes precedence over `json`. */
  form?: FormData;
}

export type MutationMethod = "POST" | "PUT" | "PATCH" | "DELETE";

const MAX_IDEMPOTENCY_KEY_LENGTH = 200;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function normalizeBaseUrl(baseUrl: string | undefined): string | undefined {
  return baseUrl?.replace(/\/$/, "");
}

function isFormDataBody(body: BodyInit | null | undefined): boolean {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function toHeaderRecord(
  headers: HeadersInit | undefined
): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return Object.fromEntries(Object.entries(headers));
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  return Object.keys(headers).some(
    (header) => header.toLowerCase() === name.toLowerCase()
  );
}
function safeLogPath(pathOrUrl: string): string {
  if (!/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  const { origin, pathname } = new URL(pathOrUrl);
  return `${origin}${pathname}`;
}

function withQuery(path: string, query: CallOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(name, String(value));
  }
  const search = params.toString();
  if (!search) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${search}`;
}

function callHeaders(options: CallOptions): Record<string, string> {
  const headers = { ...options.headers };
  const key = options.idempotencyKey;
  if (key === undefined) return headers;
  if (key.trim().length === 0) {
    throw new Error("Idempotency keys must be non-blank");
  }
  if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    throw new Error(
      `Idempotency keys must be at most ${MAX_IDEMPOTENCY_KEY_LENGTH} characters`
    );
  }
  headers["idempotency-key"] = key;
  return headers;
}

export class ApiClient {
  private readonly baseUrl?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly cookieProvider: () => string;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(
      options.baseUrl ?? process.env.EXPO_PUBLIC_API_URL
    );
    this.fetchImpl = options.fetchImpl ?? expoFetch;
    this.cookieProvider =
      options.cookieProvider ?? (() => authClient.getCookie());
  }

  /**
   * GETs `path` and returns the validated `data` of the Server's
   * `{ success: true, data }` envelope.
   * Throws `ApiError` for non-2xx responses and `ZodError` when the body
   * does not match `data`.
   */
  get<S extends z.ZodTypeAny>(
    path: string,
    data: S,
    options: CallOptions = {}
  ): Promise<z.output<S>> {
    return this.call("GET", path, data, options, undefined);
  }

  /**
   * Sends a mutation and returns the validated envelope `data`, with the same
   * error modes as `get`. Pass `z.unknown()` when the endpoint returns no data.
   */
  send<S extends z.ZodTypeAny>(
    method: MutationMethod,
    path: string,
    data: S,
    options: SendOptions = {}
  ): Promise<z.output<S>> {
    const body =
      options.form ??
      (options.json === undefined ? undefined : JSON.stringify(options.json));
    return this.call(method, path, data, options, body);
  }

  private async call<S extends z.ZodTypeAny>(
    method: "GET" | MutationMethod,
    path: string,
    data: S,
    options: CallOptions,
    body: BodyInit | undefined
  ): Promise<z.output<S>> {
    const url = withQuery(path, options.query);
    const raw = await this.request(url, {
      method,
      body,
      headers: callHeaders(options),
      signal: options.signal,
    });
    const parsed = z.object({ success: z.literal(true), data }).safeParse(raw);
    if (!parsed.success) {
      debugLog(
        "api",
        `${method} ${safeLogPath(url)} response does not match contract`,
        errorDetails(parsed.error)
      );
      throw parsed.error;
    }
    return parsed.data.data;
  }

  private async request(
    pathOrUrl: string,
    init: RequestInit
  ): Promise<unknown> {
    const url = this.resolveUrl(pathOrUrl);
    const headers = toHeaderRecord(init.headers);

    if (
      init.body !== undefined &&
      !isFormDataBody(init.body) &&
      !hasHeader(headers, "Content-Type")
    ) {
      headers["Content-Type"] = "application/json";
    }
    const method = init.method ?? "GET";
    const logPath = safeLogPath(pathOrUrl);
    const startedAt = Date.now();
    const cookie = this.cookieProvider();
    if (cookie && !hasHeader(headers, "Cookie")) {
      headers.Cookie = cookie;
    }

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        ...init,
        method,
        credentials: "omit",
        headers,
      });
    } catch (error) {
      debugLog(
        "api",
        `${method} ${logPath} failed (${Date.now() - startedAt}ms)`,
        errorDetails(error)
      );
      throw error;
    }

    const rawBody = response.status === 204 ? "" : await response.text();
    const body = rawBody ? this.parseBody(rawBody) : undefined;
    if (!response.ok) {
      const error =
        body && typeof body === "object"
          ? (body as Record<string, unknown>)
          : {};
      const nestedError =
        error.error && typeof error.error === "object"
          ? (error.error as Record<string, unknown>)
          : error;
      const apiError = new ApiError(
        response.status,
        typeof nestedError.code === "string"
          ? nestedError.code
          : `HTTP_${response.status}`,
        typeof nestedError.message === "string"
          ? nestedError.message
          : "Request failed"
      );
      debugLog(
        "api",
        `${method} ${logPath} -> ${response.status} (${Date.now() - startedAt}ms)`,
        { code: apiError.code }
      );
      throw apiError;
    }
    debugLog(
      "api",
      `${method} ${logPath} -> ${response.status} (${Date.now() - startedAt}ms)`
    );
    return body;
  }

  private resolveUrl(pathOrUrl: string): string {
    if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
    if (!this.baseUrl) {
      throw new ApiError(
        0,
        "API_NOT_CONFIGURED",
        "EXPO_PUBLIC_API_URL is not configured"
      );
    }
    return `${this.baseUrl}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  }

  private parseBody(rawBody: string): unknown {
    try {
      return JSON.parse(rawBody) as unknown;
    } catch {
      return { message: rawBody };
    }
  }
}
