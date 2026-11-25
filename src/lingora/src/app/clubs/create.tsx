import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useCreateClub } from '@/features/clubs/api';
import { useLanguages } from '@/features/community/api';
import { t } from '@/lib/i18n';

const EMOJIS = ['💬', '📚', '🎧', '🎬', '☕', '🍝', '⚽', '✈️', '🎵', '💼', '🏙️', '🎮'];

export default function CreateClubScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const create = useCreateClub();
  const languages = useLanguages();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [languageId, setLanguageId] = useState<number | null>(null);
  const valid = name.trim().length >= 3;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t("New club")} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppText variant="heading">{t("Name")}</AppText>
          <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={60}
            placeholder={t("e.g. Spanish movie night")} placeholderTextColor={colors.textMuted} accessibilityLabel={t("Club name")} />

          <AppText variant="heading">{t("Description")}</AppText>
          <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription}
            maxLength={300} multiline placeholder={t("What do members do together?")} placeholderTextColor={colors.textMuted}
            accessibilityLabel={t("Club description")} />

          <AppText variant="heading">{t("Icon")}</AppText>
          <View style={styles.wrap}>
            {EMOJIS.map((item) => (
              <Pressable key={item} onPress={() => setEmoji(item)} accessibilityRole="radio"
                accessibilityState={{ selected: emoji === item }} style={[styles.emoji, emoji === item && styles.selected]}>
                <AppText style={styles.emojiText}>{item}</AppText>
              </Pressable>
            ))}
          </View>

          <AppText variant="heading">{t("Language")} <AppText color="textMuted">{t("(optional)")}</AppText></AppText>
          <View style={styles.wrap}>
            {(languages.data ?? []).map((language) => (
              <Pressable key={language.id} onPress={() => setLanguageId(languageId === language.id ? null : language.id)}
                accessibilityRole="radio" accessibilityState={{ selected: languageId === language.id }}
                style={[styles.chip, languageId === language.id && styles.selected]}>
                <AppText variant="caption" color={languageId === language.id ? 'primary' : 'textSecondary'}>
                  {language.flag_emoji ?? '🌐'} {t(language.name)}
                </AppText>
              </Pressable>
            ))}
          </View>

          {create.isError ? <AppText color="danger">{create.error.message}</AppText> : null}
          <Button
            title={t("Create club")}
            disabled={!valid}
            loading={create.isPending}
            onPress={() => create.mutate({ name: name.trim(), description: description.trim(), emoji, languageId }, {
              onSuccess: (clubId) => router.replace({ pathname: '/clubs/[id]', params: { id: clubId } }),
            })}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl },
  input: {
    ...typography.body, minHeight: 46, paddingHorizontal: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text,
  },
  multiline: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emoji: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border },
  emojiText: { fontSize: 24, lineHeight: 30 },
  chip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
