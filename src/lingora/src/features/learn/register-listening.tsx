import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { speak, stopSpeech } from '@/lib/speech';

import { germanRegisterDialogues } from './content/de-register-dialogues';
import { t } from '@/lib/i18n';

export function RegisterListening({ entryId }: { entryId: string }) {
  const dialogue = germanRegisterDialogues[entryId];
  const [variant, setVariant] = useState<'informal' | 'formal'>();
  const [failed, setFailed] = useState(false);
  useEffect(() => () => { stopSpeech(); }, []);
  if (!dialogue) return null;

  return (
    <Card style={styles.card}>
      <AppText variant="heading">{t("Compare informal and formal German")}</AppText>
      <AppText color="textSecondary">{t("The device voice reads both versions. Listen for changes in phrasing and tone.")}</AppText>
      {(['informal', 'formal'] as const).map((item) => (
        <Button key={item} title={t('Play {version} version', { version: t(item) })} variant="secondary" onPress={() => {
          setVariant(item);
          setFailed(false);
          speak(dialogue[item], 'de', () => setFailed(true));
        }} />
      ))}
      {variant && <AppText>{dialogue[variant]}</AppText>}
      {failed && <AppText color="danger">{t("Audio is unavailable on this device. You can read the selected version above.")}</AppText>}
    </Card>
  );
}

const styles = StyleSheet.create({ card: { gap: spacing.sm } });
