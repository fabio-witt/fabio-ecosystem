import { Link } from 'expo-router';

import { AppText } from '@/components/ui';
import { PolicyPage, SupportEmail } from '@/features/safety/policy-page';
import { t } from '@/lib/i18n';

export default function SupportScreen() {
  return (
    <PolicyPage title={t("GrammarBay Support")}>
      <AppText>{t("Contact us for account help, privacy requests or questions about community safety.")}</AppText>
      <SupportEmail />
      <AppText>{t("Include your GrammarBay username and a brief description. Keep passwords and confirmation codes private.")}</AppText>
      <Link href="/privacy"><AppText color="primary">{t("Privacy policy")}</AppText></Link>
      <Link href="/terms"><AppText color="primary">{t("Terms of use")}</AppText></Link>
      <Link href="/community-guidelines"><AppText color="primary">{t("Community Guidelines")}</AppText></Link>
    </PolicyPage>
  );
}
