import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  AppText,
  Button,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useDeviceState } from '@/lib/device-state';
import { useSession } from '@/providers/session-provider';
import { clubPracticeContext } from '@/features/clubs/weekly-practice';
import {
  POST_MAX_LENGTH,
  useCreatePost,
  useLanguages,
  usePost,
  useUpdatePost,
  type FeedPost,
  type PostKind,
} from '@/features/community/api';
import { t } from '@/lib/i18n';

/** Create a new post, or edit an existing one when an `id` is passed. */
export default function ComposePostScreen() {
  const { id, kind, clubId, clubName, languageId, practice, practiceWeek } = useLocalSearchParams<{
    id?: string; kind?: string; clubId?: string; clubName?: string; languageId?: string; practice?: string; practiceWeek?: string;
  }>();
  const postQuery = usePost(id);

  if (id && postQuery.isPending) {
    return (
      <Screen>
        <ScreenHeader title={t("Edit post")} />
        <LoadingState />
      </Screen>
    );
  }

  if (id && postQuery.isError) {
    return (
      <Screen>
        <ScreenHeader title={t("Edit post")} />
        <ErrorState message={postQuery.error.message} onRetry={() => postQuery.refetch()} />
      </Screen>
    );
  }

  // `key` resets the form if a different post is opened.
  return (
    <ComposeForm
      key={id ?? 'new'}
      existing={id ? postQuery.data : undefined}
      initialKind={kind === 'question' ? 'question' : 'post'}
      initialLanguageId={languageId}
      clubId={clubId}
      clubName={clubName}
      practice={clubId ? practice : undefined}
      practiceWeek={clubId && practice && /^\d{4}-\d{2}-\d{2}$/.test(practiceWeek ?? '') ? practiceWeek : undefined}
    />
  );
}

function ComposeForm({ existing, initialKind, initialLanguageId, clubId, clubName, practice, practiceWeek }: {
  existing?: FeedPost;
  initialKind: PostKind;
  initialLanguageId?: string;
  clubId?: string;
  clubName?: string;
  practice?: string;
  practiceWeek?: string;
}) {
  const { colors, styles } = useThemedStyles(createStyles);
  const isEditing = !!existing;
  const activity = clubPracticeContext(practice);
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const { user } = useSession();
  const [content, setContent] = useDeviceState(user?.id,
    `post.${existing?.id ?? clubId ?? 'community'}.${practiceWeek ?? initialKind}`, existing?.content ?? '');
  const [saveError, setSaveError] = useState('');
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [kind, setKind] = useState<PostKind>(existing?.kind ?? initialKind);
  const suggestedLanguage = Number(initialLanguageId);
  const [languageId, setLanguageId] = useState<number | null>(
    existing ? existing.language_id : Number.isSafeInteger(suggestedLanguage) && suggestedLanguage > 0
      ? suggestedLanguage : null,
  );
  const languages = useLanguages();
  const needsLanguage = !isEditing && kind === 'question' && languageId === null;

  const shownImageUri = removeExistingImage ? null : existing?.image_url;
  const isSaving = createPost.isPending || updatePost.isPending;
  const canSave = (content.trim().length > 0 || !!shownImageUri) && !isSaving && !needsLanguage;

  function save() {
    setSaveError('');
    const onError = (error: Error) => setSaveError(error.message);
    const onSuccess = () => { setContent(null); router.back(); };

    if (existing) {
      updatePost.mutate(
        { post: existing, content, removeImage: removeExistingImage },
        { onSuccess, onError }
      );
    } else {
      createPost.mutate(
        { content, kind, languageId: kind === 'question' ? languageId : null, clubId: clubId ?? null, practiceWeek },
        { onSuccess, onError }
      );
    }
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title={isEditing ? t("Edit post") : kind === 'question' ? t("Ask a question") : clubName ? `Post in ${clubName}` : t("New post")}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {activity && (
            <View style={styles.languageBlock}>
              <AppText variant="bodyStrong">{t('Weekly practice')} · {activity.title}</AppText>
              <AppText color="textSecondary">{activity.task}</AppText>
            </View>
          )}
          {!isEditing && !practiceWeek ? (
            <View style={styles.kinds} accessibilityRole="tablist">
              {(['post', 'question'] as const).map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setKind(value)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: kind === value }}
                  style={[styles.kind, kind === value && styles.kindActive]}
                >
                  <AppText variant="bodyStrong" color={kind === value ? 'primary' : 'textSecondary'}>
                    {value === 'post' ? '📝 Post' : '❓ Question'}
                  </AppText>
                </Pressable>
              ))}
            </View>
          ) : null}

          {kind === 'question' && !isEditing ? (
            <View style={styles.languageBlock}>
              <AppText variant="caption" color="textSecondary">
                {t("Which language is your question about? Native speakers of it will see it.")}
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.languages}>
                {(languages.data ?? []).map((language) => (
                  <Pressable
                    key={language.id}
                    onPress={() => setLanguageId(language.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: languageId === language.id }}
                    style={[styles.language, languageId === language.id && styles.kindActive]}
                  >
                    <AppText variant="caption" color={languageId === language.id ? 'primary' : 'textSecondary'}>
                      {language.flag_emoji ?? '🌐'} {t(language.name)}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <TextInput
            value={content}
            onChangeText={setContent}
            editable={!isSaving}
                        placeholder={kind === 'question'
              ? 'e.g. What is the difference between “ser” and “estar”?'
              : t("What are you learning today? Share a win or a cultural moment...")}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            autoFocus={!isEditing}
            maxLength={POST_MAX_LENGTH}
            textAlignVertical="top"
            accessibilityLabel={t("Post text")}
          />
          <AppText variant="small" color="textMuted" align="right">
            {content.length}/{POST_MAX_LENGTH}
          </AppText>

          {shownImageUri ? (
            <View>
              <Image source={{ uri: shownImageUri }} style={styles.image} contentFit="cover" />
              <Pressable
                onPress={() => setRemoveExistingImage(true)}
                style={styles.removeImage}
                accessibilityRole="button"
                accessibilityLabel={t("Remove image")}
              >
                <AppText variant="bodyStrong" color="onPrimary">
                  ✕
                </AppText>
              </Pressable>
            </View>
          ) : null}

          <AppText variant="caption" color="textSecondary">
            {t("New photo uploads are temporarily unavailable.")}
          </AppText>
        </ScrollView>

        <View style={styles.footer}>
          {!!saveError && <AppText color="danger" accessibilityLiveRegion="polite">{saveError} {t('Your draft is still here.')}</AppText>}
          <Button
            title={saveError ? t("Try again") : isEditing ? t("Save changes") : t("Publish")}
            size="lg"
            fullWidth
            loading={isSaving}
            disabled={!canSave}
            onPress={save}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  input: {
    ...typography.body,
    color: colors.text,
    minHeight: 160,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  removeImage: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kinds: { flexDirection: 'row', gap: spacing.sm },
  kind: {
    flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
  },
  kindActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  languageBlock: { gap: spacing.sm },
  languages: { gap: spacing.sm },
  language: {
    minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.md,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
  },
  footer: {
    paddingHorizontal: screenPadding,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
