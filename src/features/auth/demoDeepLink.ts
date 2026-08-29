import * as Linking from 'expo-linking';

import { isPrototypeScenarioRoute, type PrototypeScenarioRoute } from '@/components/ui/prototypeMenuData';

function normalizeSegment(value: string | null | undefined): string {
  return value?.replace(/^\/+|\/+$/g, '') ?? '';
}

/**
 * Return a route-addressable prototype scenario from a launch URL.
 *
 * Android accepts both `scheme:///quest/id` and `scheme://quest/id`.
 * In the latter form `quest` is parsed as the URL hostname, so both URL
 * components must be considered before validating the route.
 */
export function parsePrototypeDeepLink(url: string | null | undefined): PrototypeScenarioRoute | undefined {
  if (!url?.trim()) return undefined;

  try {
    const parsed = new URL(url);
    const route = [normalizeSegment(parsed.hostname), normalizeSegment(parsed.pathname)]
      .filter(Boolean)
      .join('/');
    const routePath = route ? `/${decodeURIComponent(route)}` : undefined;
    if (routePath && isPrototypeScenarioRoute(routePath)) return routePath;

    // Expo Development Client may wrap a launch URL in its `url` query
    // parameter. Only recurse for that known wrapper and only once.
    if (parsed.hostname === 'expo-development-client') {
      return parsePrototypeDeepLink(parsed.searchParams.get('url'));
    }
  } catch {
    // A malformed external URL must not affect the auth/bootstrap path.
  }

  return undefined;
}

export async function getInitialPrototypeDeepLink(): Promise<PrototypeScenarioRoute | undefined> {
  if (!__DEV__) return undefined;

  try {
    const linkingUrl = Linking.getLinkingURL();
    const routeFromLinkingUrl = parsePrototypeDeepLink(linkingUrl);
    if (routeFromLinkingUrl) return routeFromLinkingUrl;
  } catch {
    // Fall through to React Native's initial URL API.
  }

  try {
    return parsePrototypeDeepLink(await Linking.getInitialURL());
  } catch {
    return undefined;
  }
}

export function subscribeToPrototypeDeepLinks(onRoute: (route: PrototypeScenarioRoute) => void): () => void {
  if (!__DEV__) return () => undefined;

  try {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const route = parsePrototypeDeepLink(url);
      if (route) onRoute(route);
    });
    return () => subscription.remove();
  } catch {
    return () => undefined;
  }
}
