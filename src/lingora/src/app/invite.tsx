import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';

import { Medved } from '@/components/medved';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useIsGuest } from '@/features/guest/guest';
import { useMyProfile } from '@/features/profile/api';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

const APP_URL = 'https://fabio-ecosystem-ashy.vercel.app/grammarfirst/lingora/';

/** Invite friends: both get 7 days of Lingora Plus. */
export default function InviteScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const guest = useIsGuest();
  const client = useQueryClient();
  const profile = useMyProfile().data?.profile;
  const code = profile?.username ?? '';
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const stats = useQuery({
    queryKey: ['referrals', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('referrals').select('referrer_id, referred_id').or(`referrer_id.eq.${user!.id},referred_id.eq.${user!.id}`);
      if (error) throw error;
      return { invited: (data ?? []).filter((row) => row.referrer_id === user!.id).length, used: (data ?? []).some((row) => row.referred_id === user!.id) };
    },
  });
  const redeem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('redeem_referral', { p_code: input });
      if (error) throw error;
    },
    onSuccess: () => { feedback('win'); setInput(''); void client.invalidateQueries(); },
  });
  const message = t('Learn languages with me on Lingora – free. Use my invite code {code} and we both get a week of Lingora Plus: {url}', { code, url: APP_URL });

  async function share() {
    feedback('tap');
    if (Platform.OS !== 'web') { await Share.share({ message }); return; }
    const nav = navigator as Navigator & { share?: (data: { text: string }) => Promise<void> };
    if (nav.share) { try { await nav.share({ text: message }); return; } catch { /* fall back to copying */ } }
    await Clipboard.setStringAsync(message);
    setCopied(true);
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Invite friends')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.center}>
          <Medved mood="cheer" size={100} />
          <AppText variant="title" align="center">{t('A week of Plus for you and a friend')}</AppText>
          <AppText align="center" color="textSecondary">{t('Your friend enters your code after creating an account. You both get 7 days of Lingora Plus – up to 10 friends per month.')}</AppText>
          {guest || !code ? <AppText align="center">{t('Create an account to get your own invite code.')}</AppText> : (
            <>
              <AppText style={styles.code} selectable>{code}</AppText>
              <Button title={copied ? t('Copied – paste it anywhere') : t('Share invite')} size="lg" fullWidth onPress={() => void share()} />
              <AppText variant="caption" color="textSecondary">{t('Friends who joined with your code: {n}', { n: stats.data?.invited ?? 0 })}</AppText>
            </>
          )}
        </Card>
        {!guest && !stats.data?.used ? (
          <Card style={styles.group}>
            <AppText variant="heading">{t('Got an invite code?')}</AppText>
            <AppText color="textSecondary">{t('Works in your first 14 days.')}</AppText>
            <View style={styles.row}>
              <TextInput value={input} onChangeText={setInput} autoCapitalize="none" autoCorrect={false} placeholder={t('Friend’s username')}
                placeholderTextColor={colors.textMuted} style={styles.input} accessibilityLabel={t('Invite code')} />
              <Button title={t('Redeem')} disabled={!input.trim() || redeem.isPending} onPress={() => redeem.mutate()} />
            </View>
            {redeem.isSuccess ? <AppText color="success">{t('Done! You both have Lingora Plus for 7 days.')}</AppText> : null}
            {redeem.isError ? <AppText color="danger">{redeem.error.message}</AppText> : null}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  code: { fontSize: 28, fontWeight: '900', letterSpacing: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primarySoft, color: colors.primary, overflow: 'hidden' },
  group: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 46, fontSize: 16 },
});
