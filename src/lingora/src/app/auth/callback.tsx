import { useThemedStyles, type ThemeColors } from '@/constants/theme';
import { Button } from '@/components/ui';
import { isRecoveryLink, markPasswordRecovery } from '@/lib/recovery-flag';
import { finishOAuth } from '@/lib/social-auth';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { t } from '@/lib/i18n';
import { takeAccountSetup } from '@/features/guest/guest';

/**
 * Landing page for email confirmation links and for Apple / Google sign-in.
 * Both return either a code or session tokens in the URL.
 */
export default function AuthCallbackScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const [message, setMessage] = useState(() => t('Signing you in…'));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let handled = false;

    async function handleCallback(url: string) {
      if (handled) return;
      handled = true;
      try {
        // Remember before signing in: the sign-in rebuilds the navigation.
        if (isRecoveryLink(url)) markPasswordRecovery();
        const type = await finishOAuth(url);
        if (type === 'recovery') {
          if (isMounted) router.replace('/reset-password');
          return;
        }
        // A guest confirmed their email: now they choose a password.
        if (takeAccountSetup() || type === 'email_change') {
          if (isMounted) router.replace({ pathname: '/reset-password', params: { setup: '1' } });
          return;
        }
        if (isMounted) {
          setMessage(t('You are signed in! Redirecting…'));
          router.replace('/');
        }
      } catch (error) {
        // The app may already have finished the sign-in itself (native flow).
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          if (isMounted) router.replace('/');
          return;
        }
        console.error('Auth callback error:', error);
        if (isMounted) {
          setFailed(true);
          setMessage(error instanceof Error ? error.message : t('Sign-in failed.'));
        }
      }
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleCallback(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleCallback(url);
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      {!failed ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      <Text style={styles.message}>{message}</Text>
      {failed ? <Button title={t("Back to login")} onPress={() => router.replace('/login')} style={styles.back} /> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  message: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  back: { marginTop: 24 },
});
