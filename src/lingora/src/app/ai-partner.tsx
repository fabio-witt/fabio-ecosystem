import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Medved } from '@/components/medved';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { Chip } from '@/features/forum/ui';
import { useIsGuest } from '@/features/guest/guest';
import { useActiveCourse } from '@/features/learn/active-course';
import { cefrLevels, type CefrLevel } from '@/features/learn/catalog';
import { feedback } from '@/lib/feedback';
import { getUiLanguage, t } from '@/lib/i18n';
import { canSpeak, speak } from '@/lib/speech';
import { supabase } from '@/lib/supabase';

const SCENARIOS: [string, string, string][] = [
  ['☕', 'At the café', 'You are a waiter in a café. The learner orders drinks and something to eat.'],
  ['🏠', 'Flat viewing', 'You are a landlord showing a flat. The learner asks about rent, rooms and the neighbourhood.'],
  ['🩺', 'At the doctor', 'You are a friendly doctor. The learner describes how they feel.'],
  ['💼', 'Job interview', 'You interview the learner for a job they choose. Ask about experience and strengths.'],
  ['🤝', 'Small talk with a colleague', 'You are a new colleague at the coffee machine. Make small talk about the weekend and work.'],
  ['🛵', 'Renting a scooter', 'You rent out scooters on holiday. The learner wants one for a week.'],
  ['🗺', 'Asking the way', 'You are a local. The learner is lost and asks for directions to the station.'],
];

type Turn = { role: 'user' | 'assistant'; content: string; correction?: string | null; explanation?: string | null; translation?: string };

/** Role-play with an AI partner that answers in the course language and gently corrects. */
export default function AiPartnerScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const guest = useIsGuest();
  const { course } = useActiveCourse();
  const [scenario, setScenario] = useState<[string, string, string]>();
  const [level, setLevel] = useState<CefrLevel>('A2');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [shown, setShown] = useState<Set<number>>(new Set());
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  async function send() {
    const text = draft.trim();
    if (!text || !scenario || !course || busy) return;
    const next: Turn[] = [...turns, { role: 'user', content: text }];
    setTurns(next); setDraft(''); setBusy(true); setError(null);
    feedback('tap');
    const { data, error: callError } = await supabase.functions.invoke('ai-partner', {
      body: { language: course.name, level, scenario: scenario[2], uiLanguage: getUiLanguage(),
        messages: next.map((turn) => ({ role: turn.role, content: turn.content })) },
    });
    setBusy(false);
    if (callError || !data?.reply) {
      let code = 'server';
      try { code = (await (callError as { context?: Response })?.context?.json())?.error ?? code; } catch { /* keep default */ }
      setError(code === 'not_configured' ? t('The AI partner is being set up. Please check back soon.')
        : code === 'limit' ? t('You reached today’s limit. Plus members can practise much more.')
          : code === 'account_needed' ? t('Create a free account to talk with the AI partner.')
            : t('The AI partner could not answer. Please try again.'));
      setTurns(turns);
      setDraft(text);
      return;
    }
    feedback(data.correction ? 'bad' : 'ok');
    // The correction belongs to the learner's message.
    const withCorrection = next.map((turn, index) => index === next.length - 1 ? { ...turn, correction: data.correction, explanation: data.explanation } : turn);
    setTurns([...withCorrection, { role: 'assistant', content: data.reply, translation: data.translation }]);
    setRemaining(typeof data.remaining === 'number' ? data.remaining : null);
    if (course && canSpeak(course.id)) speak(data.reply, course.id);
    requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: true }));
  }

  if (!course) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <ScreenHeader title={t('AI conversation')} />
        <View style={styles.content}><AppText>{t('Choose a course first.')}</AppText><Button title={t('Open Learn')} onPress={() => router.replace('/learn')} /></View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={scenario ? t(scenario[1]) : t('AI conversation')} right={scenario ? <Button title={t('New')} size="sm" variant="secondary" onPress={() => { setScenario(undefined); setTurns([]); }} /> : undefined} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!scenario ? (
            <>
              <Card style={styles.center}>
                <Medved mood="happy" size={90} />
                <AppText variant="title" align="center">{t('Practise real conversations')}</AppText>
                <AppText align="center" color="textSecondary">{t('Pick a situation. Your AI partner answers in {course}, adapts to your level and corrects your mistakes kindly.', { course: t(course.name) })}</AppText>
                {guest ? <AppText align="center">{t('Create a free account to talk with the AI partner.')}</AppText> : null}
              </Card>
              <AppText variant="bodyStrong">{t('Your level')}</AppText>
              <View style={styles.wrap}>{cefrLevels.map((item) => <Chip key={item} label={item} active={level === item} onPress={() => setLevel(item)} />)}</View>
              <AppText variant="bodyStrong">{t('Situation')}</AppText>
              {SCENARIOS.map((item) => (
                <Button key={item[1]} title={`${item[0]}  ${t(item[1])}`} variant="secondary" disabled={guest}
                  onPress={() => { setScenario(item); setTurns([]); }} />
              ))}
            </>
          ) : (
            <>
              <AppText variant="caption" color="textSecondary">{t('Start the conversation – say hello in {course}.', { course: t(course.name) })}</AppText>
              {turns.map((turn, index) => (
                <View key={index} style={[styles.bubble, turn.role === 'user' ? styles.mine : styles.theirs]}>
                  <AppText color={turn.role === 'user' ? 'onPrimary' : 'text'} selectable>{turn.content}</AppText>
                  {turn.role === 'user' && turn.correction ? (
                    <View style={styles.correction}>
                      <AppText variant="small" style={styles.correctionLabel}>{t('✏️ Better:')}</AppText>
                      <AppText style={styles.correctionText} selectable>{turn.correction}</AppText>
                      {turn.explanation ? <AppText variant="caption" color="textSecondary">{turn.explanation}</AppText> : null}
                    </View>
                  ) : null}
                  {turn.role === 'assistant' ? (
                    <View style={styles.tools}>
                      {canSpeak(course.id) ? <Button title="🔊" size="sm" variant="ghost" accessibilityLabel={t('Listen')} onPress={() => speak(turn.content, course.id)} /> : null}
                      <Button title={shown.has(index) ? t('Hide translation') : t('Translate')} size="sm" variant="ghost"
                        onPress={() => setShown((current) => { const copy = new Set(current); if (copy.has(index)) copy.delete(index); else copy.add(index); return copy; })} />
                    </View>
                  ) : null}
                  {turn.role === 'assistant' && shown.has(index) ? <AppText variant="caption" color="textSecondary">{turn.translation}</AppText> : null}
                </View>
              ))}
              {busy ? <AppText color="textSecondary">{t('Your partner is typing…')}</AppText> : null}
              {error ? <AppText color="danger">{error}</AppText> : null}
              {remaining !== null ? <AppText variant="caption" color="textSecondary">{t('{n} messages left today', { n: remaining })}</AppText> : null}
            </>
          )}
        </ScrollView>
        {scenario ? (
          <View style={styles.composer}>
            <TextInput style={styles.input} value={draft} onChangeText={setDraft} placeholder={t('Write in {course}…', { course: t(course.name) })}
              placeholderTextColor={colors.textMuted} multiline maxLength={1000} accessibilityLabel={t('Your message')}
              onSubmitEditing={() => void send()} />
            <Button title={t('Send')} size="sm" disabled={!draft.trim() || busy} onPress={() => void send()} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.sm },
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  bubble: { maxWidth: '88%', borderRadius: radius.lg, padding: spacing.md, gap: 6 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle },
  correction: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, gap: 2 },
  correctionLabel: { fontWeight: '800', color: colors.success },
  correctionText: { fontWeight: '700', color: colors.text },
  tools: { flexDirection: 'row', gap: 4 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: screenPadding, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, ...typography.callout, color: colors.text, maxHeight: 120, minHeight: 44, paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.background },
});
