import { useActiveCourse } from '@/features/learn/active-course';
import { courses, findLesson } from '@/features/learn/catalog';
import { conversationTask } from '@/features/learn/conversation-tasks';
import { takeCourse, takeExchange } from '@/features/learn/course-entry';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { getThemeColors, ThemeColorsContext } from '@/constants/theme';
import '@/lib/web-alert';
import { t, useT } from '@/lib/i18n';
import { takePasswordRecovery } from '@/lib/recovery-flag';
import { ReminderSync } from '@/features/notifications/reminder-sync';
import { QueryProvider } from '@/providers/query-provider';
import { SessionProvider, useSession } from '@/providers/session-provider';
import { CelebrationLayer } from '@/features/game/celebrations';
import { HintLayer } from '@/components/hint';
import { PendingResultsSync } from '@/features/game/pending-sync';
import { StateSync } from '@/features/sync/state-sync';
import { registerOfflineMode } from '@/lib/offline';
import { installGlobalErrorReporting, reportError } from '@/lib/insights';

/** Friendly screen instead of a blank page when a screen crashes. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#0F1420' }}>
      <Text style={{ fontSize: 48 }}>🐻</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' }}>{t('Something went wrong')}</Text>
      <Text style={{ fontSize: 15, color: '#B6BECF', textAlign: 'center' }}>
        {t('Your progress is safe. Try again, and if it keeps happening please contact support.')}
      </Text>
      <Pressable onPress={retry} accessibilityRole="button"
        style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#E5262B' }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>{t('Try again')}</Text>
      </Pressable>
      {__DEV__ ? <Text style={{ color: '#B6BECF', fontSize: 12 }}>{error.message}</Text> : null}
      <ReportOnce error={error} />
    </View>
  );
}

/** Sends a crash once to the admin overview. */
function ReportOnce({ error }: { error: Error }) {
  useEffect(() => { reportError(error); }, [error]);
  return null;
}

installGlobalErrorReporting();
registerOfflineMode();

// Keep the splash screen visible until we know whether a user is signed in.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const { language } = useT();
  const colors = getThemeColors(isDark);
  const base = isDark ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <ThemeColorsContext.Provider value={colors}>
      <ThemeProvider value={theme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <QueryProvider>
          <SessionProvider>
            <SplashScreenController />
            <ReminderSync />
            {/* Rebuild every screen when the app language changes. */}
            <RootNavigator key={language} />
            <PendingResultsSync />
            <StateSync />
            <CelebrationLayer />
            <HintLayer />
          </SessionProvider>
        </QueryProvider>
      </ThemeProvider>
    </ThemeColorsContext.Provider>
  );
}

function SplashScreenController() {
  const { isLoading } = useSession();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hide();
    }
  }, [isLoading]);

  return null;
}

function RootNavigator() {
  const { session, isLoading } = useSession();
  const isSignedIn = !!session;
  const { choose } = useActiveCourse();

  // A password reset link signs the person in; then ask for the new password.
  useEffect(() => {
    if (!isSignedIn || isLoading) return;
    const timer = setTimeout(() => {
      if (takePasswordRecovery()) {
        router.replace('/reset-password');
        return;
      }
      const task = session?.user.is_anonymous ? null : takeExchange();
      if (task && conversationTask(task)) {
        router.replace({ pathname: '/community', params: { section: 'partners', task } });
        return;
      }
      const entry = takeCourse();
      if (entry && courses.some(course => course.id === entry.id)) {
        choose(entry.id);
        const lesson = entry.lesson && findLesson(entry.lesson);
        router.replace(lesson && lesson.course.id === entry.id
          ? { pathname: '/lesson/[id]', params: { id: lesson.entry.id } }
          : '/learn');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isSignedIn, isLoading, choose, session?.user.is_anonymous]);

  // Splash screen is still visible while loading.
  if (isLoading) return null;

  return (
    <Stack key={session?.user.id ?? 'guest'} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="explore" />
      {/* Only reachable when signed in */}
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="lesson-recall" />
        <Stack.Screen name="correction-review" />
        <Stack.Screen name="practice-review" />
        <Stack.Screen name="course-search" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="delete-account" />
        <Stack.Screen name="safety-action" />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="review/[id]" />
        <Stack.Screen name="clubs/index" />
        <Stack.Screen name="clubs/[id]" />
        <Stack.Screen name="clubs/create" />
        <Stack.Screen name="forum/index" />
        <Stack.Screen name="forum/[id]" />
        <Stack.Screen name="forum/new" />
        <Stack.Screen name="word-bank" />
        <Stack.Screen name="placement" />
        <Stack.Screen name="cheatsheet" />
        <Stack.Screen name="report" />
        <Stack.Screen name="meetups" />
        <Stack.Screen name="group-chat/[id]" />
        <Stack.Screen name="invite" />
        <Stack.Screen name="team-quests" />
        <Stack.Screen name="classes/index" />
        <Stack.Screen name="classes/[id]" />
        <Stack.Screen name="ai-partner" />
        <Stack.Screen name="rewards" />
        <Stack.Screen name="memory" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="connections/[id]" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="post/compose" options={{ presentation: 'modal' }} />
        <Stack.Screen name="reset-password" options={{ gestureEnabled: false }} />
        <Stack.Screen name="shop" />
        <Stack.Screen name="league" />
        <Stack.Screen name="duel" />
        <Stack.Screen name="sprint" />
        <Stack.Screen name="create-account" />
        <Stack.Screen name="vip" />
        <Stack.Screen name="daily-review" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="exam" />
        <Stack.Screen name="certificate" />
        <Stack.Screen name="word-station" />
        <Stack.Screen name="island-crossing" />
        <Stack.Screen name="feedback" />
        <Stack.Screen name="insights" />
      </Stack.Protected>

      {/* Only reachable when signed out */}
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>

      {/* Email confirmation deep link – must work in both states */}
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="start-course" />
      <Stack.Screen name="zurich-adventure" />
      <Stack.Screen name="exchange-table" />
      <Stack.Screen name="daily-circuit" />
      <Stack.Screen name="language-studio" />
      <Stack.Screen name="speaking-journal" />
      <Stack.Screen name="plus" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="imprint" />
      <Stack.Screen name="support" />
      <Stack.Screen name="community-guidelines" />
    </Stack>
  );
}
