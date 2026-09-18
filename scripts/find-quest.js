#!/usr/bin/env node

/**
 * Query staging quest state directly over HTTP, bypassing the app UI.
 * Signs in as a staging test account, lists its quests, and reports each
 * quest's mode/participation alongside its pending applicant/team count -
 * the same shape HomeScreen.tsx computes for the Active Quest carousel.
 *
 * Usage: bun run find-quest [account-1|account-2|...]
 */

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://kuquest-dev-api.kubits.org";

const account = process.argv[2] || "account-1";

async function request(path, options = {}) {
  const url = `${BASE_URL.replace(/\/+$/, "")}${path}`;
  const headers = { Origin: BASE_URL, ...(options.headers || {}) };
  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { response, json, setCookie: response.headers.get("set-cookie") };
}

async function main() {
  console.log(`\n🔍 Signing in as ${account} on ${BASE_URL}...`);
  const signIn = await request(`/api/staging/test-auth/sign-in/${account}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (signIn.response.status !== 200 || !signIn.setCookie) {
    console.error(
      `❌ Sign-in failed: ${signIn.response.status} ${JSON.stringify(signIn.json)}`
    );
    process.exit(1);
  }
  const cookie = signIn.setCookie.split(";")[0];
  console.log(`✅ Signed in as ${signIn.json?.user?.email ?? account}\n`);

  const mine = await request("/api/v2/quests/mine?limit=50", {
    headers: { Cookie: cookie },
  });
  if (mine.response.status !== 200 || !mine.json?.success) {
    console.error(`❌ /api/v2/quests/mine failed: ${mine.response.status}`);
    process.exit(1);
  }

  const quests = mine.json.data.items.filter(
    (q) => q.state !== "QUEST_CANCELLED" && q.state !== "QUEST_COMPLETED"
  );
  if (quests.length === 0) {
    console.log("No active quests for this account.");
    return;
  }

  for (const q of quests) {
    const isGroupCandidate =
      q.mode === "CANDIDATE" && q.participation === "GROUP";
    const isSingleCandidate =
      q.mode === "CANDIDATE" && q.participation !== "GROUP";

    let pending = 0;
    if (isGroupCandidate) {
      const teams = await request(`/api/v2/quests/${q.id}/teams`, {
        headers: { Cookie: cookie },
      });
      pending = (teams.json?.data ?? []).filter(
        (t) => t.state === "TEAM_SUBMITTED"
      ).length;
    } else if (isSingleCandidate) {
      const apps = await request(`/api/v2/quests/${q.id}/applications`, {
        headers: { Cookie: cookie },
      });
      pending = (apps.json?.data ?? []).filter(
        (a) => a.state === "APPLICATION_APPLIED"
      ).length;
    }

    const flag = pending > 0 ? "⭐" : "  ";
    console.log(
      `${flag} ${q.id}  ${q.state.padEnd(16)} ${q.mode.padEnd(22)} ${q.participation.padEnd(6)} pending=${pending}  "${q.title}"`
    );
  }

  console.log(
    "\n⭐ = CANDIDATE mode with a pending applicant/team (opens the roster selection screen)."
  );
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
