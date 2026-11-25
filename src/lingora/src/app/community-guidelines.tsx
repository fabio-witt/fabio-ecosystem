import { AppText } from '@/components/ui';
import { PolicyPage, SupportEmail } from '@/features/safety/policy-page';

export default function CommunityGuidelinesScreen() {
  return (
    <PolicyPage title="Community Guidelines">
      <AppText>GrammarBay is for learning languages and respectful exchange. These rules apply to profiles, posts, comments and private messages.</AppText>
      <AppText variant="heading">Keep the community safe</AppText>
      <AppText>Harassment, threats, hateful or discriminatory conduct, sexual exploitation, explicit sexual content, glorification of violence, scams, spam and sharing private information without consent are prohibited.</AppText>
      <AppText variant="heading">Report or block</AppText>
      <AppText>Use Report on a profile, post, comment or message to notify GrammarBay. Use Block user on a profile or in a chat to stop contact. You can manage your blocks under Profile → Settings.</AppText>
      <AppText variant="heading">How GrammarBay responds</AppText>
      <AppText>GrammarBay reviews reports and may remove content or restrict accounts that break these rules. Contact support for help or to ask about a moderation decision.</AppText>
      <SupportEmail />
    </PolicyPage>
  );
}
