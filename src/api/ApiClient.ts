import { fetch as expoFetch } from 'expo/fetch';
import { authClient } from '../features/auth/authClient';

export interface ApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  cookieProvider?: () => string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function normalizeBaseUrl(baseUrl: string | undefined): string | undefined {
  return baseUrl?.replace(/\/$/, '');
}

function isFormDataBody(body: BodyInit | null | undefined): boolean {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function toHeaderRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return Object.fromEntries(Object.entries(headers));
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  return Object.keys(headers).some((header) => header.toLowerCase() === name.toLowerCase());
}

export class ApiClient {
  private readonly baseUrl?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly cookieProvider: () => string;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? process.env.EXPO_PUBLIC_API_URL);
    this.fetchImpl = options.fetchImpl ?? expoFetch;
    this.cookieProvider = options.cookieProvider ?? (() => authClient.getCookie());
  }

  async request<T>(pathOrUrl: string, init: RequestInit = {}): Promise<T> {
    const url = this.resolveUrl(pathOrUrl);
    const headers = toHeaderRecord(init.headers);

    if (init.body !== undefined && !isFormDataBody(init.body) && !hasHeader(headers, 'Content-Type')) {
      headers['Content-Type'] = 'application/json';
    }
    const cookie = this.cookieProvider();
    if (cookie && !hasHeader(headers, 'Cookie')) {
      headers.Cookie = cookie;
    }

    const response = await this.fetchImpl(url, {
      ...init,
      method: init.method ?? 'GET',
      credentials: 'omit',
      headers,
    });

    const rawBody = response.status === 204 ? '' : await response.text();
    const body = rawBody ? this.parseBody(rawBody) : undefined;

    if (!response.ok) {
      const error = body && typeof body === 'object' ? body as Record<string, unknown> : {};
      const nestedError = error.error && typeof error.error === 'object'
        ? error.error as Record<string, unknown>
        : error;
      throw new ApiError(
        response.status,
        typeof nestedError.code === 'string' ? nestedError.code : `HTTP_${response.status}`,
        typeof nestedError.message === 'string' ? nestedError.message : 'Request failed'
      );
    }

    return body as T;
  }

  async requestJson<T>(pathOrUrl: string, body: unknown, init: Omit<RequestInit, 'body'> = {}): Promise<T> {
    return await this.request<T>(pathOrUrl, {
      ...init,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...toHeaderRecord(init.headers),
      },
    });
  }

  async requestForm<T>(pathOrUrl: string, formData: FormData, init: Omit<RequestInit, 'body'> = {}): Promise<T> {
    return await this.request<T>(pathOrUrl, {
      ...init,
      body: formData,
    });
  }

  private resolveUrl(pathOrUrl: string): string {
    if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
    if (!this.baseUrl) {
      throw new ApiError(0, 'API_NOT_CONFIGURED', 'EXPO_PUBLIC_API_URL is not configured');
    }
    return `${this.baseUrl}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
  }

  private parseBody(rawBody: string): unknown {
    try {
      return JSON.parse(rawBody) as unknown;
    } catch {
      return { message: rawBody };
    }
  }
}
