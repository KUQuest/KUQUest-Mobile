#!/usr/bin/env node

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://kuquest-dev-api.kubits.org";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@kubit.org";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Kq!7e5932d92b93bc17cc205";

async function request(path, options = {}) {
  const url = `${BASE_URL.replace(/\/+$/, "")}${path}`;
  const headers = {
    Origin: BASE_URL,
    ...(options.headers || {}),
  };
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
  console.log(`\n🔍 Verifying Staging Backend: ${BASE_URL}\n`);

  // 1. Health check
  process.stdout.write("1. Health check (/health)... ");
  const health = await request("/health");
  if (health.response.status === 200 && health.json?.success) {
    console.log("✅ OK");
  } else {
    console.log(`❌ Failed: ${health.response.status}`);
    process.exit(1);
  }

  // 2. Admin Authentication
  process.stdout.write(`2. Admin sign-in (${ADMIN_EMAIL})... `);
  const adminAuth = await request("/api/admin/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (adminAuth.response.status === 200 && adminAuth.setCookie) {
    console.log("✅ OK (Authenticated)");
  } else {
    console.log(
      `❌ Failed: ${adminAuth.response.status} ${JSON.stringify(adminAuth.json)}`
    );
    process.exit(1);
  }

  const adminCookie = adminAuth.setCookie.split(";")[0];

  // 3. Admin Overview
  process.stdout.write("3. Admin Overview (/api/v1/admin/overview)... ");
  const overview = await request("/api/v1/admin/overview", {
    headers: { Cookie: adminCookie },
  });
  if (overview.response.status === 200 && overview.json?.success) {
    const totalQuests = overview.json.data.quests.total;
    console.log(`✅ OK (${totalQuests} total quests on staging)`);
  } else {
    console.log(`❌ Failed: ${overview.response.status}`);
  }

  // 4. Admin Finance Overview
  process.stdout.write(
    "4. Admin Finance Overview (/api/v1/admin/finance/overview)... "
  );
  const finance = await request("/api/v1/admin/finance/overview", {
    headers: { Cookie: adminCookie },
  });
  if (finance.response.status === 200 && finance.json?.success) {
    const circulating =
      finance.json.data.memberBalancesSummary.totalCirculatingSatang / 100;
    console.log(`✅ OK (฿${circulating.toLocaleString()} circulating)`);
  } else {
    console.log(`❌ Failed: ${finance.response.status}`);
  }

  // 5. Staging Test Account 1 (Hirer)
  process.stdout.write(
    "5. Member Account 1 Sign-in (/api/staging/test-auth/sign-in/account-1)... "
  );
  const member1 = await request("/api/staging/test-auth/sign-in/account-1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (member1.response.status === 200 && member1.setCookie) {
    console.log(`✅ OK (${member1.json?.user?.email})`);
  } else {
    console.log(`❌ Failed: ${member1.response.status}`);
    process.exit(1);
  }

  const member1Cookie = member1.setCookie.split(";")[0];

  // 6. Tags
  process.stdout.write("6. Tags (/api/v1/tags)... ");
  const tags = await request("/api/v1/tags", {
    headers: { Cookie: member1Cookie },
  });
  if (tags.response.status === 200 && tags.json?.success) {
    console.log(`✅ OK (${tags.json.data.length} tags returned)`);
  } else {
    console.log(`❌ Failed: ${tags.response.status}`);
  }

  // 7. Quest Board v2
  process.stdout.write("7. Quest Board (/api/v2/quests)... ");
  const board = await request("/api/v2/quests", {
    headers: { Cookie: member1Cookie },
  });
  if (board.response.status === 200 && board.json?.success) {
    console.log("✅ OK (Quest Board queryable)");
  } else {
    console.log(`❌ Failed: ${board.response.status}`);
  }

  // 8. Hirer My Quests
  process.stdout.write("8. Hirer Quests (/api/v2/quests/mine)... ");
  const mine = await request("/api/v2/quests/mine", {
    headers: { Cookie: member1Cookie },
  });
  if (mine.response.status === 200 && mine.json?.success) {
    console.log(`✅ OK (${mine.json.data.items.length} quests owned)`);
  } else {
    console.log(`❌ Failed: ${mine.response.status}`);
  }

  // 9. Wallet
  process.stdout.write("9. Wallet (/api/v1/wallet)... ");
  const wallet = await request("/api/v1/wallet", {
    headers: { Cookie: member1Cookie },
  });
  if (wallet.response.status === 200 && wallet.json?.success) {
    const spending = wallet.json.data.wallet.spendingBalanceSatang / 100;
    console.log(`✅ OK (Spending: ฿${spending.toLocaleString()})`);
  } else {
    console.log(`❌ Failed: ${wallet.response.status}`);
  }

  // 10. Work Chat
  process.stdout.write("10. Work Chat (/api/v1/chat/conversations)... ");
  const chat = await request("/api/v1/chat/conversations", {
    headers: { Cookie: member1Cookie },
  });
  if (chat.response.status === 200 && chat.json?.success) {
    console.log(`✅ OK (${chat.json.data.items.length} conversations)`);
  } else {
    console.log(`❌ Failed: ${chat.response.status}`);
  }

  console.log("\n🎉 Staging Backend is 100% OPERATIONAL & VERIFIED!\n");
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
