import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { MedvedSays } from '@/components/medved';
import { AppText, Button, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { track } from '@/lib/insights';
import { supabase } from '@/lib/supabase';

const topics = ['Idea', 'Something is broken', 'Lesson content', 'Other'] as const;

/** In-app feedback: a rating, a topic and a message, straight to the admin overview. */
export default function FeedbackScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const [rating, setRating] = useState<number | null>(null);
  // "Report a problem" in a lesson opens this screen with the topic and the lesson.
  const params = useLocalSearchParams<{ topic?: string; about?: string }>();
  const [topic, setTopic] = useState<string>(topics.find((item) => item === params.topic) ?? topics[0]);
  const [message, setMessage] = useState(params.about ? `[${params.about}]\n` : '');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function send() {
    if (!message.trim()) return;
    setState('sending');
    const { error } = await supabase.from('feedback').insert({ rating, message: message.trim().slice(0, 2000), context: topic });
    if (error) {
      setState('error');
      return;
    }
    track('feedback_sent', { topic });
    setState('sent');
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Send feedback')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {state === 'sent' ? (
            <>
              <MedvedSays mood="cheer" message={t('Thank you! Every message is read and helps make GrammarBay better.')} />
              <Button title={t('Back')} onPress={() => router.back()} />
            </>
          ) : (
            <>
              <MedvedSays message={t('What do you like, what is missing, what is broken? Tell me!')} />
              <AppText variant="heading">{t('How do you like GrammarBay?')}</AppText>
              <View style={styles.stars} accessibilityRole="radiogroup">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable key={value} onPress={() => setRating(value)} accessibilityRole="radio"
                    accessibilityState={{ checked: rating === value }} accessibilityLabel={t('{n} of 5 stars', { n: value })} hitSlop={6}>
                    <AppText style={styles.star}>{rating !== null && value <= rating ? '★' : '☆'}</AppText>
                  </Pressable>
                ))}
              </View>
              <AppText variant="heading">{t('Topic')}</AppText>
              <View style={styles.topics}>
                {topics.map((item) => (
                  <Pressable key={item} onPress={() => setTopic(item)} accessibilityRole="radio" accessibilityState={{ checked: topic === item }}
                    style={[styles.topic, topic === item && styles.topicSelected]}>
                    <AppText variant="callout" color={topic === item ? 'primary' : 'text'}>{t(item)}</AppText>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={2000}
                placeholder={t('Your message…')}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={t('Your message')}
              />
              {state === 'error' ? <AppText color="danger">{t('Sending did not work. Please try again in a moment.')}</AppText> : null}
              <Button title={t('Send')} size="lg" fullWidth disabled={!message.trim()} loading={state === 'sending'} onPress={() => void send()} />
              <AppText variant="small" color="textMuted" align="center">{t('Your username is sent with the message so I can reply if needed.')}</AppText>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl },
  stars: { flexDirection: 'row', gap: spacing.sm },
  star: { fontSize: 36, lineHeight: 42, color: '#F2B705' },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  topic: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  topicSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  input: {
    ...typography.body, minHeight: 140, textAlignVertical: 'top', color: colors.text, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md,
  },
});
