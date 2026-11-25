import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';

import { FormNotice, type Notice } from '@/components/form-notice';
import { AppText, Button, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { friendlyAuthError } from '@/lib/auth-errors';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

/** Opened from a password reset email (via /auth/callback) to set a new password. */
export default function ResetPasswordScreen() {
  const { setup } = useLocalSearchParams<{ setup?: string }>();
  const { colors, styles } = useThemedStyles(createStyles);
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function save() {
    if (password.length < 8) {
      setNotice({ tone: 'error', title: t('Password too short'), message: t('Use at least 8 characters.') });
      return;
    }
    if (password !== repeat) {
      setNotice({ tone: 'error', title: t('Passwords do not match'), message: t('Type the same new password twice.') });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const friendly = friendlyAuthError(error, 'update');
        setNotice({ tone: friendly.tone ?? 'error', title: friendly.title, message: friendly.message });
        return;
      }
      setNotice(setup
        ? { tone: 'success', title: t('Your account is ready!'), message: t('Welcome to the community. All your progress is saved.') }
        : { tone: 'success', title: t('Password changed'), message: t('Your new password is saved. You are signed in.') });
      setTimeout(() => router.replace('/'), 1200);
    } catch (error) {
      const friendly = friendlyAuthError(error, 'update');
      setNotice({ tone: 'error', title: friendly.title, message: friendly.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={setup ? t('Choose your password') : t('Choose a new password')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppText variant="label" color="textSecondary">{t('NEW PASSWORD')}</AppText>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry={!show}
            placeholder={t('At least 8 characters')} placeholderTextColor={colors.textMuted}
            autoCapitalize="none" autoComplete="new-password" />
          <AppText variant="label" color="textSecondary">{t('REPEAT NEW PASSWORD')}</AppText>
          <TextInput style={styles.input} value={repeat} onChangeText={setRepeat} secureTextEntry={!show}
            placeholderTextColor={colors.textMuted} autoCapitalize="none" autoComplete="new-password"
            onSubmitEditing={() => void save()} />
          <Button title={show ? t('Hide password') : t('Show password')} variant="ghost" size="sm" onPress={() => setShow(!show)} />
          <FormNotice notice={notice} />
          <Button title={t('Save new password')} size="lg" fullWidth loading={saving} onPress={() => void save()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: screenPadding, gap: spacing.md },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
