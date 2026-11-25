import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { speak, stopSpeech } from '@/lib/speech';
import { t } from '@/lib/i18n';

export function ListeningPassage({ text, courseId }: { text: string; courseId: string }) {
  const [transcript, setTranscript] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const [slow, setSlow] = useState(false);
  const [part, setPart] = useState(0);
  const parts = text.split(/\n+/).flatMap((paragraph) => paragraph.match(/[^.!?]+[.!?]*/g) ?? []).map((item) => item.trim()).filter(Boolean);
  const play = (passage: string) => {
    setAudioError(false);
    speak(passage, courseId, () => setAudioError(true), slow ? 0.7 : 0.9);
  };
  useFocusEffect(useCallback(() => () => { stopSpeech(); }, []));

  return (
    <Card style={styles.card}>
      <AppText variant="heading">{t("Listen to the passage")}</AppText>
      <AppText color="textSecondary">{t("Play the passage using your device’s voice. Replay it as often as you need.")}</AppText>
      <Button title={t("Play passage")} variant="secondary" onPress={() => play(text)} />
      <Button title={slow ? t("Speed: slow") : t("Speed: normal")} variant="ghost" onPress={() => setSlow(!slow)}
        accessibilityHint={t("Switch playback speed")} />
      {parts.length > 1 && (
        <View style={styles.card}>
          <AppText color="textSecondary">{t('Section {n} of {total}', { n: part + 1, total: parts.length })}</AppText>
          <Button title={t("Play this section")} variant="secondary" onPress={() => play(parts[part])} />
          <View style={styles.row}>
            <Button title={t("Previous")} variant="ghost" disabled={part === 0} onPress={() => setPart(part - 1)} />
            <Button title={t("Next")} variant="ghost" disabled={part + 1 === parts.length} onPress={() => setPart(part + 1)} />
          </View>
        </View>
      )}
      {audioError && <AppText color="danger" accessibilityLiveRegion="polite">{t("Audio is unavailable. You can read the transcript below.")}</AppText>}
      <Button title={transcript ? t("Hide transcript") : t("Read transcript")} variant="ghost"
        accessibilityState={{ expanded: transcript }} onPress={() => setTranscript(!transcript)} />
      {transcript && <AppText>{text}</AppText>}
    </Card>
  );
}

const styles = StyleSheet.create({ card: { gap: spacing.sm }, row: { flexDirection: 'row', flexWrap: 'wrap' } });
