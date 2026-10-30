import type { ImageSource } from "expo-image";
import type { SupportedLocale } from "@/locales/locale";

// ponytail: mirrors the API Server's supportedThaiBankCodes; api.yaml exposes
// no bank-list endpoint, so update this list when the server's set changes.
const THAI_BANKS = [
  { code: "BBL", en: "Bangkok Bank", th: "ธนาคารกรุงเทพ" },
  { code: "KBANK", en: "Kasikornbank", th: "ธนาคารกสิกรไทย" },
  { code: "KTB", en: "Krung Thai Bank", th: "ธนาคารกรุงไทย" },
  { code: "SCB", en: "Siam Commercial Bank", th: "ธนาคารไทยพาณิชย์" },
  { code: "BAY", en: "Bank of Ayudhya", th: "ธนาคารกรุงศรีอยุธยา" },
  { code: "TTB", en: "TMBThanachart Bank", th: "ธนาคารทหารไทยธนชาต" },
  { code: "GSB", en: "Government Savings Bank", th: "ธนาคารออมสิน" },
  {
    code: "BAAC",
    en: "Bank for Agriculture and Agricultural Cooperatives",
    th: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร",
  },
  { code: "GHB", en: "Government Housing Bank", th: "ธนาคารอาคารสงเคราะห์" },
  { code: "CIMBT", en: "CIMB Thai Bank", th: "ธนาคารซีไอเอ็มบี ไทย" },
  { code: "UOBT", en: "United Overseas Bank (Thai)", th: "ธนาคารยูโอบี" },
  { code: "KKP", en: "Kiatnakin Phatra Bank", th: "ธนาคารเกียรตินาคินภัทร" },
  { code: "TISCO", en: "Tisco Bank", th: "ธนาคารทิสโก้" },
  {
    code: "LHBANK",
    en: "Land and Houses Bank",
    th: "ธนาคารแลนด์ แอนด์ เฮ้าส์",
  },
  {
    code: "ICBC",
    en: "Industrial and Commercial Bank of China (Thai)",
    th: "ธนาคารไอซีบีซี (ไทย)",
  },
  {
    code: "EXIM",
    en: "Export-Import Bank of Thailand",
    th: "ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย",
  },
] as const;

/** Select options labelled "<name> (<code>)" so search matches either. */
export function getThaiBankOptions(locale: SupportedLocale) {
  return THAI_BANKS.map((bank) => ({
    label: `${bank[locale]} (${bank.code})`,
    value: bank.code,
  }));
}

/** "<name> (<code>)" for a known code; the raw code otherwise. */
export function getThaiBankLabel(code: string, locale: SupportedLocale) {
  const bank = THAI_BANKS.find((item) => item.code === code);
  return bank ? `${bank[locale]} (${bank.code})` : code;
}

// Logos from https://github.com/omise/banks-logo (assets/images/banks/LICENSE).
// EXIM has no published logo.
const BANK_LOGOS: Record<string, ImageSource> = {
  BBL: require("@/assets/images/banks/bbl.svg"),
  KBANK: require("@/assets/images/banks/kbank.svg"),
  KTB: require("@/assets/images/banks/ktb.svg"),
  SCB: require("@/assets/images/banks/scb.svg"),
  BAY: require("@/assets/images/banks/bay.svg"),
  TTB: require("@/assets/images/banks/ttb.svg"),
  GSB: require("@/assets/images/banks/gsb.svg"),
  BAAC: require("@/assets/images/banks/baac.svg"),
  GHB: require("@/assets/images/banks/ghb.svg"),
  CIMBT: require("@/assets/images/banks/cimb.svg"),
  UOBT: require("@/assets/images/banks/uob.svg"),
  KKP: require("@/assets/images/banks/kk.svg"),
  TISCO: require("@/assets/images/banks/tisco.svg"),
  LHBANK: require("@/assets/images/banks/lhb.svg"),
  ICBC: require("@/assets/images/banks/icbc.svg"),
};

export function getThaiBankLogo(code: string | null | undefined) {
  return code ? BANK_LOGOS[code.trim().toUpperCase()] : undefined;
}
