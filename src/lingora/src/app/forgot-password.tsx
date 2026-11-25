import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';

import { FormNotice, type Notice } from '@/components/form-notice';
import { AppText, Button, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { friendlyAuthError, isValidEmail } from '@/lib/auth-errors';
import { confirmationRedirect } from '@/lib/auth-redirect';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

/** Sends a password reset link. The link opens /reset-password via /auth/callback. */
export default function ForgotPasswordScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    const address = email.trim().toLowerCase();
    if (!isValidEmail(address)) {
      setNotice({ tone: 'error', title: t('Check your email address'), message: t('This email address does not look valid.') });
      return;
    }
    setSending(true);
    setNotice(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo: confirmationRedirect() });
      if (error) {
        const friendly = friendlyAuthError(error, 'reset');
        setNotice({ tone: friendly.tone ?? 'error', title: friendly.title, message: friendly.message });
        return;
      }
      setSent(true);
      // Same message whether or not an account exists, so addresses stay private.
      setNotice({
        tone: 'success',
        title: t('Check your email'),
        message: t('If an account exists for {email}, we sent a link to set a new password. Check your spam folder too.', { email: address }),
      });
    } catch (error) {
      const friendly = friendlyAuthError(error, 'reset');
      setNotice({ tone: 'error', title: friendly.title, message: friendly.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Forgot password?')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppText color="textSecondary">
            {t('Enter the email address of your account. We will send you a link to choose a new password.')}
          </AppText>
          <AppText variant="label" color="textSecondary">{t('EMAIL ADDRESS')}</AppText>
          <TextInput
            style={styles.input}
            placeholder={t('you@example.com')}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            onSubmitEditing={() => void send()}
          />
          <FormNotice notice={notice} />
          <Button title={sent ? t('Send the link again') : t('Send reset link')} size="lg" fullWidth loading={sending} onPress={() => void send()} />
          <Button title={t('Back to login')} variant="ghost" onPress={() => router.replace('/login')} />
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
