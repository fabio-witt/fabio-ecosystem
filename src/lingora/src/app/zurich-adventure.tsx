import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { WritingExercise } from '@/features/learn/exercise';
import { rememberExchange } from '@/features/learn/course-entry';
import { localDay, revenge, scenes, weeklyDays, type Choice } from '@/features/learn/zurich-adventure';
import { useNow } from '@/hooks/use-now';
import { useDeviceState } from '@/lib/device-state';
import { t } from '@/lib/i18n';
import { canSpeak, speak, useVoicesReady } from '@/lib/speech';
import { useSession } from '@/providers/session-provider';

type Progress = { days: string[]; skills: string[]; mistakes: string[]; best?: number };
const empty: Progress = { days: [], skills: [], mistakes: [] };

export default function ZurichAdventure() {
  useVoicesReady();
  const { user } = useSession();
  const [saved, save] = useDeviceState<Progress>(user?.id, 'zurich-adventure', empty);
  const [guest, setGuest] = useState(empty);
  const progress = user ? saved : guest;
  const [copyStatus, setCopyStatus] = useState<'copied' | 'failed'>();
  const [showPartnerClue, setShowPartnerClue] = useState(false);
  const [sceneId, setSceneId] = useState<string>();
  const [epilogue, setEpilogue] = useState<'ask' | 'confirm'>();
  const [epilogueDraft, setEpilogueDraft] = useState('');
  const [epilogueDone, setEpilogueDone] = useState(false);
  const [chosen, setChosen] = useState<Choice>();
  const [showClue, setShowClue] = useState(false);
  const [route, setRoute] = useState<'full' | 'short' | 'puzzle' | 'dialect'>('full');
  const [errors, setErrors] = useState<string[]>([]);
  const [previousBest, setPreviousBest] = useState<number>();
  const [review, setReview] = useState<string[]>();
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [reviewAnswer, setReviewAnswer] = useState<number>();
  const today = new Date(useNow());
  const scene = sceneId ? scenes[sceneId] : undefined;
  const reviewKey = review?.[0];
  const question = reviewKey ? revenge[reviewKey] : undefined;
  const mistakes = progress.mistakes.filter(key => revenge[key]);

  function update(change: (value: Progress) => Progress) {
    if (user) save(before => change(before ?? empty));
    else setGuest(change);
  }

  function start(mode: typeof route) {
    setRoute(mode);
    setPreviousBest(progress.best);
    setSceneId({ full: 'station', short: 'notice', puzzle: 'boss', dialect: 'cafe' }[mode]);
    setChosen(undefined);
    setShowClue(false);
    setErrors([]);
    setEpilogue(undefined);
    setEpilogueDraft('');
    setEpilogueDone(false);
  }

  function choose(choice: Choice) {
    if (chosen) return;
    setChosen(choice);
    if (choice.mistake) setErrors(before => [...new Set([...before, choice.mistake!])]);
    update(before => ({
      ...before,
      mistakes: choice.mistake ? [...new Set([...before.mistakes, choice.mistake])] : before.mistakes,
      skills: !choice.mistake && scene?.outcome ? [...new Set([...before.skills, scene.outcome])] : before.skills,
    }));
  }

  function advance() {
    if (!chosen) return;
    const next = (route === 'short' || route === 'dialect') && sceneId === 'cafe' ? 'finish' : chosen.next;
    setChosen(undefined);
    setShowClue(false);
    setSceneId(next);
    if (next === 'finish') {
      update(before => ({
        ...before,
        days: [...new Set([...before.days, localDay(today)])].slice(-56),
        best: route === 'full' ? Math.min(before.best ?? Infinity, errors.length) : before.best,
      }));
    }
  }

  async function copy(text: string) {
    try {
      setCopyStatus(await Clipboard.setStringAsync(text) ? 'copied' : 'failed');
    } catch {
      setCopyStatus('failed');
    }
  }

  function invite(task: string) {
    if (user && !user.is_anonymous) router.push({ pathname: '/explore', params: { task } });
    else {
      rememberExchange(task);
      router.push(user ? '/create-account' : '/login');
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t('A day in Zurich')} />
      <ScrollView contentContainerStyle={{ padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl }}>
        {review ? (
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading">{t('Mistake rematch')}</AppText>
            {question && reviewKey ? <>
              <AppText>{question.prompt}</AppText>
              {question.options.map((option, index) => (
                <Button key={option} title={option} disabled={reviewAnswer !== undefined} variant="secondary" onPress={() => setReviewAnswer(index)} />
              ))}
              {reviewAnswer !== undefined && <>
                <AppText accessibilityLiveRegion="polite">{reviewAnswer === question.answer ? t('Mistake mastered') : question.options[question.answer]}</AppText>
                <Button title={t('Continue')} onPress={() => {
                  if (reviewAnswer === question.answer) {
                    update(before => ({ ...before, mistakes: before.mistakes.filter(key => key !== reviewKey) }));
                    setReviewed(before => [...before, reviewKey]);
                  }
                  setReview(review.slice(1));
                  setReviewAnswer(undefined);
                }} />
              </>}
            </> : <>
              <AppText>{t('{n} mistakes mastered', { n: reviewed.length })}</AppText>
              <Button title={t('Back to the adventure')} onPress={() => setReview(undefined)} />
            </>}
          </Card>
        ) : scene ? (
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading">{scene.title}</AppText>
            <AppText>{scene.prompt}</AppText>
            {scene.audio && <>
              {canSpeak(scene.audio.language) && <Button title={t('Play dialogue')} onPress={() => speak(scene.audio!.text, scene.audio!.language)} />}
              <Button title={t('Show transcript')} variant="ghost" onPress={() => setShowClue(value => !value)} />
              {(showClue || !canSpeak(scene.audio.language)) && <AppText>{scene.audio.text}</AppText>}
            </>}
            {scene.clue && showClue && <AppText>{scene.clue}</AppText>}
            {chosen ? <>
              <AppText accessibilityLiveRegion="polite">{chosen.feedback}</AppText>
              <Button title={t('Continue')} onPress={advance} />
            </> : scene.choices.map(choice => (
              <Button key={choice.text} title={choice.text} variant="secondary" onPress={() => choose(choice)} />
            ))}
          </Card>
        ) : <>
          {sceneId === 'finish' ? (
            <Card style={{ gap: spacing.sm }}>
              <AppText variant="heading">{t('Adventure finished')}</AppText>
              <AppText>{t('Mistakes in this round: {n}', { n: errors.length })}</AppText>
              {route === 'full' && previousBest !== undefined &&
                <AppText>{t('Previous personal best: {n} mistakes', { n: previousBest })}</AppText>}
              {route === 'full' && <Card style={{ gap: spacing.sm }}>
                <AppText variant="bodyStrong">Dein eigener Dialogschluss</AppText>
                <AppText>Die Vermieterin schreibt: «Der Termin passt. Haben Sie noch eine Frage?»</AppText>
                {epilogueDone ? <AppText>{epilogue === 'ask'
                  ? 'Vermieterin: «Bringen Sie zum Termin bitte einen Ausweis mit. Bis Freitag!»'
                  : 'Vermieterin: «Vielen Dank für die Bestätigung. Bis Freitag!»'}</AppText>
                  : epilogue ? <WritingExercise key={epilogue} draft={epilogueDraft} onDraft={setEpilogueDraft} isLast
                    exercise={{
                      type: 'writing',
                      prompt: epilogue === 'ask' ? 'Frage mit einem eigenen Satz, was du mitbringen sollst.' : 'Bestätige den Termin mit einem eigenen Satz.',
                      model: epilogue === 'ask' ? 'Soll ich etwas zur Besichtigung mitbringen?' : 'Vielen Dank. Freitag um 17:30 passt mir gut.',
                      checklist: ['Ist die Absicht verständlich?', 'Passt die höfliche Anrede?'],
                    }}
                    onContinue={() => setEpilogueDone(true)} />
                  : <>
                    <Button title="Fragen, was ich mitbringen soll" variant="secondary" onPress={() => setEpilogue('ask')} />
                    <Button title="Termin bestätigen" variant="secondary" onPress={() => setEpilogue('confirm')} />
                  </>}
              </Card>}
              <Button title={t('Copy practice result')} variant="secondary" onPress={() => void copy(
                t('A day in Zurich') + ' · ' + t('Mistakes in this round: {n}', { n: errors.length })
              )} />
              <Button title={t('Back to the adventure')} variant="secondary" onPress={() => setSceneId(undefined)} />
            </Card>
          ) : <>
            <AppText>{t('Follow the tram announcement, order in a café and rearrange a viewing.')}</AppText>
            <Button title={t('Start the Zurich adventure')} onPress={() => start('full')} />
            <Button title={t('Three-minute round')} variant="secondary" onPress={() => start('short')} />
            <Button title={t('Dialect detective')} variant="secondary" onPress={() => start('dialect')} />
            <Button title={t('Timetable escape puzzle')} variant="secondary" onPress={() => start('puzzle')} />
            {Platform.OS === 'web' && <Button title={t('Copy assignment link')} variant="ghost"
              onPress={() => void copy(globalThis.location.origin + globalThis.location.pathname)} />}
          </>}
          {copyStatus && <AppText accessibilityLiveRegion="polite">{copyStatus === 'copied' ? t('Copied') : t('Could not copy')}</AppText>}
          {mistakes.length > 0 && <Button title={t('Mistake rematch')} onPress={() => {
            setReviewed([]);
            setReviewAnswer(undefined);
            setReview(mistakes);
          }} />}
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading">{t('Your learning passport')}</AppText>
            <AppText>{t('Flexible week: {n} of 3 practice days', { n: Math.min(3, weeklyDays(progress.days, today)) })}</AppText>
            {progress.skills.map(skill => <AppText key={skill}>✓ {skill}</AppText>)}
          </Card>
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading">{t('Play together')}</AppText>
            <Button title={t('Split-clue challenge')} variant="secondary" onPress={() => invite('zurich-coop')} />
            <Button title={t('Clue for partner two')} variant="ghost" onPress={() => setShowPartnerClue(value => !value)} />
            {showPartnerClue && <AppText>Deine Durchsage sagt: «Die nächste Fahrt zum Bellevue startet heute an Kante C.» Frage deinen Partner, welche Linie an Kante C fährt.</AppText>}
            <Button title={t('Take turns writing a story')} variant="secondary" onPress={() => invite('zurich-story')} />
            <Button title={t('Try a correction exchange')} variant="secondary" onPress={() => invite('zurich-corrections')} />
            <Button title={t('Plan a week together')} variant="secondary" onPress={() => invite('zurich-week')} />
          </Card>
        </>}
      </ScrollView>
    </Screen>
  );
}
