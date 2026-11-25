import { useNow } from '@/hooks/use-now';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { usePracticeReview } from '@/features/learn/practice-review';
import { useCorrectionCards } from '@/features/learn/correction-review';
import { t } from '@/lib/i18n';
export default function MistakeWorkshopScreen() {
 const review = usePracticeReview(); const corrections = useCorrectionCards();
 const now = useNow();
 const due = review.mistakes.filter(m=>m.dueAt<=now).length;
 return <Screen><ScreenHeader title={t('My mistake workshop')} /><ScrollView contentContainerStyle={{padding:screenPadding,gap:spacing.md}}>
 <AppText>{t('Turn lesson mistakes and saved chat corrections into useful practice.')}</AppText>
 <Card><AppText variant="heading">{t('Lesson mistakes')}</AppText><AppText>{t('{n} questions due',{n:due})}</AppText><Button title={t('Review mistakes')} onPress={()=>router.push('/practice-review')} /></Card>
 <Card><AppText variant="heading">{t('Chat corrections')}</AppText>
 {corrections.isError ? <Button title={t('Try again')} onPress={()=>{void corrections.refetch();}} /> : <AppText>{corrections.isPending?t('Loading…'):t('{n} corrections due',{n:corrections.data.filter(c=>c.due).length})}</AppText>}
 <Button title={t('Correction review')} onPress={()=>router.push('/correction-review')} /></Card>
 <Card><AppText variant="heading">{t('Swiss everyday missions')}</AppText><AppText>{t('Revisit your mistakes inside each mission.')}</AppText><Button title={t('Open mission')} onPress={()=>router.push('/swiss-missions')} /></Card>
 </ScrollView></Screen>;
}
