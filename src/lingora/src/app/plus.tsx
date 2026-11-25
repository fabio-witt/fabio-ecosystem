import { router, useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Medved } from '@/components/medved';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useIsGuest } from '@/features/guest/guest';
import { useMyPlus } from '@/features/plus/api';
import { checkoutUrl, PLAN_COMPARISON, PLUS_BENEFITS, PLUS_CHECKOUT, plusCheckoutReady } from '@/features/plus/config';
import { PlusBadge } from '@/features/plus/plus-badge';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';
import { track } from '@/lib/insights';

type Plan = 'yearly' | 'monthly' | 'lifetime';
const PLAN_ORDER: Plan[] = ['yearly', 'monthly', 'lifetime'];
const PLAN_NAME: Record<Plan, string> = { yearly: 'Yearly', monthly: 'Monthly', lifetime: 'Lifetime' };
const PLAN_PER: Record<Plan, string> = { yearly: 'per year', monthly: 'per month', lifetime: 'one payment' };

const FAQ: [string, string][] = [
  ['Can I keep learning for free?', 'Yes. All A1 lessons, word stations, reviews, level tests and the whole community stay free. From A2 on you get 3 new lessons a day for free.'],
  ['How does the free trial work?', 'The yearly plan starts with 7 free days. Cancel before the trial ends and you pay nothing.'],
  ['Can I cancel any time?', 'Yes, with one tap in the customer portal. Plus stays active until the end of the period you paid for.'],
  ['What happens to my progress if I stop Plus?', 'Nothing is lost. Your XP, streak, crowns and words stay. Only the daily lesson limit comes back.'],
];

/** Lingora Plus: Free vs Plus, the plans and the way to subscribe. */
export default function PlusScreen() {
  const { styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const guest = useIsGuest();
  const { isPlus, membership, refetch } = useMyPlus();
  const available = PLAN_ORDER.filter((key) => PLUS_CHECKOUT[key].url);
  const [plan, setPlan] = useState<Plan>(available[0] ?? 'yearly');
  const [open, setOpen] = useState<number | null>(null);

  // Coming back from the checkout: look for the new membership.
  useFocusEffect(useCallback(() => { if (user) void refetch(); track('plus_viewed'); }, [refetch, user]));

  const chosen = PLUS_CHECKOUT[plan];
  function subscribe() {
    if (!user || !chosen.url) return;
    feedback('tap');
    track('checkout_started', { plan });
    void Linking.openURL(checkoutUrl(chosen.url, user.id, user.email));
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Lingora Plus')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Medved mood="cheer" size={96} />
          <PlusBadge tier="plus" />
          <AppText variant="title" align="center" style={styles.onHero}>
            {isPlus ? t('You are a Plus member. Thank you!') : t('Learn without limits')}
          </AppText>
          <AppText align="center" style={styles.onHeroSoft}>
            {isPlus
              ? membership?.expiresAt
                ? t('Your membership is active until {date}.', { date: new Date(membership.expiresAt).toLocaleDateString() })
                : t('Your membership is active.')
              : t('Every level, every language, unlimited hearts and an AI partner who corrects you kindly.')}
          </AppText>
        </View>

        {!isPlus && plusCheckoutReady ? (
          <>
            <View style={styles.plans} accessibilityRole="radiogroup">
              {available.map((key) => {
                const option = PLUS_CHECKOUT[key];
                const selected = plan === key;
                return (
                  <Pressable key={key} onPress={() => { feedback('tap'); setPlan(key); }} accessibilityRole="radio" accessibilityState={{ selected }}
                    style={[styles.plan, selected && styles.planSelected]}>
                    {'note' in option ? <View style={styles.save}><AppText variant="small" style={styles.saveText}>{t(option.note)}</AppText></View> : null}
                    <AppText variant="caption" color="textSecondary">{t(PLAN_NAME[key])}</AppText>
                    <AppText variant="heading">{option.price}</AppText>
                    <AppText variant="small" color="textSecondary">{t(PLAN_PER[key])}</AppText>
                    {'monthly' in option ? <AppText variant="small" color="primary" style={styles.bold}>{option.monthly}</AppText> : null}
                  </Pressable>
                );
              })}
            </View>
            {plan === 'yearly' ? <TrialTimeline /> : null}
            {!user ? (
              <Button title={t('Log in')} size="lg" fullWidth onPress={() => router.push('/login')} />
            ) : guest ? (
              <Button title={t('Create a free account first')} size="lg" fullWidth onPress={() => router.push('/create-account')} />
            ) : (
              <Button title={plan === 'yearly' ? t('Start 7 days free') : plan === 'lifetime' ? t('Get Plus forever') : t('Get Lingora Plus')}
                size="lg" fullWidth onPress={subscribe} />
            )}
            <AppText variant="small" color="textMuted" align="center">
              {t('Secure payment with Stripe. Cancel any time. Plus is activated within a minute after payment.')}
            </AppText>
          </>
        ) : null}

        <Card style={styles.table}>
          <View style={[styles.tableRow, styles.tableHead]}>
            <AppText variant="bodyStrong" style={styles.feature}>{t('What you get')}</AppText>
            <AppText variant="bodyStrong" style={styles.col} align="center">{t('Free')}</AppText>
            <AppText variant="bodyStrong" style={[styles.col, styles.plusCol]} align="center">Plus</AppText>
          </View>
          {PLAN_COMPARISON.map(([feature, free, plus]) => (
            <View key={feature} style={styles.tableRow}>
              <AppText variant="callout" style={styles.feature}>{t(feature)}</AppText>
              <AppText variant="callout" color="textSecondary" style={styles.col} align="center">{t(free)}</AppText>
              <AppText variant="callout" style={[styles.col, styles.plusCol, styles.bold]} align="center">{t(plus)}</AppText>
            </View>
          ))}
        </Card>

        {PLUS_BENEFITS.map(([icon, title, text]) => (
          <Card key={title} style={styles.benefit}>
            <AppText style={styles.icon} accessible={false}>{icon}</AppText>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{t(title)}</AppText>
              <AppText variant="caption" color="textSecondary">{t(text)}</AppText>
            </View>
            {isPlus ? <AppText color="success" style={styles.check}>✓</AppText> : null}
          </Card>
        ))}

        {isPlus ? (
          PLUS_CHECKOUT.manageUrl ? (
            <Button title={t('Manage or cancel subscription')} variant="secondary" fullWidth
              onPress={() => void Linking.openURL(PLUS_CHECKOUT.manageUrl)} />
          ) : null
        ) : !plusCheckoutReady ? (
          <Card style={styles.soon}>
            <AppText variant="bodyStrong" align="center">{t('Plus subscriptions open soon')}</AppText>
            <AppText variant="caption" color="textSecondary" align="center">
              {t('Until then everything is free. You can support Lingora with a small donation.')}
            </AppText>
            <Button title={t('⭐ Support Lingora')} fullWidth onPress={() => router.push('/vip')} />
          </Card>
        ) : null}

        <AppText variant="heading">{t('Questions')}</AppText>
        {FAQ.map(([question, answer], index) => (
          <Pressable key={question} onPress={() => setOpen(open === index ? null : index)} accessibilityRole="button"
            accessibilityState={{ expanded: open === index }}>
            <Card style={styles.faq}>
              <AppText variant="bodyStrong">{open === index ? '− ' : '+ '}{t(question)}</AppText>
              {open === index ? <AppText color="textSecondary">{t(answer)}</AppText> : null}
            </Card>
          </Pressable>
        ))}

        <AppText variant="caption" color="textMuted" align="center">
          {t("Plus will never buy a higher place in partner search. Fair matching stays the same for everyone.")}
        </AppText>
        <View style={styles.links}>
          <AppText variant="small" color="primary" onPress={() => router.push('/terms')}>{t('Terms of use')}</AppText>
          <AppText variant="small" color="textMuted"> · </AppText>
          <AppText variant="small" color="primary" onPress={() => router.push('/privacy')}>{t('Privacy policy')}</AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

/** How the 7 free days work, so nobody is surprised by the charge. */
function TrialTimeline() {
  const { styles } = useThemedStyles(createStyles);
  const steps: [string, string, string][] = [
    ['🔓', t('Today'), t('Full access to every level')],
    ['🔔', t('Day 5'), t('Stripe reminds you by email')],
    ['💳', t('Day 7'), t('Your yearly plan starts – cancel before and pay nothing')],
  ];
  return (
    <Card style={styles.timeline}>
      {steps.map(([icon, when, what]) => (
        <View key={when} style={styles.timelineRow}>
          <AppText style={styles.timelineIcon}>{icon}</AppText>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">{when}</AppText>
            <AppText variant="caption" color="textSecondary">{what}</AppText>
          </View>
        </View>
      ))}
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  bold: { fontWeight: '800' },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl },
  hero: {
    alignItems: 'center', gap: spacing.sm, padding: spacing.xl, borderRadius: radius.xxl,
    backgroundColor: '#4B3FB8', borderBottomWidth: 5, borderBottomColor: '#352B8A',
  },
  onHero: { color: '#FFFFFF' },
  onHeroSoft: { color: 'rgba(255,255,255,0.85)' },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { fontSize: 28, lineHeight: 34 },
  check: { fontSize: 20, fontWeight: '900' },
  plans: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm },
  plan: {
    flex: 1, alignItems: 'center', gap: 2, padding: spacing.md, paddingTop: spacing.lg, borderRadius: radius.xl,
    borderWidth: 2, borderBottomWidth: 4, borderColor: colors.borderSubtle, backgroundColor: colors.surface,
  },
  planSelected: { borderColor: '#8E7CF8', backgroundColor: colors.primarySoft },
  save: { position: 'absolute', top: -11, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: '#F2B705' },
  saveText: { color: '#3D2E00', fontWeight: '800' },
  timeline: { gap: spacing.sm },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timelineIcon: { fontSize: 22, lineHeight: 28 },
  table: { gap: 0, paddingVertical: spacing.xs },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  tableHead: { borderBottomWidth: 2 },
  feature: { flex: 1 },
  col: { width: 74 },
  plusCol: { color: '#8E7CF8' },
  faq: { gap: spacing.xs },
  soon: { gap: spacing.sm },
  links: { flexDirection: 'row', justifyContent: 'center' },
});
