import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';

import { FormNotice, type Notice } from '@/components/form-notice';
import { MedvedSays } from '@/components/medved';
import { AppText, Button, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { markAccountSetup, useIsGuest } from '@/features/guest/guest';
import { profileKeys } from '@/features/profile/api';
import { friendlyAuthError, isValidEmail, usernameProblem } from '@/lib/auth-errors';
import { confirmationRedirect } from '@/lib/auth-redirect';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import { track } from '@/lib/insights';

/**
 * Turns a guest into a member. The user id stays the same, so lessons, XP,
 * streak and everything else from the guest time is kept.
 * Step 1: name + email (confirmation link). Step 2 after the link: password.
 */
export default function CreateAccountScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const guest = useIsGuest();
  const client = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!user) return;
    const name = username.trim().toLowerCase();
    const address = email.trim().toLowerCase();
    const problem = name ? usernameProblem(name) : t('Please choose a username.');
    if (problem) return setNotice({ tone: 'error', title: t('Check your username'), message: problem });
    if (!isValidEmail(address)) return setNotice({ tone: 'error', title: t('Check your email'), message: t('Enter a valid email address.') });
    setSaving(true);
    setNotice(null);
    try {
      const { data: free } = await supabase.rpc('username_available', { p_username: name });
      if (free === false) {
        setNotice({ tone: 'error', title: t('This username is taken. Try another one.') });
        return;
      }
      const { error: profileError } = await supabase.from('profiles')
        .update({ username: name, ...(fullName.trim() ? { full_name: fullName.trim() } : {}) })
        .eq('id', user.id);
      if (profileError) throw profileError;
      markAccountSetup();
      const { error } = await supabase.auth.updateUser({ email: address }, { emailRedirectTo: confirmationRedirect() });
      if (error) throw error;
      await client.invalidateQueries({ queryKey: profileKeys.all });
      setSent(true);
      track('account_created');
    } catch (error) {
      const friendly = friendlyAuthError(error, 'sign-up');
      setNotice({ tone: friendly.tone ?? 'error', title: friendly.title, message: friendly.message });
    } finally {
      setSaving(false);
    }
  }

  if (!guest) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <ScreenHeader title={t('Create a free account')} />
        <ScrollView contentContainerStyle={styles.content}>
          <MedvedSays mood="cheer" message={t('You already have an account. Everything is saved.')} />
          <Button title={t('Back to Lingora')} onPress={() => router.replace('/')} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Create a free account')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {sent ? (
            <>
              <MedvedSays mood="cheer" message={t('Almost done! Open the link we sent to {email}. Then you choose your password.', { email: email.trim() })} />
              <AppText color="textSecondary">{t('You can keep learning in the meantime. Check your spam folder if the email does not arrive.')}</AppText>
              <Button title={t('Keep learning')} onPress={() => router.replace('/learn')} />
              <Button title={t('Use another email')} variant="ghost" onPress={() => setSent(false)} />
            </>
          ) : (
            <>
              <MedvedSays message={t('Your lessons, XP, streak and gems stay with you. You just add a name and an email.')} />
              <AppText variant="label" color="textSecondary">{t('FULL NAME (OPTIONAL)')}</AppText>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} autoComplete="name"
                placeholder={t('Your name')} placeholderTextColor={colors.textMuted} />
              <AppText variant="label" color="textSecondary">{t('USERNAME')}</AppText>
              <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none"
                autoCorrect={false} placeholder={t('e.g. anna_learns')} placeholderTextColor={colors.textMuted} />
              <AppText variant="label" color="textSecondary">{t('EMAIL ADDRESS')}</AppText>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address"
                autoCapitalize="none" autoCorrect={false} autoComplete="email"
                placeholder={t('you@example.com')} placeholderTextColor={colors.textMuted} onSubmitEditing={() => void submit()} />
              <FormNotice notice={notice} />
              <Button title={t('Create account')} size="lg" fullWidth loading={saving} onPress={() => void submit()} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: screenPadding, gap: spacing.sm, paddingBottom: spacing.xxxl },
  input: {
    ...typography.body, color: colors.text, backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
});
