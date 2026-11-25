import { AppText } from '@/components/ui';
import { PolicyPage, SupportEmail } from '@/features/safety/policy-page';
import { t } from '@/lib/i18n';

const sections: [string, string[]][] = [
  ['Information you provide', [
    'GrammarBay uses your email address and password to create and secure your account through Supabase Auth. Your name, username and optional profile details help other signed-in members find suitable language partners.',
    'Posts, comments, profile details and profile photos are shared with the community. Private messages are visible to the people in the conversation and to moderators only when a message is reported.',
  ]],
  ['Guests', [
    'You can start learning as a guest without an email address. GrammarBay then creates an anonymous account so your lessons and progress can be saved. Guests are not visible to other members. If you log out as a guest, this data can no longer be reached.',
  ]],
  ['Learning data', [
    'GrammarBay stores which lessons you finished, your scores, XP, streak, daily goal, gems, badges, saved words and review schedules on its servers so you can continue on any device.',
  ]],
  ['Voice features', [
    'Reading words aloud uses the voice built into your device or browser. Speaking practice and the pronunciation check use your browser’s speech recognition; depending on the browser, audio may be processed by its provider (for example Google or Apple). In exercises GrammarBay itself does not record or store your voice – only voice messages you choose to send in a chat are stored.',
  ]],
  ['Voice messages and calls', [
    'Voice messages you send in a chat are stored in a private storage area that only the members of that chat can open. You can delete your own messages.',
    'Video calls and live rooms open in Jitsi Meet (meet.jit.si), run by 8x8. GrammarBay only creates a random room name; what you say in a call is handled by Jitsi under its own privacy policy.',
  ]],
  ['AI conversation partner', [
    'When you use the AI conversation partner, your messages in that conversation, the chosen situation, your level and the course language are sent to Anthropic (USA) to create the reply. GrammarBay stores only a daily message counter, not the conversation. Do not enter personal data there.',
  ]],
  ['Classes and invitations', [
    'If you join a class, the teacher sees your name and your scores for the assigned lessons. If you use an invite code, GrammarBay stores who invited whom to give both of you Plus days.',
  ]],
  ['Payments and donations', [
    'Donations are handled by PayPal and Plus subscriptions by Stripe. GrammarBay never sees your card or bank details. It only receives the information that a payment succeeded so that Plus can be activated for your account.',
  ]],
  ['How GrammarBay uses information', [
    'GrammarBay uses account and activity information to provide lessons, language matching, messages and the community, and to enforce the Community Guidelines. Supabase provides authentication, database and file storage as a processor. GrammarBay does not sell personal data and shows no advertising.',
  ]],
  ['Your choices and deletion', [
    'You can edit your profile, remove your posts and comments, and block other members. Download a copy of your data in Profile → Settings → Download my data. To permanently delete your account and associated data, go to Profile → Settings → Delete account. You can also ask for corrections by email.',
  ]],
];

export default function PrivacyScreen() {
  return (
    <PolicyPage title={t('GrammarBay Privacy Policy')}>
      {sections.map(([heading, paragraphs]) => (
        <SectionBlock key={heading} heading={heading} paragraphs={paragraphs} />
      ))}
      <AppText variant="heading">{t('Privacy contact')}</AppText>
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
