# API Contract Boundary

The mobile app treats `api-1.yaml` and the backend's canonical Academic Registration, Profile, Portfolio, and Certificate routes as the source of truth. A thin `ApiClient` owns Fetch, cookie-based Better Auth session headers, response envelopes, and transport errors; a domain-focused `StudentApi` exposes resource operations. Server-owned data is not silently replaced by a local fallback when the API is unavailable, and unsupported fields such as work experience are not presented as persisted until the backend provides a contract.
