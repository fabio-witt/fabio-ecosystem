import { useQuery } from '@tanstack/react-query';
import {
  RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const MAX_SECONDS = 60;

function uuid() {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** File type of the recording, as the server accepts it. */
function fileType(blobType: string, uri: string) {
  const type = blobType.split(';')[0].toLowerCase();
  if (type.includes('webm') || uri.endsWith('.webm')) return { ext: 'webm', mime: 'audio/webm' };
  if (type.includes('ogg') || uri.endsWith('.ogg')) return { ext: 'ogg', mime: 'audio/ogg' };
  if (type.includes('wav') || uri.endsWith('.wav')) return { ext: 'wav', mime: 'audio/wav' };
  return { ext: 'm4a', mime: 'audio/mp4' };
}

/**
 * Hold-free voice recording: tap to start, tap to send (max. 60 s).
 * Uploads to the private "voice" bucket and returns the storage path.
 */
export function useVoiceRecorder(conversationId: string, onRecorded: (path: string) => void) {
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  async function start() {
    setError(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) { setError(t('Allow microphone access to send voice messages.')); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      feedback('tap');
      setSeconds(0);
      setRecording(true);
      timer.current = setInterval(() => setSeconds((value) => {
        if (value + 1 >= MAX_SECONDS) stopRef.current();
        return value + 1;
      }), 1000);
    } catch {
      setError(t('Recording did not start. Check the microphone and try again.'));
    }
  }

  async function stop(send = true) {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setRecording(false);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (!send || !uri) return;
      setUploading(true);
      const blob = await (await fetch(uri)).blob();
      const { ext, mime } = fileType(blob.type, uri);
      const path = `${conversationId}/${uuid()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('voice').upload(path, blob, { contentType: mime, upsert: false });
      if (uploadError) throw uploadError;
      onRecorded(path);
    } catch {
      setError(t('The voice message could not be sent. Please try again.'));
    } finally {
      setUploading(false);
    }
  }
  useEffect(() => { stopRef.current = () => void stop(true); });

  return { recording, seconds, uploading, error, start, stop };
}

/** Microphone button for the message bar. */
export function VoiceButton({ conversationId, onRecorded, disabled }: { conversationId: string; onRecorded: (path: string) => void; disabled?: boolean }) {
  const { styles } = useThemedStyles(createStyles);
  const voice = useVoiceRecorder(conversationId, onRecorded);
  return (
    <View style={styles.voiceWrap}>
      {voice.recording ? (
        <View style={styles.recordingRow}>
          <AppText style={styles.recDot}>●</AppText>
          <AppText variant="caption">{`0:${String(voice.seconds).padStart(2, '0')}`}</AppText>
          <Button title={t('Cancel')} size="sm" variant="ghost" onPress={() => void voice.stop(false)} />
          <Button title={t('Send')} size="sm" onPress={() => void voice.stop(true)} />
        </View>
      ) : (
        <Pressable onPress={() => void voice.start()} disabled={disabled || voice.uploading} accessibilityRole="button"
          accessibilityLabel={t('Record a voice message')} hitSlop={6}
          style={({ pressed }) => [styles.mic, pressed && styles.pressed, (disabled || voice.uploading) && styles.disabled]}>
          <AppText style={styles.micIcon}>{voice.uploading ? '…' : '🎤'}</AppText>
        </Pressable>
      )}
      {voice.error ? <AppText variant="caption" color="danger">{voice.error}</AppText> : null}
    </View>
  );
}

/** Plays a voice message from the private bucket. */
export function VoicePlayer({ path, mine }: { path: string; mine: boolean }) {
  const { styles } = useThemedStyles(createStyles);
  const url = useQuery({
    queryKey: ['voice-url', path],
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from('voice').createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  const player = useAudioPlayer(url.data ?? null);
  const status = useAudioPlayerStatus(player);
  const playing = status.playing;
  const total = Math.round(status.duration || 0);
  const now = Math.round(status.currentTime || 0);
  return (
    <View style={styles.player}>
      <Pressable disabled={!url.data} accessibilityRole="button" accessibilityLabel={playing ? t('Pause') : t('Play voice message')}
        onPress={() => {
          if (playing) player.pause();
          else { if (status.didJustFinish || (total && now >= total)) player.seekTo(0); player.play(); }
        }}
        style={[styles.play, mine && styles.playMine]}>
        <AppText style={[styles.playIcon, mine && styles.playIconMine]}>{url.isError ? '!' : playing ? '❚❚' : '▶'}</AppText>
      </Pressable>
      <View style={styles.bar}><View style={[styles.barFill, { width: `${total ? Math.min(100, (now / total) * 100) : 0}%` }]} /></View>
      <AppText variant="caption" color={mine ? 'onPrimary' : 'textSecondary'}>{total ? `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}` : '🎤'}</AppText>
    </View>
  );
}

/** New room name for a free Jitsi video call. */
export function newCallRoom() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let room = 'lingora-';
  for (let i = 0; i < 16; i++) room += chars[Math.floor(Math.random() * chars.length)];
  return room;
}

export function openCall(room: string) {
  const url = `https://meet.jit.si/${room}`;
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
  else void Linking.openURL(url);
}

/** Message bubble content for a call invitation. */
export function CallCard({ room, mine }: { room: string; mine: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="bodyStrong" color={mine ? 'onPrimary' : 'text'}>{t('📞 Video call')}</AppText>
      <Button title={t('Join call')} size="sm" variant={mine ? 'secondary' : 'primary'} onPress={() => openCall(room)} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  voiceWrap: { gap: 4 },
  recordingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  recDot: { color: colors.danger, fontSize: 16 },
  mic: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  micIcon: { fontSize: 20, lineHeight: 24 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  player: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 180 },
  play: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  playMine: { backgroundColor: colors.onPrimary },
  playIcon: { color: colors.onPrimary, fontWeight: '900' },
  playIconMine: { color: colors.primary },
  bar: { flex: 1, height: 4, borderRadius: radius.full, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.success },
});
