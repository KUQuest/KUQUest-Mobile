import type { WalletTransactionTitleKey } from "@/api/WalletApi";
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
  transactionTitles: Record<WalletTransactionTitleKey, string>;
  balanceRefreshFailed: string;
  topUpBalanceRefreshRetry: string;
  topUpPaymentFailed: string;
  topUpExpired: string;
  topUpFailed: string;
  transferPreviewSpendingAfter: string;
  transferPreviewEarningsRemaining: string;
  payoutAction: string;
  requestPayoutTitle: string;
  requestPayoutDesc: string;
  payoutAvailableEarnings: string;
  payoutAmountLabel: string;
  payoutAmountInvalid: string;
  payoutNoEarnings: string;
  payoutInsufficientEarnings: string;
  payoutDestinationLabel: string;
  payoutManageDestination: string;
  payoutDestinationLoading: string;
  payoutDestinationLoadError: string;
  payoutNoDestinationTitle: string;
  payoutNoDestinationDesc: string;
  payoutAddDestination: string;
  payoutGetQuote: string;
  payoutQuoting: string;
  payoutQuoteError: string;
  payoutQuoteTitle: string;
  payoutQuoteReceipt: string;
  payoutQuoteFee: string;
  payoutQuoteTax: string;
  payoutQuoteDebit: string;
  payoutQuoteExpires: (time: string) => string;
  payoutQuoteNote: string;
  payoutQuoteExpired: string;
  payoutQuoteInsufficient: string;
  payoutEditAmount: string;
  payoutConfirm: string;
  payoutSubmitting: string;
  payoutSubmitError: string;
  payoutSuccessTitle: string;
  payoutSuccessDesc: (receipt: string) => string;
  destinationTitle: string;
  destinationDesc: string;
  destinationActiveTitle: string;
  destinationBankLabel: string;
  destinationHolderLabel: string;
  destinationAccountLabel: string;
  destinationEmptyTitle: string;
  destinationEmptyDesc: string;
  destinationLoadError: string;
  destinationAdd: string;
  destinationReplace: string;
  destinationGivenNameLabel: string;
  destinationSurnameLabel: string;
  destinationHolderNameLabel: string;
  destinationBankPlaceholder: string;
  destinationBankSearch: string;
  destinationBankNoResults: string;
  clearSearch: string;
  destinationAccountNumberLabel: string;
  destinationFieldRequired: string;
  destinationSave: string;
  destinationSaving: string;
  destinationSaveError: string;
  destinationRetire: string;
  destinationRetiring: string;
  destinationRetireConfirmTitle: string;
  destinationRetireConfirmDesc: string;
  destinationRetireError: string;
  destinationBackToDetails: string;
  payoutStatusTitle: string;
  payoutDetailLoading: string;
  payoutDetailError: string;
  payoutReceiptLabel: string;
  payoutFeeLabel: string;
  payoutTaxLabel: string;
  payoutDebitLabel: string;
  payoutFeesMaximumNote: string;
  payoutStatusHistoryTitle: string;
  payoutStatusHistoryEmpty: string;
  payoutHistoryReason: (reason: string) => string;
  payoutStatusLabels: Record<string, string>;
  payoutStatusDescriptions: Record<string, string>;
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
    transactionTitles: {
      promptPayTopUp: "PromptPay Top-Up",
      walletPayment: "Wallet Payment",
      questEarnings: "Quest Earnings",
      questEscrowReserved: "Quest Escrow Reserved",
      questEscrowReleased: "Quest Escrow Released",
      earningsConverted: "Earnings Converted",
      bankPayout: "Bank Payout",
      reservedForQuest: "Reserved for Quest",
      topUpToWallet: "Top up to Wallet",
      questRefund: "Quest Refund",
      unlockAndPay: "Unlock & Pay",
      systemFee: "System Fee",
      convertedToSpending: "Converted to Spending",
    },
    balanceRefreshFailed:
      "Payment succeeded, but your balance could not refresh.",
    topUpBalanceRefreshRetry: "Retry balance refresh",
    topUpPaymentFailed: "Payment could not be verified. Please try again.",
    topUpExpired:
      "This QR code has expired. Enter an amount to create a new one.",
    topUpFailed: "This payment failed. Enter an amount to try again.",
    transferPreviewSpendingAfter: "Spending balance after transfer:",
    transferPreviewEarningsRemaining: "Remaining earnings:",
    payoutAction: "Payout",
    requestPayoutTitle: "Request a Payout",
    requestPayoutDesc:
      "Send Earnings to your verified Thai bank account. An Admin reviews every Payout before it is sent.",
    payoutAvailableEarnings: "Available Earnings",
    payoutAmountLabel: "Amount to receive (฿)",
    payoutAmountInvalid: "Enter an amount greater than ฿0.00",
    payoutNoEarnings: "No Earnings available for a Payout",
    payoutInsufficientEarnings: "Amount is more than your Earnings",
    payoutDestinationLabel: "Pay out to",
    payoutManageDestination: "Manage",
    payoutDestinationLoading: "Loading payout account",
    payoutDestinationLoadError: "Could not load your payout account.",
    payoutNoDestinationTitle: "Add a payout account first",
    payoutNoDestinationDesc:
      "You need a Thai bank account on file before you can request a Payout.",
    payoutAddDestination: "Add payout account",
    payoutGetQuote: "Review fees",
    payoutQuoting: "Getting quote...",
    payoutQuoteError: "Could not get a Payout quote. Please try again.",
    payoutQuoteTitle: "Payout summary",
    payoutQuoteReceipt: "You receive",
    payoutQuoteFee: "Maximum fee",
    payoutQuoteTax: "Maximum tax",
    payoutQuoteDebit: "Taken from Earnings (maximum)",
    payoutQuoteExpires: (time: string) => `Quote valid until ${time}`,
    payoutQuoteNote:
      "The amount is held as a Payout Reserve until an Admin decides. The final fee and tax are confirmed when the Payout settles.",
    payoutQuoteExpired: "This quote has expired. Review the fees again.",
    payoutQuoteInsufficient:
      "Your Earnings no longer cover this Payout. Lower the amount.",
    payoutEditAmount: "Change amount",
    payoutConfirm: "Confirm Payout",
    payoutSubmitting: "Submitting...",
    payoutSubmitError: "Could not submit your Payout. Please try again.",
    payoutSuccessTitle: "Payout requested",
    payoutSuccessDesc: (receipt: string) =>
      `Your Payout of ${receipt} is waiting for Admin approval.`,
    destinationTitle: "Payout account",
    destinationDesc:
      "The active Thai bank account that receives your Payouts. Account numbers stay masked.",
    destinationActiveTitle: "Active account",
    destinationBankLabel: "Bank",
    destinationHolderLabel: "Account holder",
    destinationAccountLabel: "Account number",
    destinationEmptyTitle: "No payout account",
    destinationEmptyDesc: "Add a Thai bank account to receive Payouts.",
    destinationLoadError: "Could not load your payout account.",
    destinationAdd: "Add account",
    destinationReplace: "Replace account",
    destinationGivenNameLabel: "Given name",
    destinationSurnameLabel: "Surname",
    destinationHolderNameLabel: "Account holder name",
    destinationBankPlaceholder: "Choose your bank",
    destinationBankSearch: "Search banks",
    destinationBankNoResults: "No matching bank",
    clearSearch: "Clear search",
    destinationAccountNumberLabel: "Account number",
    destinationFieldRequired: "This field is required",
    destinationSave: "Save account",
    destinationSaving: "Saving...",
    destinationSaveError: "Could not save your payout account.",
    destinationRetire: "Remove account",
    destinationRetiring: "Removing...",
    destinationRetireConfirmTitle: "Remove this payout account?",
    destinationRetireConfirmDesc:
      "You cannot request a Payout until you add another account.",
    destinationRetireError: "Could not remove your payout account.",
    destinationBackToDetails: "Back",
    payoutStatusTitle: "Payout status",
    payoutDetailLoading: "Loading Payout",
    payoutDetailError: "Could not load this Payout.",
    payoutReceiptLabel: "You receive",
    payoutFeeLabel: "Fee",
    payoutTaxLabel: "Tax",
    payoutDebitLabel: "Taken from Earnings",
    payoutFeesMaximumNote:
      "Fee, tax, and total shown are maximums until the Payout settles.",
    payoutStatusHistoryTitle: "Status history",
    payoutStatusHistoryEmpty: "No status changes yet",
    payoutHistoryReason: (reason: string) => `Reason: ${reason}`,
    payoutStatusLabels: {
      PENDING_ADMIN_APPROVAL: "Waiting for Admin approval",
      SUBMITTED_TO_PROVIDER: "Sent to payment provider",
      PROVIDER_PENDING: "Provider processing",
      SUCCEEDED: "Paid out",
      FAILED: "Failed",
      CANCELLED: "Cancelled",
      REJECTED: "Rejected",
    },
    payoutStatusDescriptions: {
      PENDING_ADMIN_APPROVAL:
        "An Admin has not reviewed this Payout yet. The amount stays in your Payout Reserve.",
      SUBMITTED_TO_PROVIDER:
        "An Admin approved this Payout and it is being sent to the payment provider.",
      PROVIDER_PENDING: "The payment provider is processing the transfer.",
      SUCCEEDED: "The money was sent to your bank account.",
      FAILED: "The transfer failed. The amount returns to your Earnings.",
      CANCELLED:
        "This Payout was cancelled. The amount returns to your Earnings.",
      REJECTED:
        "An Admin rejected this Payout. The amount returns to your Earnings.",
    },
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
    transactionTitles: {
      promptPayTopUp: "เติมเงินผ่านพร้อมเพย์",
      walletPayment: "การชำระเงินจากกระเป๋าเงิน",
      questEarnings: "รายได้จากเควสต์",
      questEscrowReserved: "กันเงินประกันเควสต์",
      questEscrowReleased: "คืนเงินประกันเควสต์",
      earningsConverted: "โอนรายได้เข้าสู่ยอดเงินพร้อมใช้",
      bankPayout: "ถอนเงินเข้าบัญชีธนาคาร",
      reservedForQuest: "พักเงินสำหรับเควสต์",
      topUpToWallet: "เติมเงินเข้า Wallet",
      questRefund: "คืนเงินจากภารกิจ",
      unlockAndPay: "ปลดล็อกและจ่ายเงิน",
      systemFee: "ค่าธรรมเนียมระบบ",
      convertedToSpending: "โอนรายได้เข้าสู่ยอดเงินพร้อมใช้",
    },
    balanceRefreshFailed: "ชำระเงินสำเร็จ แต่ไม่สามารถรีเฟรชยอดเงินได้",
    topUpBalanceRefreshRetry: "ลองรีเฟรชยอดเงินอีกครั้ง",
    topUpPaymentFailed: "ไม่สามารถยืนยันการชำระเงินได้ โปรดลองอีกครั้ง",
    topUpExpired: "คิวอาร์โค้ดนี้หมดอายุแล้ว กรุณาระบุจำนวนเงินเพื่อสร้างใหม่",
    topUpFailed: "การชำระเงินไม่สำเร็จ กรุณาระบุจำนวนเงินเพื่อลองอีกครั้ง",
    transferPreviewSpendingAfter: "ยอดเงินพร้อมใช้หลังโอน:",
    transferPreviewEarningsRemaining: "รายได้สะสมคงเหลือ:",
    payoutAction: "ถอนเงิน",
    requestPayoutTitle: "ขอถอนเงิน",
    requestPayoutDesc:
      "ถอนรายได้สะสมเข้าบัญชีธนาคารไทยของคุณ ผู้ดูแลระบบจะตรวจสอบทุกรายการก่อนโอน",
    payoutAvailableEarnings: "รายได้สะสมที่ใช้ได้",
    payoutAmountLabel: "จำนวนเงินที่ต้องการรับ (฿)",
    payoutAmountInvalid: "ระบุจำนวนเงินมากกว่า ฿0.00",
    payoutNoEarnings: "ไม่มีรายได้สะสมสำหรับการถอนเงิน",
    payoutInsufficientEarnings: "จำนวนเงินเกินรายได้สะสมของคุณ",
    payoutDestinationLabel: "โอนเข้าบัญชี",
    payoutManageDestination: "จัดการ",
    payoutDestinationLoading: "กำลังโหลดบัญชีรับเงิน",
    payoutDestinationLoadError: "ไม่สามารถโหลดบัญชีรับเงินได้",
    payoutNoDestinationTitle: "เพิ่มบัญชีรับเงินก่อน",
    payoutNoDestinationDesc: "ต้องมีบัญชีธนาคารไทยในระบบก่อนจึงจะขอถอนเงินได้",
    payoutAddDestination: "เพิ่มบัญชีรับเงิน",
    payoutGetQuote: "ตรวจสอบค่าธรรมเนียม",
    payoutQuoting: "กำลังคำนวณ...",
    payoutQuoteError: "ไม่สามารถคำนวณการถอนเงินได้ โปรดลองอีกครั้ง",
    payoutQuoteTitle: "สรุปการถอนเงิน",
    payoutQuoteReceipt: "คุณจะได้รับ",
    payoutQuoteFee: "ค่าธรรมเนียมสูงสุด",
    payoutQuoteTax: "ภาษีสูงสุด",
    payoutQuoteDebit: "หักจากรายได้สะสม (สูงสุด)",
    payoutQuoteExpires: (time: string) => `ราคานี้ใช้ได้ถึง ${time}`,
    payoutQuoteNote:
      "ยอดเงินจะถูกกันไว้ในยอดกำลังถอนจนกว่าผู้ดูแลระบบจะพิจารณา ค่าธรรมเนียมและภาษีจริงจะยืนยันเมื่อการถอนเงินเสร็จสิ้น",
    payoutQuoteExpired: "ราคานี้หมดอายุแล้ว กรุณาตรวจสอบค่าธรรมเนียมอีกครั้ง",
    payoutQuoteInsufficient:
      "รายได้สะสมของคุณไม่พอสำหรับการถอนเงินนี้ กรุณาลดจำนวนเงิน",
    payoutEditAmount: "เปลี่ยนจำนวนเงิน",
    payoutConfirm: "ยืนยันการถอนเงิน",
    payoutSubmitting: "กำลังส่งคำขอ...",
    payoutSubmitError: "ไม่สามารถส่งคำขอถอนเงินได้ โปรดลองอีกครั้ง",
    payoutSuccessTitle: "ส่งคำขอถอนเงินแล้ว",
    payoutSuccessDesc: (receipt: string) =>
      `คำขอถอนเงิน ${receipt} กำลังรอผู้ดูแลระบบอนุมัติ`,
    destinationTitle: "บัญชีรับเงิน",
    destinationDesc: "บัญชีธนาคารไทยที่ใช้รับเงินถอน เลขบัญชีจะแสดงแบบปกปิด",
    destinationActiveTitle: "บัญชีที่ใช้งานอยู่",
    destinationBankLabel: "ธนาคาร",
    destinationHolderLabel: "ชื่อบัญชี",
    destinationAccountLabel: "เลขบัญชี",
    destinationEmptyTitle: "ยังไม่มีบัญชีรับเงิน",
    destinationEmptyDesc: "เพิ่มบัญชีธนาคารไทยเพื่อรับเงินถอน",
    destinationLoadError: "ไม่สามารถโหลดบัญชีรับเงินได้",
    destinationAdd: "เพิ่มบัญชี",
    destinationReplace: "เปลี่ยนบัญชี",
    destinationGivenNameLabel: "ชื่อ",
    destinationSurnameLabel: "นามสกุล",
    destinationHolderNameLabel: "ชื่อบัญชี",
    destinationBankPlaceholder: "เลือกธนาคาร",
    destinationBankSearch: "ค้นหาธนาคาร",
    destinationBankNoResults: "ไม่พบธนาคารที่ค้นหา",
    clearSearch: "ล้างคำค้นหา",
    destinationAccountNumberLabel: "เลขบัญชี",
    destinationFieldRequired: "จำเป็นต้องกรอกช่องนี้",
    destinationSave: "บันทึกบัญชี",
    destinationSaving: "กำลังบันทึก...",
    destinationSaveError: "ไม่สามารถบันทึกบัญชีรับเงินได้",
    destinationRetire: "ลบบัญชี",
    destinationRetiring: "กำลังลบ...",
    destinationRetireConfirmTitle: "ลบบัญชีรับเงินนี้?",
    destinationRetireConfirmDesc: "คุณจะขอถอนเงินไม่ได้จนกว่าจะเพิ่มบัญชีใหม่",
    destinationRetireError: "ไม่สามารถลบบัญชีรับเงินได้",
    destinationBackToDetails: "ย้อนกลับ",
    payoutStatusTitle: "สถานะการถอนเงิน",
    payoutDetailLoading: "กำลังโหลดรายการถอนเงิน",
    payoutDetailError: "ไม่สามารถโหลดรายการถอนเงินนี้ได้",
    payoutReceiptLabel: "ยอดที่ได้รับ",
    payoutFeeLabel: "ค่าธรรมเนียม",
    payoutTaxLabel: "ภาษี",
    payoutDebitLabel: "หักจากรายได้สะสม",
    payoutFeesMaximumNote:
      "ค่าธรรมเนียม ภาษี และยอดรวมที่แสดงเป็นค่าสูงสุด จนกว่าการถอนเงินจะเสร็จสิ้น",
    payoutStatusHistoryTitle: "ประวัติสถานะ",
    payoutStatusHistoryEmpty: "ยังไม่มีการเปลี่ยนสถานะ",
    payoutHistoryReason: (reason: string) => `เหตุผล: ${reason}`,
    payoutStatusLabels: {
      PENDING_ADMIN_APPROVAL: "รอผู้ดูแลระบบอนุมัติ",
      SUBMITTED_TO_PROVIDER: "ส่งให้ผู้ให้บริการชำระเงินแล้ว",
      PROVIDER_PENDING: "ผู้ให้บริการกำลังดำเนินการ",
      SUCCEEDED: "โอนเงินสำเร็จ",
      FAILED: "ไม่สำเร็จ",
      CANCELLED: "ยกเลิกแล้ว",
      REJECTED: "ถูกปฏิเสธ",
    },
    payoutStatusDescriptions: {
      PENDING_ADMIN_APPROVAL:
        "ผู้ดูแลระบบยังไม่ได้ตรวจสอบรายการนี้ ยอดเงินจะถูกกันไว้ในยอดกำลังถอนเงิน",
      SUBMITTED_TO_PROVIDER:
        "ผู้ดูแลระบบอนุมัติแล้ว และกำลังส่งให้ผู้ให้บริการชำระเงิน",
      PROVIDER_PENDING: "ผู้ให้บริการชำระเงินกำลังดำเนินการโอนเงิน",
      SUCCEEDED: "โอนเงินเข้าบัญชีธนาคารของคุณแล้ว",
      FAILED: "การโอนไม่สำเร็จ ยอดเงินจะคืนเข้ารายได้สะสม",
      CANCELLED: "รายการถอนเงินนี้ถูกยกเลิก ยอดเงินจะคืนเข้ารายได้สะสม",
      REJECTED: "ผู้ดูแลระบบปฏิเสธรายการนี้ ยอดเงินจะคืนเข้ารายได้สะสม",
    },
  },
};
