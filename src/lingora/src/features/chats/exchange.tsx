import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

import { openCall } from './voice';

export type ExchangeSession = {
  id: string; conversation_id: string; proposer_id: string; starts_at: string; minutes: number;
  topic: string; status: 'proposed' | 'accepted' | 'declined' | 'cancelled'; room: string;
};

const key = (conversationId: string) => ['exchange-sessions', conversationId] as const;

export function useExchangeSessions(conversationId: string | undefined) {
  return useQuery({
    queryKey: key(conversationId ?? 'all'),
    queryFn: async () => {
      let query = supabase.from('exchange_sessions').select('id, conversation_id, proposer_id, starts_at, minutes, topic, status, room')
        .in('status', ['proposed', 'accepted']).gt('starts_at', new Date(Date.now() - 2 * 3600_000).toISOString())
        .order('starts_at', { ascending: true }).limit(20);
      if (conversationId) query = query.eq('conversation_id', conversationId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ExchangeSession[];
    },
  });
}

function useRespond(conversationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'declined' | 'cancelled' }) => {
      const { error } = await supabase.rpc('respond_exchange', { p_session: id, p_status: status });
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['exchange-sessions'] }),
    meta: { conversationId },
  });
}

function when(date: string) {
  return new Date(date).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Upcoming exchange calls in this chat, with accept / decline / join. */
export function ExchangeSessions({ conversationId }: { conversationId: string }) {
  const { styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const sessions = useExchangeSessions(conversationId);
  const respond = useRespond(conversationId);
  const now = useNow();
  if (!sessions.data?.length) return null;
  return (
    <View style={styles.sessions}>
      {sessions.data.map((session) => {
        const mine = session.proposer_id === user?.id;
        const start = Date.parse(session.starts_at);
        const open = session.status === 'accepted' && now > start - 15 * 60_000 && now < start + (session.minutes + 30) * 60_000;
        return (
          <View key={session.id} style={styles.session}>
            <View style={styles.flex}>
              <AppText variant="caption" style={styles.bold}>
                {session.status === 'accepted' ? t('📅 Exchange call') : t('📅 Proposed call')} · {when(session.starts_at)} · {t('{n} min', { n: session.minutes })}
              </AppText>
              {session.topic ? <AppText variant="caption" color="textSecondary" numberOfLines={1}>{session.topic}</AppText> : null}
            </View>
            {open ? <Button title={t('Join')} size="sm" onPress={() => openCall(session.room)} /> : null}
            {session.status === 'proposed' && !mine ? (
              <>
                <Button title={t('Accept')} size="sm" onPress={() => { feedback('ok'); respond.mutate({ id: session.id, status: 'accepted' }); }} />
                <Button title={t('Decline')} size="sm" variant="ghost" onPress={() => respond.mutate({ id: session.id, status: 'declined' })} />
              </>
            ) : (
              <Button title={t('Cancel')} size="sm" variant="ghost" onPress={() => respond.mutate({ id: session.id, status: 'cancelled' })} />
            )}
          </View>
        );
      })}
    </View>
  );
}

/** "📅" in the chat header: propose a time for a language exchange call. */
export function ScheduleButton({ conversationId }: { conversationId: string }) {
  const { colors, styles } = useThemedStyles(createStyles);
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [dayOffset, setDayOffset] = useState(1);
  const [hour, setHour] = useState(19);
  const [minutes, setMinutes] = useState(30);
  const [topic, setTopic] = useState('');
  const create = useMutation({
    mutationFn: async () => {
      const start = new Date();
      start.setDate(start.getDate() + dayOffset);
      start.setHours(hour, 0, 0, 0);
      const { error } = await supabase.from('exchange_sessions').insert({
        conversation_id: conversationId, starts_at: start.toISOString(), minutes, topic: topic.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { feedback('ok'); setOpen(false); setTopic(''); void client.invalidateQueries({ queryKey: ['exchange-sessions'] }); },
  });
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(); date.setDate(date.getDate() + offset);
    return { offset, label: offset === 0 ? t('Today') : offset === 1 ? t('Tomorrow') : date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }) };
  });
  const nowHour = new Date().getHours();
  return (
    <>
      <Button title="📅" size="sm" variant="secondary" accessibilityLabel={t('Plan an exchange call')} onPress={() => setOpen(true)} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <AppText variant="heading">{t('Plan an exchange call')}</AppText>
              <AppText color="textSecondary">{t('Half the time in each language works best. Your partner gets the proposal in this chat.')}</AppText>
              <AppText variant="bodyStrong">{t('Day')}</AppText>
              <View style={styles.wrap}>{days.map((day) => (
                <Button key={day.offset} title={day.label} size="sm" variant={dayOffset === day.offset ? 'primary' : 'secondary'} onPress={() => setDayOffset(day.offset)} />
              ))}</View>
              <AppText variant="bodyStrong">{t('Time')}</AppText>
              <View style={styles.wrap}>{[8, 10, 12, 14, 16, 18, 19, 20, 21].filter((h) => dayOffset > 0 || h > nowHour).map((h) => (
                <Button key={h} title={`${String(h).padStart(2, '0')}:00`} size="sm" variant={hour === h ? 'primary' : 'secondary'} onPress={() => setHour(h)} />
              ))}</View>
              <AppText variant="bodyStrong">{t('Length')}</AppText>
              <View style={styles.wrap}>{[15, 30, 45, 60].map((m) => (
                <Button key={m} title={t('{n} min', { n: m })} size="sm" variant={minutes === m ? 'primary' : 'secondary'} onPress={() => setMinutes(m)} />
              ))}</View>
              <TextInput value={topic} onChangeText={setTopic} maxLength={200} placeholder={t('Topic (optional), e.g. travel, work, food')}
                placeholderTextColor={colors.textMuted} style={styles.input} accessibilityLabel={t('Topic')} />
              {create.isError ? <AppText color="danger">{create.error.message}</AppText> : null}
              <Button title={t('Send proposal')} disabled={create.isPending || (dayOffset === 0 && hour <= nowHour)} onPress={() => create.mutate()} />
              <Button title={t('Cancel')} variant="ghost" onPress={() => setOpen(false)} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/** All upcoming exchange calls across chats, for the meetups screen. */
export function UpcomingExchanges() {
  const { styles } = useThemedStyles(createStyles);
  const sessions = useExchangeSessions(undefined);
  if (!sessions.data?.length) return null;
  return (
    <Card style={styles.sessions}>
      <AppText variant="heading">{t('Your exchange calls')}</AppText>
      {sessions.data.map((session) => (
        <View key={session.id} style={styles.session}>
          <AppText style={styles.flex}>{session.status === 'accepted' ? '✅' : '⏳'} {when(session.starts_at)} · {session.topic || t('Language exchange')}</AppText>
        </View>
      ))}
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '800' },
  sessions: { gap: spacing.xs, paddingHorizontal: screenPadding, paddingVertical: spacing.xs },
  session: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: spacing.md },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '90%', alignSelf: 'center', backgroundColor: colors.surface, borderRadius: radius.xl },
  sheetContent: { padding: spacing.lg, gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.text, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 46, fontSize: 16 },
});
