import { FunctionsHttpError } from '@supabase/supabase-js';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';

import { AppText, Button, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { cancelLearningReminder } from '@/features/notifications/reminders';
import { clearDeviceState } from '@/lib/device-state';
import { removeLocalLearnProgress } from '@/features/learn/progress';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import { t } from '@/lib/i18n';

export default function DeleteAccountScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const [confirmation, setConfirmation] = useState('');
  const [deleted, setDeleted] = useState(false);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || confirmation !== 'DELETE') throw new Error(t("Type DELETE to confirm."));
      if (!deleted) {
        const { data, error } = await supabase.functions.invoke<{ deleted: boolean }>('delete-account', {
          body: { confirmation },
        });
        if (error instanceof FunctionsHttpError) {
          const detail = await error.context.json().catch(() => null);
          if (typeof detail?.error === 'string') throw new Error(detail.error);
        }
        if (error || data?.deleted !== true) throw new Error(t("Deletion could not be confirmed. Please try again or contact support."));
        setDeleted(true);
        removeLocalLearnProgress(user.id);
        clearDeviceState(user.id);
        await cancelLearningReminder(user.id).catch(() => {});
      }
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw new Error(t("Your account was deleted, but this device could not sign out. Please try again."));
    },
  });

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t("Delete account")} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="title">{t("Permanently delete your account")}</AppText>
        <AppText>{t("Lingora will delete your profile, posts, comments, messages you sent, uploaded files and saved learning progress on this device. This cannot be undone.")}</AppText>
        {!deleted && (
          <>
            <AppText variant="bodyStrong">{t("Type DELETE to confirm.")}</AppText>
            <TextInput value={confirmation} onChangeText={setConfirmation} style={styles.input}
              placeholder={t("DELETE")} placeholderTextColor={colors.textMuted}
              accessibilityLabel={t("Type DELETE to confirm")} autoCapitalize="characters" autoCorrect={false}
              editable={!mutation.isPending} />
          </>
        )}
        {mutation.isError && <AppText color="danger" accessibilityLiveRegion="polite">{mutation.error.message}</AppText>}
        <Button title={deleted ? t("Finish signing out") : t("Permanently delete account")} variant="danger"
          disabled={confirmation !== 'DELETE'} loading={mutation.isPending} onPress={() => mutation.mutate()} />
        <Link href="/support"><AppText color="primary">{t("Contact support")}</AppText></Link>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { padding: screenPadding, gap: spacing.md },
  input: {
    minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text,
  },
});
