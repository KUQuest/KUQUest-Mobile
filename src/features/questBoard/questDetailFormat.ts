export function formatDeadline(value: string, locale: "en" | "th"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function getQuestRewardSatang(quest: {
  rewardSatang?: number;
  rewardPerPerson: number;
}): number {
  return quest.rewardSatang ?? Math.round(quest.rewardPerPerson * 100);
}
