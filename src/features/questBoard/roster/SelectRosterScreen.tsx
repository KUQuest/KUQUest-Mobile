import { SelectRosterScreenView } from "./components/SelectRosterScreenView";
import { useSelectRosterScreen } from "./useSelectRosterScreen";

export interface SelectRosterScreenProps {
  questId?: string;
}

export default function SelectRosterScreen({
  questId,
}: SelectRosterScreenProps) {
  const vm = useSelectRosterScreen(questId);
  return <SelectRosterScreenView vm={vm} />;
}
