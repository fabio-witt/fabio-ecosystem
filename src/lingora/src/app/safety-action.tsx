import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AppText, Button, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { reportKinds, reportReasons, type ReportKind } from '@/features/safety/actions';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

export default function SafetyActionScreen() {
  const { kind, id } = useLocalSearchParams<{ kind?: string; id?: string }>();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const block = kind === 'block';
  const valid = !!id && (block || reportKinds.includes(kind as ReportKind));
  const title = block ? t('Block user') : t('Report content');
  const mutation = useMutation({
    mutationFn: async () => {
      if (!valid || !id || (!block && !reason)) throw new Error(t("Choose an action first."));
      const { error } = block
        ? await supabase.rpc('block_user', { p_user_id: id })
        : await supabase.rpc('report_content', { p_kind: kind!, p_id: id, p_reason: reason });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      if (block) {
        // Refetch shared feed, profile and chat caches after permissions change.
        void queryClient.invalidateQueries();
      }
    },
  });

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={title} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">{title}</AppText>
        {!valid ? (
          <AppText color="danger">{t("This action is unavailable.")}</AppText>
        ) : mutation.isSuccess ? (
          <>
            <AppText>{block
              ? t("User blocked. You can manage blocked users under Settings.")
              : t("Report received. GrammarBay will review it. Your report is private.")}</AppText>
            <Button title={t("Done")} onPress={() => block ? router.dismissTo({ pathname: '/community', params: { section: 'partners' } }) : router.back()} />
          </>
        ) : (
          <>
            <AppText color="textSecondary">{block
              ? t("Blocking hides your profiles and content from each other and prevents messages between you.")
              : t("Choose a reason for reporting this content to GrammarBay.")}</AppText>
            {!block && reportReasons.map(([key, label]) => (
              <Button key={key} title={t(label)} variant={reason === key ? 'primary' : 'secondary'}
                accessibilityState={{ selected: reason === key }} disabled={mutation.isPending}
                onPress={() => setReason(key)} />
            ))}
            {mutation.isError && <AppText color="danger" accessibilityLiveRegion="polite">{mutation.error.message}</AppText>}
            <Button title={block ? t("Confirm block") : t("Send report")} variant={block ? 'danger' : 'primary'}
              disabled={!block && !reason} loading={mutation.isPending} onPress={() => mutation.mutate()} />
            <Button title={t("Cancel")} variant="ghost" disabled={mutation.isPending} onPress={() => router.back()} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: screenPadding, gap: spacing.md },
});
