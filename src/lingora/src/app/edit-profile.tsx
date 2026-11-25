import { useThemedStyles, type ThemeColors } from '@/constants/theme';
import { profileKeys } from '@/features/profile/api';
import {
  exchangeFields, interestOptions, joinAnswers, splitAnswers, type ExchangeDetails,
} from '@/features/profile/exchange-details';
import { Button, Select } from '@/components/ui';
import { pickImage, uploadImage } from '@/lib/image-upload';
import { userKeys } from '@/features/users/api';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { t } from '@/lib/i18n';
import { DefaultAvatar } from '@/components/default-avatar';
import { recommendStarter } from '@/features/onboarding/recommendation';

type Language = {
  id: number;
  name: string;
  flag_emoji: string | null;
};

type UserLanguage = {
  language_id: number;
  language_type: string;
  proficiency_level: string | null;
  language: Language;
};

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function EditProfileScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const queryClient = useQueryClient();

  // When leaving this screen, reload profile data everywhere (Home, Profile)
  // so changes to photo, bio or languages show up immediately.
  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    };
  }, [queryClient]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [addingLanguage, setAddingLanguage] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [interests, setInterests] = useState('');
  const [exchangeDetails, setExchangeDetails] = useState<ExchangeDetails | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [languageCatalog, setLanguageCatalog] = useState<Language[]>([]);
  const [userLanguages, setUserLanguages] = useState<UserLanguage[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<'native' | 'learning'>('learning');
  const [selectedLevel, setSelectedLevel] = useState('B1');

  async function loadProfile() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(t("Error"), t("You are not signed in."));
        router.replace('/login');
        return;
      }

      const [profileResult, catalogResult, userLanguagesResult] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(),

          supabase
            .from('languages')
            .select('id, name, flag_emoji')
            .order('name'),

          supabase
            .from('user_languages')
            .select(
              'language_id, language_type, proficiency_level, languages(id, name, flag_emoji)'
            )
            .eq('user_id', user.id),
        ]);

      if (profileResult.error) throw profileResult.error;
      if (catalogResult.error) throw catalogResult.error;
      if (userLanguagesResult.error) throw userLanguagesResult.error;

      if (profileResult.data) {
        setFullName(profileResult.data.full_name ?? '');
        setUsername(profileResult.data.username ?? '');
        setBio(profileResult.data.bio ?? '');
        setCountry(profileResult.data.country ?? '');
        setCity(profileResult.data.city ?? '');
        setInterests((profileResult.data.interests ?? []).join(', '));
        setAvatarUrl(profileResult.data.avatar_url ?? null);
        const profile = profileResult.data;
        if (exchangeFields.every(({ key }) => key in profile)) {
          setExchangeDetails(Object.fromEntries(exchangeFields.map(({ key }) => [key, profile[key]])));
        }
      }

      setLanguageCatalog(catalogResult.data ?? []);

      const formattedLanguages = (userLanguagesResult.data ?? [])
        .filter((item: any) => item.languages)
        .map((item: any) => ({
          language_id: item.language_id,
          language_type: item.language_type,
          proficiency_level: item.proficiency_level,
          language: item.languages,
        }));

      setUserLanguages(formattedLanguages);
    } catch (error: any) {
      Alert.alert(
        t("Error"),
        error.message ?? 'Your profile could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function changeAvatar() {
    if (uploadingAvatar) return;
    setAvatarError(null);
    try {
      const asset = await pickImage({ aspect: [1, 1] });
      if (!asset) return;
      setUploadingAvatar(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("You are not signed in."));
      const { publicUrl } = await uploadImage({ bucket: 'avatars', folder: user.id, asset, fileNamePrefix: 'avatar' });
      const { error } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (error) throw error;
      setAvatarUrl(publicUrl);
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(user.id) });
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'The photo could not be uploaded. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function removeAvatar() {
    if (!avatarUrl || removingAvatar) return;

    setRemovingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("You are not signed in."));
      const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
      if (error) throw error;
      setAvatarUrl(null);
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(user.id) });
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    } catch (error) {
      Alert.alert(t("Could not remove photo"), error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setRemovingAvatar(false);
    }
  }

  async function addLanguage() {
    if (selectedLanguageId === null) {
      Alert.alert(t("Choose a language"), t("Choose a language first."));
      return;
    }

    if (userLanguages.some((item) => item.language_id === selectedLanguageId)) {
      Alert.alert(
        t("Already added"),
        t("This language is already on your profile.")
      );
      return;
    }

    setAddingLanguage(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(t("You are not signed in."));
      }

      const { error } = await supabase.from('user_languages').insert({
        user_id: user.id,
        language_id: selectedLanguageId,
        language_type: selectedType,
        proficiency_level:
          selectedType === 'native' ? 'Native' : selectedLevel,
      });

      if (error) throw error;

      const selectedLanguage = languageCatalog.find(
        (language) => language.id === selectedLanguageId
      );

      if (selectedLanguage) {
        setUserLanguages((current) => [
          ...current,
          {
            language_id: selectedLanguage.id,
            language_type: selectedType,
            proficiency_level:
              selectedType === 'native' ? 'Native' : selectedLevel,
            language: selectedLanguage,
          },
        ]);
      }

      setSelectedLanguageId(null);
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(user.id) });
      Alert.alert(t("Saved"), t("The language was added to your profile."));
    } catch (error: any) {
      Alert.alert(
        t("Error"),
        error.message ?? 'The language could not be added.'
      );
    } finally {
      setAddingLanguage(false);
    }
  }

  async function updateLanguageLevel(
    languageId: number,
    level: string
  ) {
    try {
      const { error } = await supabase
        .from('user_languages')
        .update({ proficiency_level: level })
        .eq('language_id', languageId);

      if (error) throw error;

      setUserLanguages((current) =>
        current.map((item) =>
          item.language_id === languageId
            ? { ...item, proficiency_level: level }
            : item
        )
      );
    } catch (error: any) {
      Alert.alert(t("Error"), error.message ?? 'The proficiency level could not be updated.');
    }
  }

  async function removeLanguage(languageId: number) {
    Alert.alert(
      t("Remove language"),
      t("Remove this language from your profile?"),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const {
                data: { user },
                error: userError,
              } = await supabase.auth.getUser();

              if (userError || !user) {
                throw new Error(t("You are not signed in."));
              }

              const { error } = await supabase
                .from('user_languages')
                .delete()
                .eq('user_id', user.id)
                .eq('language_id', languageId);

              if (error) throw error;

              setUserLanguages((current) =>
                current.filter((item) => item.language_id !== languageId)
              );
            } catch (error: any) {
              Alert.alert(
                t("Error"),
                error.message ?? 'The language could not be removed.'
              );
            }
          },
        },
      ]
    );
  }

  async function saveProfile() {
    if (!fullName.trim()) {
      Alert.alert(t("Error"), t("Enter your full name."));
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9_.]{3,20}$/.test(cleanUsername)) {
      Alert.alert(
        t("Invalid username"),
        t("Use 3–20 characters: lowercase letters, numbers, periods or underscores.")
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(t("You are not signed in."));
      }

      const cleanInterests = interests
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: cleanUsername,
          bio: bio.trim() || null,
          country: country.trim() || null,
          city: city.trim() || null,
          interests: cleanInterests,
          ...(exchangeDetails && Object.fromEntries(
            exchangeFields.map(({ key }) => [key, exchangeDetails[key]?.trim() || null])
          )),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          t("Your profile could not be found. Please sign in again.")
        );
      }

      void queryClient.invalidateQueries({ queryKey: userKeys.detail(user.id) });
      Alert.alert(t("Saved"), t("Your profile was updated."));
      router.back();
    } catch (error: any) {
      Alert.alert(
        t("Could not save changes"),
        error.message ?? 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const availableLanguages = languageCatalog.filter(
    (language) =>
      !userLanguages.some((item) => item.language_id === language.id)
      // Only languages with a GrammarBay course can be added as learning languages.
      && (selectedType === 'native' || !!recommendStarter({ name: language.name }, 'A1'))
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backButton}>{t("‹ Back")}</Text>
          </Pressable>

          <Text style={styles.title}>{t("Edit Profile")}</Text>
          <Text style={styles.subtitle}>
            {t("Update your profile and languages.")}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t("Profile photo")}</Text>

          <View style={styles.avatarSection}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <DefaultAvatar size={90} />
              </View>
            )}
            <View style={styles.avatarInfo}>
              <Button
                title={avatarUrl ? t("Change photo") : t("Upload photo")}
                variant="secondary"
                size="sm"
                loading={uploadingAvatar}
                disabled={removingAvatar}
                onPress={changeAvatar}
                style={styles.avatarButton}
              />
              <Text style={styles.avatarHint}>{t("JPG, PNG or WebP, up to 5 MB. Square photos look best.")}</Text>
              {avatarError ? <Text style={styles.avatarError}>{avatarError}</Text> : null}
              {avatarUrl && (
                <Pressable onPress={removeAvatar} disabled={removingAvatar} accessibilityRole="button">
                  <Text style={styles.removeText}>{removingAvatar ? t("Removing…") : t("Remove photo")}</Text>
                </Pressable>
              )}
            </View>
          </View>

          <Text style={styles.label}>{t("Full name")}</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t("Your name")}
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>{t("Username")}</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="username"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t("Bio")}</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder={t("Tell us a little about yourself")}
            placeholderTextColor="#999"
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{bio.length}/300</Text>

          <Text style={styles.label}>{t("Country")}</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder={t("e.g. Switzerland")}
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>{t("City")}</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder={t("e.g. Zurich")}
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>{t("Interests")}</Text>
          <Select
            label={t("Interests")}
            options={interestOptions}
            multiple
            max={8}
            value={splitAnswers(interests)}
            onChange={(values) => setInterests(joinAnswers(values))}
          />

          {exchangeDetails && (
            <View style={styles.languageSection}>
              <Text style={styles.sectionTitle}>{t("Language exchange")}</Text>
              <Text style={styles.hint}>{t("Optional details visible to signed-in GrammarBay users.")}</Text>
              {exchangeFields.map(({ key, label, options, multiple, max }) => (
                <View key={key}>
                  <Text style={styles.label}>{t(label)}</Text>
                  <Select
                    label={label}
                    options={options}
                    multiple={multiple}
                    max={max}
                    value={splitAnswers(exchangeDetails[key])}
                    onChange={(values) => setExchangeDetails((current) => ({ ...current, [key]: joinAnswers(values) }))}
                  />
                </View>
              ))}
            </View>
          )}

          <View style={styles.languageSection}>
            <Text style={styles.sectionTitle}>{t("My languages")}</Text>
            <Text style={styles.hint}>
              {t("Add your native languages and the ones you are learning.")}
            </Text>

            {userLanguages.map((item) => (
              <View key={item.language_id} style={styles.userLanguageCard}>
                <View style={styles.languageHeader}>
                  <Text style={styles.languageName}>
                    {item.language.flag_emoji || '🌐'} {item.language.name}
                  </Text>
                  <Pressable
                    onPress={() => removeLanguage(item.language_id)}
                  >
                    <Text style={styles.removeText}>{t("Remove")}</Text>
                  </Pressable>
                </View>

                <Text style={styles.languageType}>
                  {item.language_type === 'native'
                    ? t("Native language")
                    : t("Learning")}
                </Text>

                {item.language_type === 'learning' ? (
                  <View style={styles.levelRow}>
                    {LEVELS.map((level) => (
                      <Pressable
                        key={level}
                        style={[
                          styles.levelButton,
                          item.proficiency_level === level &&
                            styles.levelButtonActive,
                        ]}
                        onPress={() =>
                          updateLanguageLevel(item.language_id, level)
                        }
                      >
                        <Text
                          style={[
                            styles.levelText,
                            item.proficiency_level === level &&
                              styles.levelTextActive,
                          ]}
                        >
                          {level}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.nativeLevel}>{t("Native")}</Text>
                )}
              </View>
            ))}

            <Text style={styles.label}>{t("Add a language")}</Text>

            <View style={styles.typeRow}>
              <Pressable
                style={[
                  styles.typeButton,
                  selectedType === 'native' && styles.typeButtonActive,
                ]}
                onPress={() => setSelectedType('native')}
              >
                <Text
                  style={[
                    styles.typeText,
                    selectedType === 'native' && styles.typeTextActive,
                  ]}
                >
                  {t("Native")}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeButton,
                  selectedType === 'learning' && styles.typeButtonActive,
                ]}
                onPress={() => setSelectedType('learning')}
              >
                <Text
                  style={[
                    styles.typeText,
                    selectedType === 'learning' && styles.typeTextActive,
                  ]}
                >
                  {t("Learning")}
                </Text>
              </Pressable>
            </View>

            <View style={styles.languagePicker}>
              {availableLanguages.map((language) => (
                <Pressable
                  key={language.id}
                  style={[
                    styles.languageOption,
                    selectedLanguageId === language.id &&
                      styles.languageOptionActive,
                  ]}
                  onPress={() => setSelectedLanguageId(language.id)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      selectedLanguageId === language.id &&
                        styles.languageOptionTextActive,
                    ]}
                  >
                    {language.flag_emoji || '🌐'} {t(language.name)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {selectedType === 'learning' && (
              <>
                <Text style={styles.label}>{t("Your proficiency level")}</Text>
                <View style={styles.levelRow}>
                  {LEVELS.map((level) => (
                    <Pressable
                      key={level}
                      style={[
                        styles.levelButton,
                        selectedLevel === level && styles.levelButtonActive,
                      ]}
                      onPress={() => setSelectedLevel(level)}
                    >
                      <Text
                        style={[
                          styles.levelText,
                          selectedLevel === level && styles.levelTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Pressable
              style={[
                styles.addLanguageButton,
                (!selectedLanguageId || addingLanguage) &&
                  styles.disabledButton,
              ]}
              onPress={addLanguage}
              disabled={!selectedLanguageId || addingLanguage}
            >
              {addingLanguage ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.addLanguageText}>
                  {t("+ Add language")}
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.saveButton,
              (saving || removingAvatar || addingLanguage) &&
                styles.disabledButton,
            ]}
            accessibilityRole="button"
            onPress={saveProfile}
            disabled={saving || removingAvatar || addingLanguage}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>
                {t("Save changes")}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 65,
    paddingBottom: 50,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 25,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 8,
  },
  form: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 8,
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primarySoft,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
  },
  avatarInfo: {
    flex: 1,
  },
  avatarHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 5,
    lineHeight: 18,
  },
  avatarButton: { alignSelf: 'flex-start' },
  avatarError: {
    fontSize: 13,
    color: colors.danger,
    marginTop: 5,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  bioInput: {
    minHeight: 110,
  },
  counter: {
    color: '#999',
    fontSize: 12,
    textAlign: 'right',
  },
  hint: {
    color: '#888',
    fontSize: 12,
    marginTop: -4,
    lineHeight: 18,
  },
  languageSection: {
    marginTop: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.text,
  },
  userLanguageCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 15,
    marginTop: 4,
  },
  languageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  removeText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  languageType: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 12,
  },
  nativeLevel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  typeText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  typeTextActive: {
    color: colors.primary,
  },
  languagePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageOption: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  languageOptionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  languageOptionText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  languageOptionTextActive: {
    color: colors.primary,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  levelButtonActive: {
    backgroundColor: colors.action,
    borderColor: colors.primary,
  },
  levelText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  levelTextActive: {
    color: colors.onPrimary,
  },
  addLanguageButton: {
    backgroundColor: colors.action,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  addLanguageText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: colors.action,
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 25,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
