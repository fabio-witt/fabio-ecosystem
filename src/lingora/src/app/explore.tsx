import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LegacyPartnerSearch() {
  const { languageId, task, course } = useLocalSearchParams<{ languageId?: string; task?: string; course?: string }>();
  return <Redirect href={{ pathname: '/community', params: {
    section: 'partners', ...(course ? { course } : {}), ...(task ? { task } : {}),
    ...(languageId !== undefined ? { languageId } : {}),
  } }} />;
}
