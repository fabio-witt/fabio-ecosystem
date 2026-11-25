import { Button, Screen } from '@/components/ui';
import { LanguageBadges } from '@/features/learn/badges';
import { useLearnSummary } from '@/features/learn/progress';
import { useMyProfile } from '@/features/profile/api';
import { ExchangeDetailsCard } from '@/features/profile/exchange-details-card';
import { useTabReselect } from '@/hooks/use-tab-reselect';
import { useThemedStyles, type ThemeColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';
import { router, useFocusEffect } from 'expo-router';
import { useRef, useCallback, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { t } from '@/lib/i18n';
import { LocationMap } from '@/features/profile/location-map';
import { ReviewsSection } from '@/features/partners/reviews-section';
import { AchievementsGrid } from '@/features/game/achievements-grid';
import { useIsGuest } from '@/features/guest/guest';
import { GuestBanner } from '@/features/guest/guest-gate';
import { DefaultAvatar } from '@/components/default-avatar';

type ProfileData = {
  full_name: string | null;
  username: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  interests: string[] | null;
  native_language: string | null;
  learning_languages: string[] | null;
  avatar_url: string | null;
};

type StatisticsData = {
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  completed_lessons: number;
};

type LanguageData = {
  id: string;
  name: string;
  flag_emoji: string | null;
  language_type: string;
  proficiency_level: string | null;
};

export default function ProfileScreen() {
  const guest = useIsGuest();
  const { data: myProfile } = useMyProfile();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useTabReselect('profile', () => {
    scroll.current?.scrollTo({ y: 0, animated: true });
  });
  const { colors, styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const learnSummary = useLearnSummary().data;
  const [languages, setLanguages] = useState<LanguageData[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [posts, setPosts] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace('/login');
        return;
      }

      const [
        profileResult,
        statisticsResult,
        followersResult,
        followingResult,
        postsResult,
        languagesResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'full_name, username, bio, country, city, interests, native_language, learning_languages, avatar_url'
          )
          .eq('id', user.id)
          .maybeSingle(),

        supabase
          .from('user_statistics')
          .select(
            'current_streak, longest_streak, total_xp, completed_lessons'
          )
          .eq('user_id', user.id)
          .maybeSingle(),

        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id),

        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id),

        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),

        supabase
          .from('user_languages')
          .select(
            'language_type, proficiency_level, languages(id, name, flag_emoji)'
          )
          .eq('user_id', user.id),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (statisticsResult.error) throw statisticsResult.error;
      if (followersResult.error) throw followersResult.error;
      if (followingResult.error) throw followingResult.error;
      if (postsResult.error) throw postsResult.error;
      if (languagesResult.error) throw languagesResult.error;

      setProfile(profileResult.data);
      setStatistics(statisticsResult.data);
      setFollowers(followersResult.count ?? 0);
      setFollowing(followingResult.count ?? 0);
      setPosts(postsResult.count ?? 0);

      const formattedLanguages = (languagesResult.data ?? [])
        .filter((item: any) => item.languages)
        .map((item: any) => ({
          id: item.languages.id,
          name: item.languages.name,
          flag_emoji: item.languages.flag_emoji,
          language_type: item.language_type,
          proficiency_level: item.proficiency_level,
        }));

      setLanguages(formattedLanguages);
    } catch (error: any) {
      Alert.alert(
        t("Error"),
        error.message ?? 'Your profile could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the tab is shown, so a newly started course language appears.
  useFocusEffect(useCallback(() => {
    void loadProfile();
  }, [loadProfile]));

  function openConnections(type: 'followers' | 'following') {
    if (!user) return;
    router.push({
      pathname: '/connections/[id]',
      params: { id: user.id, type, name: profile?.full_name || 'My connections' },
    });
  }

  async function signOut() {
    Alert.alert(
      t("Log out"),
      guest
        ? t('You are a guest. If you log out, your progress on this device is lost. Create a free account first to keep it.')
        : t("Do you really want to log out?"),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Log out'),
          style: 'destructive',
          onPress: async () => {
            // On success, Stack.Protected shows the login screen automatically.
            const { error } = await supabase.auth.signOut();

            if (error) {
              Alert.alert(t("Error"), error.message);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayName = profile?.full_name || 'GrammarBay User';
  const username = profile?.username || 'username';
  const location = [profile?.city, profile?.country]
    .filter(Boolean)
    .join(', ');

  return (
    <Screen>
      <ScrollView
        ref={scroll}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {guest ? <GuestBanner /> : null}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("My Profile")}</Text>
          <Pressable onPress={loadProfile}>
            <Text style={styles.refresh}>↻</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <DefaultAvatar size={90} />
            )}
          </View>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.username}>@{username}</Text>

          {location ? (
            <Text style={styles.location}>📍 {location}</Text>
          ) : null}

          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.emptyText}>
              {t("Add a bio to tell people about yourself.")}
            </Text>
          )}

          <Pressable
            style={styles.editButton}
            onPress={() => router.push('/edit-profile')}
          >
            <Text style={styles.editButtonText}>{t("✎ Edit Profile")}</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{posts}</Text>
            <Text style={styles.statLabel}>{t("Posts")}</Text>
          </View>

          <Pressable
            style={styles.statCard}
            onPress={() => openConnections('followers')}
            accessibilityRole="button"
            accessibilityLabel={t('{n} followers. Show list', { n: followers })}
          >
            <Text style={styles.statNumber}>{followers}</Text>
            <Text style={styles.statLabel}>{t("Followers")}</Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() => openConnections('following')}
            accessibilityRole="button"
            accessibilityLabel={t('{n} following. Show list', { n: following })}
          >
            <Text style={styles.statNumber}>{following}</Text>
            <Text style={styles.statLabel}>{t("Following")}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Learning Statistics")}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.learningCard}>
              <Text style={styles.learningNumber}>
                {learnSummary?.streak ?? statistics?.current_streak ?? 0}
              </Text>
              <Text style={styles.learningLabel}>{t("🔥 Day Streak")}</Text>
            </View>

            <View style={styles.learningCard}>
              <Text style={styles.learningNumber}>
                {learnSummary?.total_xp ?? statistics?.total_xp ?? 0}
              </Text>
              <Text style={styles.learningLabel}>{t("⭐ Total XP")}</Text>
            </View>

            <View style={styles.learningCard}>
              <Text style={styles.learningNumber}>
                {statistics?.completed_lessons ?? 0}
              </Text>
              <Text style={styles.learningLabel}>{t("📚 Lessons")}</Text>
            </View>

            <View style={styles.learningCard}>
              <Text style={styles.learningNumber}>
                {statistics?.longest_streak ?? 0}
              </Text>
              <Text style={styles.learningLabel}>{t("🏆 Best Streak")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("My Languages")}</Text>

          {languages.length === 0 ? (
            <Text style={styles.emptyText}>
              {t("No languages added yet. You can add them later.")}
            </Text>
          ) : (
            languages.map((language) => (
              <View key={language.id} style={styles.languageCard}>
                <Text style={styles.languageFlag}>
                  {language.flag_emoji || '🌐'}
                </Text>

                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>
                    {t(language.name)}
                  </Text>

                  <Text style={styles.languageLevel}>
                    {language.language_type === 'native'
                      ? t("Native language")
                      : `Learning · ${language.proficiency_level ?? 'No level set'}`}
                  </Text>
                </View>

                <View
                  style={[
                    styles.languageBadge,
                    language.language_type === 'native'
                      ? styles.nativeBadge
                      : styles.learningBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.languageBadgeText,
                      language.language_type === 'native'
                        ? styles.nativeBadgeText
                        : styles.learningBadgeText,
                    ]}
                  >
                    {language.language_type === 'native'
                      ? t("Native")
                      : language.proficiency_level ?? '—'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("My Interests")}</Text>

          <View style={styles.interests}>
            {(profile?.interests ?? []).length > 0 ? (
              profile!.interests!.map((interest, index) => (
                <View
                  key={`${interest}-${index}`}
                  style={styles.interestTag}
                >
                  <Text style={styles.interestText}>{t(interest)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                {t("No interests added yet.")}
              </Text>
            )}
          </View>
        </View>

        <LocationMap city={profile?.city} country={profile?.country} />
        <ExchangeDetailsCard details={myProfile?.profile} />
        {user ? <LanguageBadges userId={user.id} isMe /> : null}
        <Button title={t('📈 My statistics')} variant="secondary" onPress={() => router.push('/stats')} />
        <Button title={t('💬 Send feedback')} variant="ghost" onPress={() => router.push('/feedback')} />
        {user ? <AchievementsGrid /> : null}
        <View style={styles.vipRow}>
          <Button title={t("🎩 Fabio's wardrobe")} variant="secondary" style={styles.vipButton} onPress={() => router.push('/shop')} />
          <Button title={t('⭐ VIP')} style={styles.vipButton} onPress={() => router.push('/vip')} />
        </View>
        {user ? <ReviewsSection userId={user.id} name={profile?.full_name || t('You')} isMe /> : null}

        {/* Clear space between the reviews and the account section. */}
        <View style={styles.sectionGap} />
        <Button title={t("Settings")} variant="secondary" onPress={() => router.push('/settings')} />

        <Pressable style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutText}>{t("Log out")}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  vipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  sectionGap: { height: 32, marginTop: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle, marginBottom: 24 },
  vipButton: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 50,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  refresh: {
    fontSize: 28,
    color: colors.primary,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.action,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: 38,
    fontWeight: '800',
  },
  name: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.text,
  },
  username: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  location: {
    color: colors.textSecondary,
    marginTop: 10,
  },
  bio: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  editButton: {
    backgroundColor: colors.action,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
    marginTop: 20,
  },
  editButtonText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  learningCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 18,
  },
  learningNumber: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.primary,
  },
  learningLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  languageCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 14,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  languageLevel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  languageBadge: {
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  nativeBadge: {
    backgroundColor: colors.successSoft,
  },
  learningBadge: {
    backgroundColor: colors.primarySoft,
  },
  languageBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  nativeBadgeText: {
    color: colors.success,
  },
  learningBadgeText: {
    color: colors.primary,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  interestTag: {
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  interestText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
});
