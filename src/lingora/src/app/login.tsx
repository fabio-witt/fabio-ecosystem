import { FormNotice, type Notice } from '@/components/form-notice';
import { SocialLogin } from '@/components/social-login';
import { Button } from '@/components/ui';
import { friendlyAuthError } from '@/lib/auth-errors';
import { confirmationRedirect } from '@/lib/auth-redirect';
import { useThemedStyles, type ThemeColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { t } from '@/lib/i18n';
import { LanguageToggle } from '@/components/language-toggle';
import { startAsGuest } from '@/features/guest/guest';

export default function LoginScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [resending, setResending] = useState(false);

  async function resendConfirmation(address: string) {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: address,
      options: { emailRedirectTo: confirmationRedirect() },
    });
    setResending(false);
    setNotice(error
      ? { tone: 'error', title: t("Email not sent"), message: friendlyAuthError(error, 'reset').message }
      : { tone: 'success', title: t("Email sent"), message: t('We sent a new confirmation link to {email}. Open it, then log in here.', { email: address }) });
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setNotice({ tone: 'error', title: t("Missing information"), message: t("Enter your email and password.") });
      return;
    }

    setNotice(null);
    setLoading(true);
    const address = email.trim().toLowerCase();

    let error: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['error'] | Error | null = null;
    try {
      error = (await supabase.auth.signInWithPassword({ email: address, password })).error;
    } catch (caught) {
      error = caught instanceof Error ? caught : new Error(String(caught));
    }

    setLoading(false);

    if (error) {
      const code = 'code' in error ? error.code : undefined;
      if (code === 'email_not_confirmed' || /not confirmed/i.test(error.message)) {
        setNotice({
          tone: 'info',
          title: t("Please confirm your email first"),
          message: t('Open the confirmation link we sent to {email}, then log in. Check your spam folder too.', { email: address }),
          action: { title: t("Send the link again"), onPress: () => resendConfirmation(address) },
        });
      } else if (code === 'invalid_credentials') {
        setNotice({
          tone: 'error',
          title: t("Login failed"),
          message: t("The email or password is not correct."),
          action: { title: t('Reset your password'), onPress: () => router.push({ pathname: '/forgot-password', params: { email: address } }) },
        });
      } else {
        const friendly = friendlyAuthError(error, 'login');
        setNotice({ tone: friendly.tone ?? 'error', title: friendly.title, message: friendly.message });
      }
      return;
    }

    // Navigation to the app happens automatically once the session is set
    // (see Stack.Protected in app/_layout.tsx).
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LanguageToggle />
        <View style={styles.logoIcon}>
          <Text style={styles.logoSymbol}>L</Text>
        </View>

        <Text style={styles.brand}>lingora</Text>

        <View style={styles.guestBox}>
          <Text style={styles.guestTitle}>{t('New here? Start learning right away.')}</Text>
          <Text style={styles.guestText}>{t('No account needed. You can create one later and keep your progress.')}</Text>
          <Button title={t('🐻 Start as a guest')} size="lg" fullWidth loading={guestLoading}
            onPress={async () => {
              setGuestLoading(true);
              setNotice(null);
              const problem = await startAsGuest();
              setGuestLoading(false);
              if (problem) setNotice({ tone: 'error', title: t('Could not start as a guest'), message: problem });
            }} />
        </View>

        <Button title={t('Try the Zurich adventure')} variant="secondary" onPress={() => router.push('/zurich-adventure')} />

        <Text style={styles.title}>{t("Log in")}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>{t("EMAIL ADDRESS")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("you@example.com")}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>{t("PASSWORD")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("Your password")}
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <Link href="/forgot-password" style={styles.forgot}>{t('Forgot password?')}</Link>

          <FormNotice notice={notice && notice.action
            ? { ...notice, action: { ...notice.action, loading: resending } }
            : notice} />

          <Button
            title={t("Log in →")}
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleLogin}
            style={styles.button}
          />

          <SocialLogin onError={(message) => setNotice({ tone: 'error', title: t("Sign-in failed"), message })} />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>{t("Don't have an account?")} </Text>
            <Link href="/register" style={styles.registerLink}>
              {t("Sign up")}
            </Link>
          </View>
          <View style={styles.registerRow}>
            <Link href="/privacy" style={styles.registerLink}>{t("Privacy policy")}</Link>
            <Text style={styles.registerText}> · </Text>
            <Link href="/terms" style={styles.registerLink}>{t("Terms of use")}</Link>
            <Text style={styles.registerText}> · </Text>
            <Link href="/support" style={styles.registerLink}>{t("Support")}</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  forgot: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 10, alignSelf: 'flex-end' },
  guestBox: {
    gap: 8, padding: 16, marginTop: 20, marginBottom: 16, borderRadius: 18,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary,
  },
  guestTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  guestText: { fontSize: 14, color: colors.textSecondary },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSymbol: {
    color: colors.onPrimary,
    fontSize: 30,
    fontWeight: '800',
  },
  brand: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    marginTop: 10,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 8,
  },
  form: {
    marginTop: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 15,
    height: 54,
    color: colors.text,
    fontSize: 14,
  },
  button: {
    marginTop: 32,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    flexWrap: 'wrap',
  },
  registerText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
});
