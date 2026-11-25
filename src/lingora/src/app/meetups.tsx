import { exchangeScenarioId, exchangeScenarios, type ExchangeScenarioId } from '@/features/chats/exchange-table';
import { useLocalSearchParams } from 'expo-router';
import { courseLanguage } from '@/features/learn/course-language';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { UpcomingExchanges } from '@/features/chats/exchange';
import { useNow } from '@/hooks/use-now';
import { openCall } from '@/features/chats/voice';
import { useLanguages } from '@/features/community/api';
import { Chip } from '@/features/forum/ui';
import { useIsGuest } from '@/features/guest/guest';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

type Meetup = {
  id: string; host_id: string; language_id: number | null; level: string | null; title: string; content: string;
  starts_at: string; duration_minutes: number; capacity: number; attendee_count: number;
  host: { full_name: string | null; username: string | null } | null;
  language: { name: string; flag_emoji: string | null } | null;
};
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Live rooms: scheduled group video calls per language and level. */
export default function MeetupsScreen() {
  const { styles } = useThemedStyles(createStyles);
  const now = useNow();
  const { user } = useSession();
  const guest = useIsGuest();
  const client = useQueryClient();
  const languages = useLanguages();
  const { course, topic } = useLocalSearchParams<{ course?: string; topic?: string }>();
  const scenarioId = exchangeScenarioId(topic);
  const scenario = scenarioId ? exchangeScenarios[scenarioId] : undefined;
  const [language, setLanguage] = useState<number | null>();
  const languageId = language === undefined ? courseLanguage(languages.data, course) : language ?? undefined;
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [creating, setCreating] = useState(!!scenario);
  const meetups = useQuery({
    queryKey: ['meetups', languageId],
    queryFn: async () => {
      let query = supabase.from('meetups')
        .select('id, host_id, language_id, level, title, content, starts_at, duration_minutes, capacity, attendee_count, host:profiles!meetups_host_id_fkey(full_name, username), language:languages!meetups_language_id_fkey(name, flag_emoji)')
        .gt('starts_at', new Date(Date.now() - 3 * 3600_000).toISOString()).order('starts_at').limit(50);
      if (languageId) query = query.eq('language_id', languageId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Meetup[];
    },
  });
  const mine = useQuery({
    queryKey: ['meetup-attending', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('meetup_attendees').select('meetup_id').eq('user_id', user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((row) => row.meetup_id));
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, join }: { id: string; join: boolean }) => {
      const { error } = join
        ? await supabase.from('meetup_attendees').insert({ meetup_id: id })
        : await supabase.from('meetup_attendees').delete().eq('meetup_id', id).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => { feedback('ok'); void client.invalidateQueries({ queryKey: ['meetup'] }); void client.invalidateQueries({ queryKey: ['meetups'] }); void client.invalidateQueries({ queryKey: ['meetup-attending'] }); },
  });
  const room = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('meetup_room', { p_meetup: id });
      if (error) throw error;
      return data as string;
    },

  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('meetups').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => client.invalidateQueries({ queryKey: ['meetups'] }),
  });

  const rooms = (meetups.data ?? []).filter(item =>
    now <= roomClosesAt(item) && (!onlyOpen || roomIsOpen(item, now)));

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Live rooms')} right={!guest ? <Button title={t('+ New')} size="sm" onPress={() => setCreating(!creating)} /> : undefined} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText color="textSecondary">{t('Small video rooms with learners of your level. The room opens 15 minutes before the start – in your browser, no app needed.')}</AppText>
        {creating && !guest ? <CreateMeetup languageId={languageId} scenario={scenarioId} onDone={() => setCreating(false)} /> : null}
        <UpcomingExchanges />
        <View style={styles.actions}>
          <Chip label={t('All sessions')} active={!onlyOpen} onPress={() => setOnlyOpen(false)} />
          <Chip label={t('Open now')} active={onlyOpen} onPress={() => setOnlyOpen(true)} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={t('All languages')} active={!languageId} onPress={() => setLanguage(null)} />
          {(languages.data ?? []).filter((language) => language.flag_emoji).map((language) => (
            <Chip key={language.id} label={`${language.flag_emoji} ${t(language.name)}`} active={languageId === language.id}
              onPress={() => setLanguage(languageId === language.id ? null : language.id)} />
          ))}
        </ScrollView>
        {meetups.isPending ? <LoadingState /> : meetups.isError ? <ErrorState message={t('Could not load live rooms.')} onRetry={() => meetups.refetch()} />
          : !rooms.length && onlyOpen ? <EmptyState title={t('No rooms open right now')} actionLabel={t('All sessions')} onAction={() => setOnlyOpen(false)} />
          : !rooms.length ? <EmptyState title={t('No live rooms planned')} message={guest ? t('Create an account to host the first one.') : t('Host the first one – 30 minutes of small talk is enough.')} />
            : rooms.map((meetup) => {
              const start = Date.parse(meetup.starts_at);
              const host = meetup.host_id === user?.id;
              const going = host || !!mine.data?.has(meetup.id);
              const open = roomIsOpen(meetup, now);
              const link = room.variables === meetup.id ? room.data : undefined;
              const full = meetup.attendee_count >= meetup.capacity;
              return (
                <Card key={meetup.id} style={styles.card}>
                  <AppText variant="caption" color="textSecondary">
                    {meetup.language ? `${meetup.language.flag_emoji ?? ''} ${t(meetup.language.name)}` : t('Any language')}{meetup.level ? ` · ${meetup.level}` : ''} · {new Date(start).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </AppText>
                  <AppText variant="bodyStrong">{meetup.title}</AppText>
                  {open && <AppText variant="label" color="success">{t('Open now')}</AppText>}
                  {meetup.content ? <AppText color="textSecondary">{meetup.content}</AppText> : null}
                  <AppText variant="caption" color="textSecondary">
                    {t('Host: {name}', { name: meetup.host?.full_name || meetup.host?.username || t('Member') })} · {t('{n} of {max} places', { n: meetup.attendee_count, max: meetup.capacity })} · {t('{n} min', { n: meetup.duration_minutes })}
                  </AppText>
                  <View style={styles.actions}>
                    {open && going && !guest && (link
                      ? <Button title={t('Open room')} size="sm" onPress={() => openCall(link)} />
                      : <Button title={t('Prepare room link')} size="sm" loading={room.isPending && room.variables === meetup.id}
                        disabled={room.isPending} onPress={() => room.mutate(meetup.id)} />)}
                    {host ? <Button title={t('Delete')} size="sm" variant="ghost" onPress={() => remove.mutate(meetup.id)} />
                      : guest ? null
                        : going ? <Button title={t('Leave')} size="sm" variant="ghost" onPress={() => { room.reset(); toggle.mutate({ id: meetup.id, join: false }); }} />
                          : <Button title={full ? t('Full') : t('Join')} size="sm" disabled={full} onPress={() => toggle.mutate({ id: meetup.id, join: true })} />}
                  </View>
                </Card>
              );
            })}
        {toggle.isError ? <AppText color="danger">{toggle.error.message}</AppText> : null}
        {room.isError ? <AppText color="danger">{room.error.message}</AppText> : null}
        <AppText variant="caption" color="textSecondary">{t('Calls run on Jitsi Meet (meet.jit.si). Do not share personal data in calls.')}</AppText>
      </ScrollView>
    </Screen>
  );

}

function roomIsOpen(meetup: Meetup, now: number) {
  const start = Date.parse(meetup.starts_at);
  return now >= start - 15 * 60_000 && now <= roomClosesAt(meetup);
}

function roomClosesAt(meetup: Meetup) {
  return Date.parse(meetup.starts_at) + (meetup.duration_minutes + 30) * 60_000;
}

function CreateMeetup({ onDone, languageId, scenario }: { onDone: () => void; languageId?: number; scenario?: ExchangeScenarioId }) {
  const { colors, styles } = useThemedStyles(createStyles);
  const client = useQueryClient();
  const languages = useLanguages();
  const preset = scenario ? exchangeScenarios[scenario] : undefined;
  const [title, setTitle] = useState(preset ? t(preset.title) : '');
  const [content, setContent] = useState(preset ? t(preset.goal) : '');
  const [languageChoice, setLang] = useState<number | null>();
  const lang = languageChoice === undefined ? languageId ?? null : languageChoice;
  const [level, setLevel] = useState<string | null>(null);
  const [instant, setInstant] = useState(!!preset);
  const [dayOffset, setDayOffset] = useState(1);
  const [hour, setHour] = useState(19);
  const [capacity, setCapacity] = useState(6);
  const create = useMutation({
    mutationFn: async () => {
      // The room opens immediately, while the insert policy requires a future start.
      const start = new Date(Date.now() + (instant ? 60_000 : 0));
      if (!instant) {
        start.setDate(start.getDate() + dayOffset);
        start.setHours(hour, 0, 0, 0);
        if (start.getTime() <= Date.now()) throw new Error(t('Choose a future start time.'));
      }
      const { error } = await supabase.from('meetups').insert({ title: title.trim(), content: content.trim(), language_id: lang, level, starts_at: start.toISOString(), capacity, duration_minutes: instant ? 30 : 45 });
      if (error) throw error;
    },
    onSuccess: () => { feedback('ok'); void client.invalidateQueries({ queryKey: ['meetups'] }); onDone(); },
  });
  const nowHour = new Date().getHours();
  return (
    <Card style={styles.card}>
      <AppText variant="heading">{t('Host a live room')}</AppText>
      <TextInput value={title} onChangeText={setTitle} maxLength={100} placeholder={t('e.g. Coffee chat in Spanish (B1)')} placeholderTextColor={colors.textMuted} style={styles.input} accessibilityLabel={t('Title')} />
      <TextInput value={content} onChangeText={setContent} maxLength={1000} multiline placeholder={t('What will you talk about? (optional)')} placeholderTextColor={colors.textMuted} style={[styles.input, styles.tall]} accessibilityLabel={t('Description')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={t('Any language')} active={lang === null} onPress={() => setLang(null)} />
        {(languages.data ?? []).filter((language) => language.flag_emoji).map((language) => (
          <Chip key={language.id} label={`${language.flag_emoji} ${t(language.name)}`} active={lang === language.id} onPress={() => setLang(language.id)} />
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <Chip label={t('Any level')} active={level === null} onPress={() => setLevel(null)} />
        {LEVELS.map((item) => <Chip key={item} label={item} active={level === item} onPress={() => setLevel(item)} />)}
      </View>
      <View style={styles.actions}>
        <Chip label={t('Start now')} active={instant} onPress={() => setInstant(true)} />
        <Chip label={t('Schedule a room')} active={!instant} onPress={() => setInstant(false)} />
      </View>
      {!instant && <>
      <View style={styles.actions}>{[0, 1, 2, 3, 4, 5, 6].map((offset) => {
        const date = new Date(); date.setDate(date.getDate() + offset);
        return <Chip key={offset} label={offset === 0 ? t('Today') : offset === 1 ? t('Tomorrow') : date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })} active={dayOffset === offset} onPress={() => setDayOffset(offset)} />;
      })}</View>
      <View style={styles.actions}>{[9, 12, 17, 18, 19, 20, 21].filter((h) => dayOffset > 0 || h > nowHour).map((h) => (
        <Chip key={h} label={`${String(h).padStart(2, '0')}:00`} active={hour === h} onPress={() => setHour(h)} />
      ))}</View>
      </>}
      <View style={styles.actions}>{[4, 6, 8, 12].map((n) => <Chip key={n} label={t('{n} people', { n })} active={capacity === n} onPress={() => setCapacity(n)} />)}</View>
      {create.isError ? <AppText color="danger">{create.error.message}</AppText> : null}
      <Button title={t('Publish live room')} disabled={title.trim().length < 5 || create.isPending || (!instant && dayOffset === 0 && hour <= nowHour)} onPress={() => create.mutate()} />
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  chips: { gap: spacing.xs, paddingRight: spacing.md },
  card: { gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, padding: spacing.md, fontSize: 16, minHeight: 46, textAlignVertical: 'top' },
  tall: { minHeight: 90 },
});
