import {
  RecordingPresets, requestRecordingPermissionsAsync, useAudioPlayer, useAudioRecorder,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { useDeviceState } from '@/lib/device-state';
import { t } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';

type Clip = { at: number; data: string };
type Clips = { first?: Clip; later?: Clip };
type Slot = keyof Clips;
const empty: Clips = {};
const maxBytes = 500_000;

function toDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error());
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function Journal() {
  const { user } = useSession();
  const [clips, save] = useDeviceState<Clips>(user?.id, 'private-speaking-journal', empty);
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const player = useAudioPlayer(null);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const [recording, setRecording] = useState<Slot>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (recorder.isRecording) {
        void recorder.stop().then(() => {
          if (recorder.uri?.startsWith('blob:')) URL.revokeObjectURL(recorder.uri);
        }).catch(() => {});
      }
    };
  }, [recorder]);

  async function finish(slot: Slot) {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
      if (!uri) throw new Error();
      const blob = await (await fetch(uri)).blob();
      if (!blob.size || blob.size > maxBytes) throw new Error();
      const data = await toDataUrl(blob);
      if (mounted.current) save(before => ({ ...before, [slot]: { at: Date.now(), data } }));
    } catch {
      if (mounted.current) setError(true);
    } finally {
      if (uri?.startsWith('blob:')) URL.revokeObjectURL(uri);
      busy.current = false;
      if (mounted.current) { setLoading(false); setRecording(undefined); }
    }
  }

  async function start(slot: Slot) {
    if (busy.current || recording || clips[slot]) return;
    busy.current = true;
    setLoading(true);
    setError(false);
    try {
      player.pause();
      if (!(await requestRecordingPermissionsAsync()).granted || !mounted.current) throw new Error();
      await recorder.prepareToRecordAsync();
      if (!mounted.current) return;
      recorder.record();
      setRecording(slot);
      timer.current = setTimeout(() => void finish(slot), 30_000);
    } catch {
      if (mounted.current) setError(true);
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
    }
  }

  return <>
    <AppText>{t('Record the same prompt twice, a few weeks apart. The recordings stay on this device.')}</AppText>
    <AppText variant="heading">Wie sieht ein typischer Tag für dich aus?</AppText>
    {(['first', 'later'] as const).map(slot => {
      const clip = clips[slot];
      return <Card key={slot} style={{ gap: spacing.sm }}>
        <AppText variant="heading">{slot === 'first' ? t('First recording') : t('Later recording')}</AppText>
        {clip ? <>
          <AppText>{new Date(clip.at).toLocaleDateString()}</AppText>
          <Button title={t('Play recording')} disabled={!!recording} onPress={() => { player.replace(clip.data); player.play(); }} />
          <Button title={t('Delete recording')} variant="ghost" disabled={!!recording} onPress={() => {
            player.pause();
            player.replace(null);
            save(before => { const next = { ...before }; delete next[slot]; return next; });
          }} />
        </> : recording === slot ? (
          <Button title={t('Save recording')} loading={loading} onPress={() => void finish(slot)} />
        ) : <Button title={t('Record up to 30 seconds')} disabled={!!recording || loading} onPress={() => void start(slot)} />}
      </Card>;
    })}
    {error && <AppText color="danger">{t('Unable to save the recording. Check microphone access or try a shorter clip.')}</AppText>}
  </>;
}

export default function SpeakingJournal() {
  const { user } = useSession();
  return (
    <Screen>
      <ScreenHeader title={t('Private speaking journal')} />
      <ScrollView contentContainerStyle={{ padding: screenPadding, gap: spacing.md }}>
        {Platform.OS !== 'web' ? <AppText>{t('The speaking journal is available in the web app.')}</AppText>
          : user ? <Journal key={user.id} /> : <Button title={t('Log in')} onPress={() => router.push('/login')} />}
      </ScrollView>
    </Screen>
  );
}
