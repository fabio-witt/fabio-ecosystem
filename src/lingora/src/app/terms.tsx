import { AppText } from '@/components/ui';
import { PolicyPage, SupportEmail } from '@/features/safety/policy-page';
import { t } from '@/lib/i18n';

const sections: [string, string[]][] = [
  ['Using Lingora', [
    'Lingora is a language-learning service with lessons, practice tools and a community for language exchange. You may use it for your personal, non-commercial learning. You must be at least 16 years old to use the community features.',
  ]],
  ['Your account', [
    'Keep your login details private and give correct information. You are responsible for what happens in your account. You can delete your account at any time in the settings.',
  ]],
  ['Community rules', [
    'Be respectful. Harassment, hate, spam, scams, sexual content and sharing other people’s private data are not allowed. Lingora may remove content and suspend accounts that break the Community Guidelines.',
  ]],
  ['Your content', [
    'Your posts, messages and corrections remain yours. You allow Lingora to store and show them inside the service so that it can work. Do not post content you have no right to share.',
  ]],
  ['Lingora Plus and donations', [
    'Lingora Plus is an optional paid subscription that renews automatically until you cancel. You can cancel at any time; Plus then stays active until the end of the paid period. Donations are voluntary and are not refunded. Prices are shown before you pay.',
  ]],
  ['Learning content', [
    'Lessons are written with care, but languages are rich and mistakes can happen. Lingora does not guarantee a specific learning result or exam outcome. Corrections from other members are their personal opinion.',
  ]],
  ['Availability and changes', [
    'Lingora is provided as it is. Features can change, and short interruptions can occur. If these terms change in an important way, Lingora will tell you in the app.',
  ]],
];

export default function TermsScreen() {
  return (
    <PolicyPage title={t('Terms of use')}>
      {sections.map(([heading, paragraphs]) => (
        <SectionBlock key={heading} heading={heading} paragraphs={paragraphs} />
      ))}
      <AppText variant="heading">{t('Contact')}</AppText>
      <SupportEmail />
    </PolicyPage>
  );
}

function SectionBlock({ heading, paragraphs }: { heading: string; paragraphs: string[] }) {
  return (
    <>
      <AppText variant="heading">{t(heading)}</AppText>
      {paragraphs.map((paragraph) => <AppText key={paragraph}>{t(paragraph)}</AppText>)}
    </>
  );
}
