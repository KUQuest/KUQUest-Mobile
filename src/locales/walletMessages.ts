import type { SupportedLocale } from "./locale";

export interface WalletMessages {
  walletTitle: string;
  walletSubtitle: string;
  spendingBalance: string;
  earningsBalance: string;
  escrowReserved: string;
  payoutReserved: string;
  topUp: string;
  transactions: string;
  convertEarnings: string;
  convertPrompt: string;
  convertSuccess: string;
  convertError: string;
  enterAmount: string;
  minTopUpHint: string;
  continue: string;
  topUpAmountTitle: string;
  topUpAmountDescription: string;
  topUpAmountStepSubtitle: string;
  topUpConfirmationStepSubtitle: string;
  topUpPromptPayStepSubtitle: string;
  topUpPromptPayTitle: string;
  topUpPromptPayDescription: string;
  quickAmountLabel: string;
  quickAmountAccessibilityLabel: (amount: number) => string;
  topUpSafetyNotice: string;
  clearAmount: string;
  editAmount: string;
  promptPayScanLabel: string;
  topUpConfirmationTitle: string;
  topUpQrUnavailable: string;
  topUpCredit: string;
  topUpBalanceUnavailable: string;
  topUpFee: string;
  topUpTax: string;
  topUpPaymentTotal: string;
  topUpExpiresAt: string;
  topUpConfirm: string;
  paymentVerified: string;
  paymentCredited: (credit: string) => string;
  topUpSuccessTitle: string;
  topUpSuccessDescription: string;
  verifyPayment: string;
  verifyingPayment: string;
  done: string;
  generateQr: string;
  scanToPay: string;
  checkStatus: string;
  simulateSuccess: string;
  paymentSuccess: string;
  paymentPending: string;
  paymentFailed: string;
  historyTitle: string;
  noTransactions: string;
  refresh: string;
  close: string;
  back: string;
  confirm: string;
  cancel: string;
  placeholderBadge: string;
  ledgerNoticeTitle: string;
  ledgerNoticeDescription: string;
  financeSubtitle: string;
  amaWalletTitle: string;
  sendMoneyAction: string;
  spendingBalanceCardTitle: string;
  spendingBalanceCardDesc: string;
  escrowCardTitle: string;
  escrowCardDesc: string;
  earningsCardTitle: string;
  earningsCardDesc: string;
  payoutCardTitle: string;
  payoutCardDesc: string;
  swapToWorkerView: string;
  swapToHirerView: string;
  balanceCardsHint: string;
  swapAllButton: string;
  swapHint: string;
  historySectionTitle: string;
  filterAll: string;
  filterInflow: string;
  filterOutflow: string;
  filterEscrow: string;
  filterTopUp: string;
  filterPayout: string;
  transactionDetailTitle: string;
  txSourceLabel: string;
  txStatusLabel: string;
  txDateLabel: string;
  txReferenceLabel: string;
  txDetailsLabel: string;
  txTopUpReferenceLabel: string;
  txAmountLabel: string;
  statusCompleted: string;
  statusPending: string;
  statusFailed: string;
  statusExpired: string;
  sourceActivities: string;
  sourceTopUps: string;
  sourcePayouts: string;
  closeButton: string;
  emptyHistoryTitle: string;
  emptyHistoryDesc: string;
  errorLoadingWallet: string;
  retry: string;
  transferEarningsTitle: string;
  transferEarningsDesc: string;
  fromEarnings: string;
  toSpending: string;
  transferAmountLabel: string;
  transferAll: string;
  transferFeeFree: string;
  transferPolicyNote: string;
  transferConfirmBtn: string;
  transferring: string;
  minTransferHint: string;
  insufficientEarnings: string;
  noEarningsAvailable: string;
  transferSuccessTitle: string;
  transferSuccessDesc: (amount: string) => string;
}
export const walletMessages: Record<SupportedLocale, WalletMessages> = {
  en: {
    walletTitle: "Wallet Overview",
    walletSubtitle: "Available balance and payments",
    spendingBalance: "Spending Balance",
    earningsBalance: "Earnings",
    escrowReserved: "In Escrow",
    payoutReserved: "Pending Payout",
    topUp: "Top Up",
    transactions: "History",
    convertEarnings: "Convert",
    convertPrompt:
      "Transfer your entire earnings balance to your spending balance? This action is instant and irreversible.",
    convertSuccess: "Earnings transferred to spending balance successfully.",
    convertError: "Failed to convert earnings.",
    enterAmount: "Enter amount (฿)",
    minTopUpHint: "Minimum amount is ฿10.00",
    continue: "Continue",
    topUpAmountTitle: "Top-Up via PromptPay QR",
    topUpAmountDescription:
      "Enter the amount in Thai Baht (฿) to credit into your Spending Balance.",
    topUpAmountStepSubtitle: "Step 1/3 • Enter amount",
    topUpConfirmationStepSubtitle: "Step 2/3 • Confirm details",
    topUpPromptPayStepSubtitle: "Step 3/3 • Scan to pay",
    topUpPromptPayTitle: "Scan PromptPay QR",
    topUpPromptPayDescription:
      "Scan this QR code with any mobile banking app to complete your transfer.",
    quickAmountLabel: "Choose a quick amount",
    quickAmountAccessibilityLabel: (amount) => `Top up ${amount} baht`,
    topUpSafetyNotice:
      "Your top-up will be added to your Spending Balance immediately after a successful PromptPay payment and can be used to hire workers right away.",
    clearAmount: "Clear amount",
    editAmount: "Edit amount",
    promptPayScanLabel: "Scan to pay",
    topUpQrUnavailable:
      "The payment provider did not return a PromptPay QR. Please try again.",
    topUpConfirmationTitle: "Confirm top-up",
    topUpCredit: "Credit to Spending Balance",
    topUpBalanceUnavailable: "Unable to load the current balance.",
    topUpFee: "Payment fee",
    topUpTax: "VAT",
    topUpPaymentTotal: "Payment total",
    topUpExpiresAt: "Quote expires",
    topUpConfirm: "Confirm and create QR",
    paymentVerified: "Payment Verified (PAID)",
    paymentCredited: (credit) => `${credit} credited to your Spending Balance`,
    topUpSuccessTitle: "Top-up complete",
    topUpSuccessDescription: "The funds are now in your Spending Balance.",
    verifyPayment: "Verify Payment",
    verifyingPayment: "Verifying payment with provider…",
    done: "Done",
    generateQr: "Continue",
    scanToPay: "Scan QR with any Thai banking app to complete payment.",
    checkStatus: "Check Status",
    simulateSuccess: "Simulate Paid (Dev)",
    paymentSuccess:
      "Payment confirmed! Your spending balance has been credited.",
    paymentPending: "Awaiting payment confirmation…",
    paymentFailed: "Payment was not confirmed. Please check and try again.",
    historyTitle: "Transaction History",
    noTransactions: "No transactions found.",
    refresh: "Refresh",
    close: "Close",
    back: "Go back",
    confirm: "Confirm",
    cancel: "Cancel",
    placeholderBadge: "Placeholder",
    ledgerNoticeTitle: "API Endpoint Status Note",
    ledgerNoticeDescription:
      "Notice: A unified double-entry ledger statements endpoint (/api/v1/wallet/transactions) is not currently exposed by the API server. Live PromptPay Top-ups and Bank Payouts are retrieved directly from /api/v1/top-ups and /api/v1/payouts. Internal Quest Escrow locks and settlements are displayed as illustrative placeholders until the ledger history API is deployed.",
    financeSubtitle: "Finance",
    amaWalletTitle: "Ama Wallet",
    sendMoneyAction: "Top Up",
    spendingBalanceCardTitle: "Available balance",
    spendingBalanceCardDesc: "Ready to spend on quests",
    escrowCardTitle: "Money on hold",
    escrowCardDesc: "Paid out when quest completes",
    earningsCardTitle: "Earnings",
    earningsCardDesc: "Earned from completed quests",
    payoutCardTitle: "Pending payout",
    payoutCardDesc: "Transferring to bank",
    swapToWorkerView: "Worker earnings",
    swapToHirerView: "Hirer balance",
    balanceCardsHint: "Tap card to swap view",
    swapAllButton: "Swap all",
    swapHint: "Tap to swap",
    historySectionTitle: "History",
    filterAll: "All",
    filterInflow: "Inflow",
    filterOutflow: "Outflow",
    filterEscrow: "On hold",
    filterTopUp: "Top-ups",
    filterPayout: "Payouts",
    transactionDetailTitle: "Transaction Details",
    txSourceLabel: "Source",
    txStatusLabel: "Status",
    txDateLabel: "Date & Time",
    txReferenceLabel: "Reference",
    txDetailsLabel: "Details",
    txTopUpReferenceLabel: "Top-up reference",
    txAmountLabel: "Amount",
    statusCompleted: "Completed",
    statusPending: "Pending",
    statusFailed: "Failed",
    statusExpired: "Expired",
    sourceActivities: "Wallet Activities",
    sourceTopUps: "PromptPay Top-up",
    sourcePayouts: "Bank Payout",
    closeButton: "Close",
    emptyHistoryTitle: "No transaction history",
    emptyHistoryDesc:
      "Your transactions will appear here once you top up or post quests.",
    errorLoadingWallet: "Failed to load wallet data",
    retry: "Try again",
    transferEarningsTitle: "Transfer to Spending",
    transferEarningsDesc:
      "Transfer accumulated earnings into your spending balance instantly to post quests.",
    fromEarnings: "From: Earnings",
    toSpending: "To: Spending Balance",
    transferAmountLabel: "Amount to transfer (฿)",
    transferAll: "All",
    transferFeeFree: "Fee-Free (0% Fee)",
    transferPolicyNote:
      "Transfers are instant and irreversible per financial rulebook policy.",
    transferConfirmBtn: "Confirm Transfer",
    transferring: "Transferring...",
    minTransferHint: "Minimum transfer ฿1.00",
    insufficientEarnings: "Insufficient earnings balance",
    noEarningsAvailable: "No earnings available to transfer",
    transferSuccessTitle: "Transfer Successful",
    transferSuccessDesc: (amount: string) =>
      `Successfully transferred ${amount} to spending balance.`,
  },
  th: {
    walletTitle: "ภาพรวมกระเป๋าเงิน",
    walletSubtitle: "ยอดเงินคงเหลือและระบบชำระเงิน",
    spendingBalance: "ยอดเงินพร้อมใช้",
    earningsBalance: "รายได้สะสม",
    escrowReserved: "เงินประกันเควสต์",
    payoutReserved: "กำลังถอนเงิน",
    topUp: "เติมเงิน",
    transactions: "ประวัติ",
    convertEarnings: "โอนรายได้",
    convertPrompt:
      "ต้องการโอนยอดรายได้สะสมทั้งหมดเข้าสู่ยอดเงินพร้อมใช้หรือไม่? การดำเนินการนี้จะเกิดขึ้นทันทีและไม่สามารถยกเลิกได้",
    convertSuccess: "โอนรายได้เข้าสู่ยอดเงินพร้อมใช้สำเร็จแล้ว",
    convertError: "ไม่สามารถโอนรายได้ได้",
    enterAmount: "ระบุจำนวนเงิน (บาท)",
    minTopUpHint: "ยอดเติมเงินขั้นต่ำ ฿10.00",
    continue: "ดำเนินการต่อ",
    topUpAmountTitle: "เติมเงินผ่าน PromptPay QR",
    topUpAmountDescription:
      "ระบุจำนวนเงินบาท (฿) ที่ต้องการเติมเข้าสู่ยอดเงินพร้อมใช้ของคุณ",
    topUpAmountStepSubtitle: "ขั้นตอนที่ 1/3 • ระบุจำนวนเงิน",
    topUpConfirmationStepSubtitle: "ขั้นตอนที่ 2/3 • ยืนยันข้อมูล",
    topUpPromptPayStepSubtitle: "ขั้นตอนที่ 3/3 • สแกนชำระเงิน",
    topUpPromptPayTitle: "สแกน PromptPay QR",
    topUpPromptPayDescription:
      "สแกน QR Code นี้ด้วยแอปพลิเคชันธนาคารใดก็ได้เพื่อชำระเงิน",
    quickAmountLabel: "เลือกจำนวนเงินด่วน",
    quickAmountAccessibilityLabel: (amount) => `เติมเงิน ${amount} บาท`,
    topUpSafetyNotice:
      "ยอดเงินที่เติมจะเข้าสู่ยอดเงินพร้อมใช้ของคุณทันทีหลังจากชำระเงินผ่าน PromptPay สำเร็จ และใช้จ้างงานได้ทันที",
    clearAmount: "ล้าง",
    editAmount: "แก้ไขจำนวนเงิน",
    promptPayScanLabel: "สแกนเพื่อชำระเงิน",
    topUpQrUnavailable:
      "ผู้ให้บริการชำระเงินไม่ส่ง QR พร้อมเพย์กลับมา โปรดลองอีกครั้ง",
    topUpConfirmationTitle: "ยืนยันการเติมเงิน",
    topUpCredit: "เครดิตเข้ายอดเงินพร้อมใช้",
    topUpBalanceUnavailable: "ไม่สามารถโหลดยอดเงินพร้อมใช้ปัจจุบันได้",
    topUpFee: "ค่าธรรมเนียมการชำระเงิน",
    topUpTax: "ภาษีมูลค่าเพิ่ม",
    topUpPaymentTotal: "ยอดชำระทั้งหมด",
    topUpExpiresAt: "ใบเสนอราคาหมดอายุ",
    topUpConfirm: "ยืนยันและสร้าง QR",
    paymentVerified: "ยืนยันการชำระเงินแล้ว (PAID)",
    paymentCredited: (credit) => `เครดิต ${credit} เข้ายอดเงินพร้อมใช้แล้ว`,
    topUpSuccessTitle: "เติมเงินสำเร็จ",
    topUpSuccessDescription: "เงินเข้ายอดเงินพร้อมใช้ของคุณแล้ว",
    verifyPayment: "ตรวจสอบการชำระเงิน",
    verifyingPayment: "กำลังตรวจสอบการชำระเงิน…",
    done: "เสร็จสิ้น",
    generateQr: "สร้างรหัส QR",
    scanToPay: "สแกน QR Code ด้วยแอปพลิเคชันธนาคารเพื่อชำระเงิน",
    checkStatus: "ตรวจสอบสถานะ",
    simulateSuccess: "จำลองชำระสำเร็จ (Dev)",
    paymentSuccess:
      "ยืนยันการชำระเงินเรียบร้อยแล้ว! เครดิตเข้ายอดเงินพร้อมใช้แล้ว",
    paymentPending: "กำลังรอการยืนยันการชำระเงิน…",
    paymentFailed: "ยังไม่พบการชำระเงิน กรุณาตรวจสอบอีกครั้ง",
    historyTitle: "ประวัติธุรกรรม",
    noTransactions: "ไม่พบรายการธุรกรรม",
    refresh: "รีเฟรช",
    close: "ปิด",
    back: "ย้อนกลับ",
    confirm: "ยืนยัน",
    cancel: "ยกเลิก",
    placeholderBadge: "ตัวอย่าง",
    ledgerNoticeTitle: "หมายเหตุการเชื่อมต่อ API",
    ledgerNoticeDescription:
      "หมายเหตุ: ระบบ API ประวัติธุรกรรมบัญชีแยกประเภทสมบูรณ์ (/api/v1/wallet/transactions) ยังไม่เปิดให้บริการ ขณะนี้แสดงรายการเติมเงิน PromptPay และการถอนเงินจริงจาก API (/api/v1/top-ups, /api/v1/payouts) ส่วนรายการกันเงินประกันเควสต์และค่าตอบแทนแสดงเป็นรายการตัวอย่างจนกว่า API บัญชีแยกประเภทจะพร้อมใช้งาน",
    financeSubtitle: "การเงิน",
    amaWalletTitle: "Ama Wallet",
    sendMoneyAction: "เติมเงิน",
    spendingBalanceCardTitle: "เงินที่พร้อมใช้",
    spendingBalanceCardDesc: "ใช้จ้างงานได้ทันที",
    escrowCardTitle: "เงินที่พักไว้",
    escrowCardDesc: "รอจ่ายเมื่องานเสร็จ",
    earningsCardTitle: "รายได้",
    earningsCardDesc: "รายได้จากการทำเควสต์",
    payoutCardTitle: "กำลังถอนเงิน",
    payoutCardDesc: "รอโอนเข้าบัญชีธนาคาร",
    swapToWorkerView: "ดูรายได้ผู้รับงาน",
    swapToHirerView: "ดูเงินผู้ว่าจ้าง",
    balanceCardsHint: "แตะการ์ดเพื่อสลับมุมมอง",
    swapAllButton: "สลับทั้งหมด",
    swapHint: "แตะเพื่อสลับ",
    historySectionTitle: "ประวัติ",
    filterAll: "ทั้งหมด",
    filterInflow: "เงินเข้า",
    filterOutflow: "เงินออก",
    filterEscrow: "เงินที่พักไว้",
    filterTopUp: "เติมเงิน",
    filterPayout: "ถอนเงิน",
    transactionDetailTitle: "รายละเอียดธุรกรรม",
    txSourceLabel: "แหล่งที่มา",
    txStatusLabel: "สถานะ",
    txDateLabel: "วันและเวลา",
    txReferenceLabel: "เลขอ้างอิง",
    txDetailsLabel: "รายละเอียด",
    txTopUpReferenceLabel: "อ้างอิงเติมเงิน",
    txAmountLabel: "จำนวนเงิน",
    statusCompleted: "สำเร็จ",
    statusPending: "รอดำเนินการ",
    statusFailed: "ไม่สำเร็จ",
    statusExpired: "หมดอายุ",
    sourceActivities: "กิจกรรมบัญชี",
    sourceTopUps: "เติมเงินผ่านพร้อมเพย์",
    sourcePayouts: "ถอนเงินเข้าบัญชีธนาคาร",
    closeButton: "ปิด",
    emptyHistoryTitle: "ยังไม่มีประวัติการทำธุรกรรม",
    emptyHistoryDesc: "เมื่อคุณเติมเงินหรือลงภารกิจ ประวัติจะแสดงที่นี่",
    errorLoadingWallet: "เกิดข้อผิดพลาดในการโหลดข้อมูลกระเป๋าเงิน",
    retry: "ลองอีกครั้ง",
    transferEarningsTitle: "โอนรายได้เข้าเงินพร้อมใช้",
    transferEarningsDesc:
      "โอนเงินจากรายได้สะสมเข้าสู่ยอดเงินพร้อมใช้เพื่อใช้จ้างงานต่อได้ทันที",
    fromEarnings: "จาก: รายได้สะสม",
    toSpending: "ไปยัง: เงินพร้อมใช้",
    transferAmountLabel: "จำนวนเงินที่ต้องการโอน (บาท)",
    transferAll: "โอนทั้งหมด",
    transferFeeFree: "ไม่มีค่าธรรมเนียม (ฟรี 0%)",
    transferPolicyNote:
      "การโอนรายได้จะเกิดขึ้นทันที และไม่สามารถยกเลิกหรือโอนกลับเป็นรายได้ได้ ตามกฎข้อบังคับ",
    transferConfirmBtn: "ยืนยันการโอนเงิน",
    transferring: "กำลังโอนเงิน...",
    minTransferHint: "ยอดโอนขั้นต่ำ ฿1.00",
    insufficientEarnings: "ยอดเงินไม่เพียงพอ",
    noEarningsAvailable: "คุณยังไม่มียอดรายได้ที่สามารถโอนได้",
    transferSuccessTitle: "โอนเงินสำเร็จ",
    transferSuccessDesc: (amount: string) =>
      `โอน ${amount} เข้าสู่ยอดเงินพร้อมใช้สำเร็จแล้ว`,
  },
};
