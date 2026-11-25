import { AppText } from '@/components/ui';
import { PolicyPage, SupportEmail } from '@/features/safety/policy-page';
import { t } from '@/lib/i18n';

/** Legal notice (Impressum), required for a commercial app run from Switzerland. */
export default function ImprintScreen() {
  return (
    <PolicyPage title={t('Imprint')}>
      <AppText variant="heading">{t('Responsible for GrammarBay')}</AppText>
      <AppText>Fabio Witt{'\n'}Glattstegweg 89{'\n'}8051 Zürich{'\n'}{t('Switzerland')}</AppText>
      <AppText color="textSecondary">{t('Sole proprietorship. GrammarBay is an offer of Fabio Witt, together with DACHWERK, SPRACHWERK and GrammarFirst.')}</AppText>
      <AppText variant="heading">{t('Contact')}</AppText>
      <SupportEmail />
      <AppText variant="heading">{t('Payments')}</AppText>
      <AppText>{t('GrammarBay Plus is paid through Stripe. GrammarBay never sees or stores your card details.')}</AppText>
      <AppText variant="heading">{t('Copyright')}</AppText>
      <AppText>{t('Lessons, texts, images and the mascots Fabio and Mila are protected by copyright. Using them outside personal learning needs written permission.')}</AppText>
    </PolicyPage>
  );
}
