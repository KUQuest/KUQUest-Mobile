import CreateQuestScreen from '@/features/createQuest/CreateQuestScreen';
import { useLocalSearchParams } from 'expo-router';

export default function CreateScreen() {
  const { editQuestId } = useLocalSearchParams<{ editQuestId?: string | string[] }>();
  const normalizedEditQuestId = Array.isArray(editQuestId) ? editQuestId.length === 1 ? editQuestId[0] : undefined : editQuestId;
  return <CreateQuestScreen editQuestId={normalizedEditQuestId} />;
}
