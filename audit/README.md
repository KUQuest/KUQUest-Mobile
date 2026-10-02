# KUQuest Mobile — Comprehensive Audit Matrix

Audit matrix and verification checklist for KUQuest Mobile, aligned with backend rulebooks (`docs/rulebook/`), Architecture Decision Records (`docs/adr/`), domain ubiquitous language (`CONTEXT.md`), and Expo SDK 57 / React Native 0.86 guidelines.

---

## 🚀 How to Import into Google Sheets

### Method 1: Automated Google Apps Script (Recommended)

This method creates a multi-tab workbook with an interactive dashboard, color-coded tabs, frozen headers, text wrapping, and dropdown validations (`PASS`, `FAIL`, `PENDING`).

1. Open a new Google Sheet: [sheets.new](https://sheets.new)
2. In the top menu, go to **Extensions** > **Apps Script**
3. Select all code in `Code.gs`, delete it, and paste the entire contents of [`audit/GoogleSheetsImporter.js`](GoogleSheetsImporter.js)
4. Click **Save** (💾) and then **Run** (`createAuditSheets`)
5. If prompted, grant authorization
6. Return to your Google Sheet — the dashboard and all 7 sheets will be generated and formatted!

### Method 2: Direct CSV Import

If you prefer importing manually into an existing spreadsheet:

1. Go to **File** > **Import** > **Upload**
2. Upload [`audit/KUQUEST_MOBILE_MASTER_AUDIT.csv`](KUQUEST_MOBILE_MASTER_AUDIT.csv)
3. Under **Import location**, select **Replace current sheet** or **Insert new sheet(s)**
4. Click **Import data**

_(Individual category CSVs are also available: `01_screens_and_navigation.csv`, `02_quest_lifecycle_and_contracts.csv`, `03_finance_and_wallet.csv`, `04_chat_and_inquiry.csv`, `05_architecture_and_security.csv`, `06_mobile_ui_and_a11y.csv`)._

---

## 📋 Audit Scope & Categories

| #     | Tab / Category           | Items         | Coverage & Domain Authority                                                                                                                                            |
| ----- | ------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0** | **Audit Summary**        | KPI Dashboard | Auto-calculates total pass/fail/pending metrics across all sheets                                                                                                      |
| **1** | **Screens & Navigation** | 24            | Routes in `src/app/`, Hirer vs Worker workspaces (ADR-0011), 3-step wizard (ADR-0002), bottom tabs (ADR-0007)                                                          |
| **2** | **Lifecycle & Rules**    | 13            | Quest state machine (`QUEST_OPEN` -> `COMPLETED`/`FAILED`), FCFS vs Candidate 2x2 matrix, 10m condition gate, 24h auto-approval, tiered cancellation refund (ADR-0003) |
| **3** | **Finance & Wallet**     | 7             | 4 compartments (`spending`, `earnings`, `fundingReserved`, `reservedForPayouts`), integer satang arithmetic, PromptPay QR, max capacity 2B satang                      |
| **4** | **Chat & Inquiries**     | 4             | Candidate Inquiry (1-on-1, `QUEST_OPEN` only) vs Work Conversation (group + KU Bot events), rate limiting (5 msg / 5s), draft safety                                   |
| **5** | **Architecture & State** | 5             | TanStack Query v5 server state, Zustand client state, zero React Context for app state (ADR-0012), SecureStore tokens, WebSocket Origin `kuquestmobile://`             |
| **6** | **UI & Accessibility**   | 5             | Semantic color ramps, Be Vietnam Pro typography, 44x44pt touch targets, TalkBack/VoiceOver labels, safe area insets                                                    |
| **Σ** | **Master Checklist**     | **58**        | **Comprehensive consolidated system audit**                                                                                                                            |
