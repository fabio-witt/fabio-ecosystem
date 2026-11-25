import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card, PressableCard } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useLanguages } from '@/features/community/api';
import { conversationTask } from '@/features/learn/conversation-tasks';
import { usePartnerSearch } from '@/features/partners/api';
import { t } from '@/lib/i18n';

export function LessonExchange({ entryId, courseId, languageName, languageId }: {
  entryId: string; courseId: string; languageName: string; languageId?: number;
}) {
  const languages = useLanguages();
  const language = languages.data?.find((item) => item.language_code === courseId
    || item.name === languageName || (courseId === 'gsw' && item.name === 'Swiss German'));
  const matchedId = languageId ?? language?.id;
  const taskId = conversationTask(entryId) ? entryId : conversationTask(courseId) ? courseId : undefined;
  return matchedId ? <FirstExchange languageId={matchedId} languageName={languageName} taskId={taskId} /> : null;
}

export function FirstExchange({ languageId, languageName, taskId }: {
  languageId: number; languageName: string; taskId?: string;
}) {
  const partners = usePartnerSearch({ languageId, country: null, query: '' });
  const partner = partners.data?.pages[0]?.[0];
  const task = conversationTask(taskId);
  const name = partner?.full_name || partner?.username || 'Lingora member';

  return (
    <View style={styles.group}>
      <AppText variant="heading" accessibilityRole="header">{t("Put it into practice")}</AppText>
      {task && (
        <Card style={styles.group}>
          <AppText variant="bodyStrong">{t("Conversation task")}</AppText>
          <AppText>{task.goal}</AppText>
          <AppText variant="caption" color="textSecondary">{t("Suggested opener")}</AppText>
          <AppText>{task.starter}</AppText>
        </Card>
      )}
      {partner ? (
        <PressableCard style={styles.partner}
          onPress={() => router.push({ pathname: '/user/[id]', params: { id: partner.id, ...(taskId ? { task: taskId } : {}) } })}>
          <Avatar name={name} uri={partner.avatar_url} size={44} />
          <View style={styles.details}>
            <AppText variant="bodyStrong">{t('Meet {name}', { name })}</AppText>
            <AppText variant="caption" color="textSecondary">{t('Speaks {language} · {score}% match', { language: t(languageName), score: partner.match_score })}</AppText>
          </View>
          <AppText variant="heading" color="primary" accessible={false}>›</AppText>
        </PressableCard>
      ) : (
        <Card style={styles.group}>
          <AppText color="textSecondary">
            {partners.isPending ? t("Looking for a language partner…")
              : partners.isError ? t("Partner suggestions are temporarily unavailable.")
                : `No ${languageName} partners are available right now.`}
          </AppText>
          <Button title={t("Find a partner in Discover")} variant="secondary" onPress={() => router.push({
            pathname: '/explore', params: { languageId: String(languageId) },
          })} />
        </Card>
      )}
      <Button title={t('Ask a question about {language}', { language: languageName })} variant="ghost" onPress={() => router.push({
        pathname: '/post/compose', params: { kind: 'question', languageId: String(languageId) },
      })} />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  partner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  details: { flex: 1, gap: spacing.xxs },
});
