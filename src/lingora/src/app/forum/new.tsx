import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useLanguages } from '@/features/community/api';
import { FORUM_TEXT_MAX, FORUM_TITLE_MAX, forumCategories, useCreateThread, type ForumCategory } from '@/features/forum/api';
import { categoryLabel, Chip } from '@/features/forum/ui';
import { GuestGate } from '@/features/guest/guest-gate';
import { useIsGuest } from '@/features/guest/guest';
import { useActiveCourse } from '@/features/learn/active-course';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';

export default function NewForumThread() {
  const guest = useIsGuest();
  if (guest) return <GuestGate title={t('Ask the community')} message={t('Create a free account to start a topic in the forum.')} />;
  return <Composer />;
}

function Composer() {
  const { colors, styles } = useThemedStyles(createStyles);
  const languages = useLanguages();
  const { course } = useActiveCourse();
  const create = useCreateThread();
  const [category, setCategory] = useState<ForumCategory>('grammar');
  // Preselect the language of the course the learner is on.
  const suggested = languages.data?.find((language) => course && language.language_code?.toLowerCase().startsWith(course.id === 'sh' ? 'hr' : course.id));
  const [languageId, setLanguageId] = useState<number | null | undefined>(undefined);
  const chosenLanguage = languageId === undefined ? suggested?.id ?? null : languageId;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const ready = title.trim().length >= 5 && content.trim().length > 0;

  function submit() {
    create.mutate({ category, languageId: chosenLanguage, title, content }, {
      onSuccess: (id) => { feedback('ok'); router.replace({ pathname: '/forum/[id]', params: { id } }); },
    });
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('New topic')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppText variant="bodyStrong">{t('Topic')}</AppText>
          <View style={styles.wrap}>
            {forumCategories.map((item) => <Chip key={item.id} label={categoryLabel(item.id)} active={category === item.id} onPress={() => setCategory(item.id)} />)}
          </View>
          <AppText variant="bodyStrong">{t('Language')}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            <Chip label={t('No specific language')} active={chosenLanguage === null} onPress={() => setLanguageId(null)} />
            {(languages.data ?? []).filter((language) => language.flag_emoji).map((language) => (
              <Chip key={language.id} label={`${language.flag_emoji} ${t(language.name)}`} active={chosenLanguage === language.id}
                onPress={() => setLanguageId(language.id)} />
            ))}
          </ScrollView>
          <AppText variant="bodyStrong">{t('Title')}</AppText>
          <TextInput value={title} onChangeText={setTitle} maxLength={FORUM_TITLE_MAX} accessibilityLabel={t('Title')}
            placeholder={t('e.g. When do I use the dative in German?')} placeholderTextColor={colors.textMuted} style={styles.input} />
          <AppText variant="bodyStrong">{t('Your question or text')}</AppText>
          <TextInput value={content} onChangeText={setContent} maxLength={FORUM_TEXT_MAX} multiline accessibilityLabel={t('Your question or text')}
            placeholder={t('Describe what you want to know. Want corrections? Write your sentence and say so.')}
            placeholderTextColor={colors.textMuted} style={[styles.input, styles.tall]} />
          <AppText variant="caption" color="textSecondary">{t('Be kind and stay on topic. Personal data and advertising are not allowed.')}</AppText>
          {create.isError ? <AppText color="danger">{create.error.message}</AppText> : null}
          <Button title={create.isPending ? t('Publishing…') : t('Publish topic')} size="lg" disabled={!ready || create.isPending} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  row: { gap: spacing.xs, paddingRight: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, padding: spacing.md, fontSize: 16, minHeight: 48, textAlignVertical: 'top' },
  tall: { minHeight: 160 },
});
