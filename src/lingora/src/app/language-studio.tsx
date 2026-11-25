import { useState } from 'react';
import { Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { WritingExercise } from '@/features/learn/exercise';
import { t } from '@/lib/i18n';

const registers = [
  { title: 'Mit einer Freundin', model: 'Hoi! Könnten wir unser Treffen verschieben? Geht es bei dir am Freitag?' },
  { title: 'Mit einem Kollegen', model: 'Hallo, könnten wir unseren Termin auf Freitag verschieben? Würde dir 14 Uhr passen?' },
  { title: 'Mit einer Behörde', model: 'Guten Tag. Wäre es möglich, meinen Termin auf Freitag zu verschieben? Besten Dank für Ihre Rückmeldung.' },
];

export default function LanguageStudio() {
  const [step, setStep] = useState<number>();
  const [draft, setDraft] = useState('');
  const current = step === undefined ? undefined : registers[step];
  return (
    <Screen>
      <ScreenHeader title={t('Language studio')} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl }}>
        {current && step !== undefined ? (
          <Card>
            <WritingExercise key={step} draft={draft} onDraft={setDraft} isLast={step === registers.length - 1}
              exercise={{
                type: 'writing',
                prompt: `${current.title}: Bitte darum, einen Termin auf Freitag zu verschieben.`,
                model: current.model,
                checklist: ['Ist die Bitte klar?', 'Passt die Anrede zur Person?', 'Ist Freitag als neuer Termin erkennbar?'],
              }}
              onContinue={() => { setDraft(''); setStep(step + 1); }} />
          </Card>
        ) : <>
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading">{t('One request, three situations')}</AppText>
            <AppText>{step === registers.length ? t('You have practised the request in three registers.') : t('Ask to reschedule with a friend, a colleague and a public office.')}</AppText>
            <Button title={t('Start practice')} onPress={() => { setDraft(''); setStep(0); }} />
          </Card>
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading">{t('Practise for tomorrow')}</AppText>
            <Button title="Wohnungsbesichtigung" variant="secondary" onPress={() => router.push({ pathname: '/swiss-missions', params: { mission: 'viewing' } })} />
            <Button title="Arzttermin" variant="secondary" onPress={() => router.push({ pathname: '/swiss-missions', params: { mission: 'appointment' } })} />
            <Button title="Vorstellungsgespräch" variant="secondary" onPress={() => router.push({ pathname: '/swiss-missions', params: { mission: 'interview' } })} />
          </Card>
          {Platform.OS === 'web' && <Button title={t('Private speaking journal')} variant="secondary" onPress={() => router.push('/speaking-journal')} />}
        </>}
      </ScrollView>
    </Screen>
  );
}
