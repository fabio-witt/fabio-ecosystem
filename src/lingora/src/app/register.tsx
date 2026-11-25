import { BrandLogo } from '@/components/brand-logo';
import { FormNotice, type Notice } from '@/components/form-notice';
import { SocialLogin } from '@/components/social-login';
import { Button } from '@/components/ui';
import { useThemedStyles, type ThemeColors } from '@/constants/theme';
import { friendlyAuthError, isValidEmail, usernameProblem } from '@/lib/auth-errors';
import { confirmationRedirect } from '@/lib/auth-redirect';
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

type Field = 'fullName' | 'username' | 'email' | 'password';

export default function RegisterScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);

  async function resend(address: string) {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email: address, options: { emailRedirectTo: confirmationRedirect() } });
    setResending(false);
    if (error) {
      const friendly = friendlyAuthError(error, 'reset');
      setNotice({ tone: friendly.tone ?? 'error', title: friendly.title, message: friendly.message });
    } else {
      setNotice({ tone: 'success', title: t('Email sent'), message: t('We sent a new confirmation link to {email}.', { email: address }) });
    }
  }

  function setFieldError(field: Field, message: string | null) {
    setErrors((current) => ({ ...current, [field]: message ?? undefined }));
  }

  /** Checks a field and returns its problem, or null when it is fine. */
  function problemOf(field: Field): string | null {
    if (field === 'fullName') return fullName.trim() ? null : t('Please enter your name.');
    if (field === 'username') return username.trim() ? usernameProblem(username) : t('Please choose a username.');
    if (field === 'email') return !email.trim() ? t('Please enter your email address.') : isValidEmail(email) ? null : t('This email address does not look valid.');
    return password.length >= 8 ? null : t('Use at least 8 characters.');
  }

  /** Asks Supabase whether the username is free. Unknown → let sign-up decide. */
  async function usernameTaken(name: string) {
    const { data, error } = await supabase.rpc('username_available', { p_username: name });
    return !error && data === false;
  }

  async function checkUsername() {
    const problem = problemOf('username');
    if (problem) return setFieldError('username', username.trim() ? problem : null);
    if (await usernameTaken(username.trim().toLowerCase())) setFieldError('username', t('This username is taken. Try another one.'));
    else setFieldError('username', null);
  }

  async function handleRegister() {
    if (loading) return;
    const fields: Field[] = ['fullName', 'username', 'email', 'password'];
    const found = Object.fromEntries(fields.map((field) => [field, problemOf(field) ?? undefined]));
    setErrors(found);
    if (fields.some((field) => found[field])) {
      setNotice({ tone: 'error', title: t('Please check the marked fields'), message: t('Some information is missing or not valid yet.') });
      return;
    }

    setNotice(null);
    setLoading(true);
    const address = email.trim().toLowerCase();
    const name = username.trim().toLowerCase();

    try {
      if (await usernameTaken(name)) {
        setFieldError('username', t('This username is taken. Try another one.'));
        setNotice({ tone: 'error', title: t('Please check the marked fields'), message: t('This username is taken. Try another one.') });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: address,
        password,
        options: {
          data: { full_name: fullName.trim(), username: name },
          emailRedirectTo: confirmationRedirect(),
        },
      });

      if (error) {
        const friendly = friendlyAuthError(error, 'sign-up');
        setNotice({ tone: friendly.tone ?? 'error', title: friendly.title, message: friendly.message });
        return;
      }

      // Supabase hides whether an email already exists: an existing address
      // comes back without identities and gets no email.
      if (data.user && data.user.identities?.length === 0) {
        setNotice({ tone: 'error', title: t('This email already has an account'), message: t('Log in instead, or use another email address.') });
        return;
      }

      // With a session, Stack.Protected navigates into the app automatically.
      if (!data.session) setSentTo(address);
    } catch (error) {
      const friendly = friendlyAuthError(error, 'sign-up');
      setNotice({ tone: 'error', title: friendly.title, message: friendly.message });
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <ScrollView contentContainerStyle={styles.content} style={styles.container}>
        <BrandLogo size={44} />
        <Text style={styles.title}>{t("Check your email")}</Text>
        <FormNotice notice={{
          tone: 'success',
          title: t("Almost done!"),
          message: t('We sent a confirmation link to {email}. Open it to activate your account, then log in. Check your spam folder if you cannot find it.', { email: sentTo }),
        }} />
        <FormNotice notice={notice} />
        <Button title={t("Go to login →")} size="lg" fullWidth onPress={() => router.replace('/login')} style={styles.button} />
        <Button title={t('Send the link again')} variant="secondary" fullWidth loading={resending} onPress={() => void resend(sentTo)} style={styles.secondaryAction} />
        <Button title={t('Use a different email address')} variant="ghost" fullWidth onPress={() => { setSentTo(null); setNotice(null); }} />
      </ScrollView>
    );
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
        <BrandLogo size={44} />

        <Text style={styles.title}>{t("Create an account")}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>{t("FULL NAME")}</Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            placeholder={t("Your full name")}
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            onBlur={() => fullName && setFieldError('fullName', problemOf('fullName'))}
            autoComplete="name"
          />
          {errors.fullName ? <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.fullName}</Text> : null}

          <Text style={styles.label}>{t("USERNAME")}</Text>
          <TextInput
            style={[styles.input, errors.username && styles.inputError]}
            placeholder={t("Choose a username")}
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={() => void checkUsername()}
            autoComplete="username"
          />
          {errors.username ? <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.username}</Text> : null}

          <Text style={styles.label}>{t("EMAIL ADDRESS")}</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder={t("you@example.com")}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={() => email && setFieldError('email', problemOf('email'))}
            autoComplete="email"
          />
          {errors.email ? <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.email}</Text> : null}

          <Text style={styles.label}>{t("PASSWORD")}</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder={t("At least 8 characters")}
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={(value) => { setPassword(value); if (errors.password && value.length >= 8) setFieldError('password', null); }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
          />
          {errors.password ? <Text style={styles.fieldError} accessibilityLiveRegion="polite">{errors.password}</Text> : null}
          <Text style={styles.showPassword} accessibilityRole="button" onPress={() => setShowPassword((value) => !value)}>
            {showPassword ? t('Hide password') : t('Show password')}
          </Text>

          <Text style={styles.label}>
            {t('By creating an account, you agree to the')}{' '}
            <Link href="/community-guidelines">{t("Community Guidelines")}</Link>.
            {' '}{t('Read the')} <Link href="/privacy">{t("Privacy policy")}</Link>.
          </Text>

          <FormNotice notice={notice} />

          <Button
            title={t("Create account →")}
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleRegister}
            style={styles.button}
          />

          <SocialLogin onError={(message) => setNotice({ tone: 'error', title: t("Sign-in failed"), message })} />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>{t("Already have an account?")} </Text>
            <Link href="/login" style={styles.loginLink}>
              {t("Log in")}
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  inputError: { borderColor: colors.danger, borderWidth: 2 },
  secondaryAction: { marginTop: 12 },
  fieldError: { color: colors.danger, fontSize: 13, marginTop: 6, lineHeight: 18 },
  showPassword: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 8, alignSelf: 'flex-end' },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 65,
    paddingBottom: 40,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 42,
  },
  form: {
    marginTop: 30,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 17,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 15,
    height: 52,
    color: colors.text,
    fontSize: 14,
  },
  button: {
    marginTop: 28,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
});

