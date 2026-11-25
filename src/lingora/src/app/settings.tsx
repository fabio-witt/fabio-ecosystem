import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { useIsAdmin } from '@/features/moderation/api';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import { feedback, setSoundEnabled, useSoundEnabled } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { LanguageToggle } from '@/components/language-toggle';
import { ExportDataButton } from '@/features/profile/export-data';

export default function SettingsScreen() {
  const { user } = useSession();
  const client = useQueryClient();
  const isAdmin = useIsAdmin().data === true;
  const blocked = useQuery({
    queryKey: ['blocked-users', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_blocked_users');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const unblock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('unblock_user', { p_user_id: id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => client.invalidateQueries(),
  });

  const soundOn = useSoundEnabled();

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t("Settings")} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="heading">{t('App language')}</AppText>
        <LanguageToggle wide />
        <AppText variant="caption" color="textSecondary">{t('Menus, buttons and hints. Lesson explanations stay in English for now.')}</AppText>
        <Button title={t("Notifications")} variant="secondary" onPress={() => router.push('/notifications')} />
        <Button title={soundOn ? t('🔊 Sounds and vibration: on') : t('🔇 Sounds and vibration: off')} variant="secondary"
          accessibilityRole="switch" accessibilityState={{ checked: soundOn }}
          onPress={() => { setSoundEnabled(!soundOn); if (!soundOn) feedback('ok'); }} />
        <AppText variant="heading">{t("Safety and privacy")}</AppText>
        {isAdmin ? (
          <>
            <Button title={t("🛡️ Moderation")} variant="secondary" onPress={() => router.push('/admin')} />
            <Button title={t("📊 Insights")} variant="secondary" onPress={() => router.push('/insights')} />
          </>
        ) : null}
        <Button title={t("✦ GrammarBay Plus")} onPress={() => router.push('/plus')} />
        <Button title={t("Privacy policy")} variant="secondary" onPress={() => router.push('/privacy')} />
        <Button title={t("Terms of use")} variant="secondary" onPress={() => router.push('/terms')} />
        <Button title={t("Imprint")} variant="secondary" onPress={() => router.push('/imprint')} />
        <Button title={t("Community Guidelines")} variant="secondary" onPress={() => router.push('/community-guidelines')} />
        <Button title={t("💬 Send feedback")} variant="secondary" onPress={() => router.push('/feedback')} />
        <Button title={t("Contact support")} variant="secondary" onPress={() => router.push('/support')} />
        <AppText variant="heading">{t("Blocked users")}</AppText>
        {blocked.isPending && <AppText>{t("Loading blocked users…")}</AppText>}
        {blocked.isError && (
          <>
            <AppText color="danger">{t("Could not load blocked users.")}</AppText>
            <Button title={t("Retry")} variant="secondary" onPress={() => void blocked.refetch()} />
          </>
        )}
        {blocked.data?.length === 0 && <AppText color="textSecondary">{t("You have no blocked users.")}</AppText>}
        {blocked.data?.map((person) => (
          <Card key={person.id} style={styles.row}>
            <AppText style={styles.name}>{person.name}</AppText>
            <Button title={t("Unblock")} size="sm" variant="secondary" disabled={unblock.isPending}
              accessibilityLabel={t('Unblock {name}', { name: person.name })} onPress={() => unblock.mutate(person.id)} />
          </Card>
        ))}
        {unblock.isError && <AppText color="danger">{unblock.error.message}</AppText>}
        <View style={styles.section}>
          <AppText variant="heading">{t("Account")}</AppText>
          <ExportDataButton />
          <Button title={t("Delete account")} variant="danger" onPress={() => router.push('/delete-account')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: screenPadding, gap: spacing.md },
  section: { gap: spacing.sm, marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1 },
});
