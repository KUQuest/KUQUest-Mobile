import type { SupportedLocale } from "./LocaleProvider";

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
  topUpTitle: string;
  enterAmount: string;
  minTopUpHint: string;
  continue: string;
  topUpAmountTitle: string;
  topUpAmountDescription: string;
  topUpPromptPayTitle: string;
  topUpPromptPayDescription: string;
  topUpConfirmationTitle: string;
  topUpCredit: string;
  topUpFee: string;
  topUpTax: string;
  topUpPaymentTotal: string;
  topUpExpiresAt: string;
  topUpConfirm: string;
  paymentVerified: string;
  paymentCredited: (credit: string) => string;
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
    topUpTitle: "PromptPay QR Top-Up",
    enterAmount: "Enter amount (฿)",
    minTopUpHint: "Minimum amount is ฿10.00",
    continue: "Continue",
    topUpAmountTitle: "Top-Up via PromptPay QR",
    topUpAmountDescription:
      "Enter the amount in Thai Baht (฿) to credit into your Spending Balance.",
    topUpPromptPayTitle: "Scan PromptPay QR",
    topUpPromptPayDescription:
      "Scan this QR code with any mobile banking app to complete your transfer.",
    topUpConfirmationTitle: "Confirm top-up",
    topUpCredit: "Credit to Spending Balance",
    topUpFee: "Payment fee",
    topUpTax: "VAT",
    topUpPaymentTotal: "Payment total",
    topUpExpiresAt: "Quote expires",
    topUpConfirm: "Confirm and create QR",
    paymentVerified: "Payment Verified (PAID)",
    paymentCredited: (credit) => `${credit} credited to your Spending Balance`,
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
    back: "Back",
    confirm: "Confirm",
    cancel: "Cancel",
    placeholderBadge: "Placeholder",
    ledgerNoticeTitle: "API Endpoint Status Note",
    ledgerNoticeDescription:
      "Notice: A unified double-entry ledger statements endpoint (/api/v1/wallet/transactions) is not currently exposed by the API server. Live PromptPay Top-ups and Bank Payouts are retrieved directly from /api/v1/top-ups and /api/v1/payouts. Internal Quest Escrow locks and settlements are displayed as illustrative placeholders until the ledger history API is deployed.",
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
    topUpTitle: "เติมเงินผ่าน PromptPay QR",
    enterAmount: "ระบุจำนวนเงิน (บาท)",
    minTopUpHint: "ยอดเติมเงินขั้นต่ำ ฿10.00",
    continue: "ดำเนินการต่อ",
    topUpAmountTitle: "เติมเงินผ่าน PromptPay QR",
    topUpAmountDescription:
      "ระบุจำนวนเงินบาท (฿) ที่ต้องการเติมเข้าสู่ยอดเงินพร้อมใช้ของคุณ",
    topUpPromptPayTitle: "สแกน PromptPay QR",
    topUpPromptPayDescription:
      "สแกน QR Code นี้ด้วยแอปพลิเคชันธนาคารใดก็ได้เพื่อชำระเงิน",
    topUpConfirmationTitle: "ยืนยันการเติมเงิน",
    topUpCredit: "เครดิตเข้ายอดเงินพร้อมใช้",
    topUpFee: "ค่าธรรมเนียมการชำระเงิน",
    topUpTax: "ภาษีมูลค่าเพิ่ม",
    topUpPaymentTotal: "ยอดชำระทั้งหมด",
    topUpExpiresAt: "ใบเสนอราคาหมดอายุ",
    topUpConfirm: "ยืนยันและสร้าง QR",
    paymentVerified: "ยืนยันการชำระเงินแล้ว (PAID)",
    paymentCredited: (credit) => `เครดิต ${credit} เข้ายอดเงินพร้อมใช้แล้ว`,
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
  },
};
