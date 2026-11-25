import * as Linking from 'expo-linking';

/**
 * Where the email confirmation link sends people back to.
 *
 * The GrammarFirst website build (build-lingora.cjs) rewrites the expression
 * below so the web version under /grammarfirst/lingora/ returns to its own
 * callback page. Keep it as written.
 */
export function confirmationRedirect() {
  return Linking.createURL('auth/callback');
}
