import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { ExerciseView } from '@/features/learn/exercise';
import { swissMissions, updateMissionMistakes, missionMistakeKey, missionOutcomes } from '@/features/learn/swiss-missions';
import { rememberExchange } from '@/features/learn/course-entry';
import { useDeviceState } from '@/lib/device-state';
import { useSession } from '@/providers/session-provider';
import { t } from '@/lib/i18n';

export default function SwissMissionsScreen() {
 const { user } = useSession();
 const [savedMistakes, saveMistakes] = useDeviceState<Record<string, boolean>>(user?.id, 'swiss-mission-mistakes', {});
 const { mission: requestedMission } = useLocalSearchParams<{ mission?: string }>();
 const [selected, select] = useState<string | undefined>(requestedMission);
 const [previewMistakes, setPreviewMistakes] = useState<Record<string, boolean>>({});
 const mistakes = user ? savedMistakes : previewMistakes;
 const [attempt, setAttempt] = useState(0);
 const [round, setRound] = useState<number[]>([]);
 const [position, setPosition] = useState(0);
 const [started, setStarted] = useState(false);
 const mission = swissMissions.find(m => m.id === selected);
 const indices = mission?.exercises.map((_, index) => index) ?? [];
 const missed = indices.filter(index => mistakes[missionMistakeKey(mission!.id, index)]);
 function start(indices: number[]) {
  setRound(indices);
  setPosition(0);
  setAttempt(value => value + 1);
  setStarted(true);
 }
 function open(id: string) { select(id); setStarted(false); setPosition(0); }
 return <Screen><ScreenHeader title={t('Swiss everyday missions')} />
 <ScrollView contentContainerStyle={{padding:screenPadding,gap:spacing.md}}>
 <AppText color="textSecondary">{t('Practise everyday situations in Standard German for life in Switzerland.')}</AppText>
 {!mission ? swissMissions.map(m => <Card key={m.id}>
  <AppText variant="heading">{m.title}</AppText><AppText>{t(m.goal)}</AppText>
  <Button title={t('Open mission')} onPress={() => open(m.id)} />
 </Card>) : <>
 <Button title={t('All missions')} variant="ghost" onPress={() => select(undefined)} />
 <AppText variant="title">{mission.title}</AppText>
 {!started ? <>
 {mission.phrases.map(([phrase,meaning]) => <Card key={phrase}><AppText variant="bodyStrong">{phrase}</AppText><AppText color="textSecondary">{meaning}</AppText></Card>)}
 <Button title={t('Start practice')} onPress={() => start(indices)} />
 {missed.length > 0 && <Button title={t('Practise my mission mistakes')} variant="secondary" onPress={() => start(missed)} />}
 </> : position < round.length ? <Card>
 <AppText>{t('Question {n} of {total}', {n:position+1,total:round.length})}</AppText>
 <ExerciseView key={`${mission.id}:${attempt}:${position}`} courseId="de" exercise={mission.exercises[round[position]]} isLast={position===round.length-1} onContinue={correct=>{
 const update = (current: Record<string, boolean> | null) => updateMissionMistakes(current ?? {}, mission.id, round[position], correct);
 if (user) saveMistakes(update);
 else setPreviewMistakes(update);
 setPosition(value => value + 1);
 }} />
 </Card> : <Card><AppText variant="heading">{t('Practice complete')}</AppText>{missed.length === 0 && <><AppText variant="bodyStrong">{t('What you can do now')}</AppText><AppText>{missionOutcomes[mission.id]}</AppText></>}
 {missed.length > 0 && <><AppText>{t('{n} questions to retry', { n: missed.length })}</AppText>
 <Button title={t('Practise my mission mistakes')} variant="secondary" onPress={() => start(missed)} /></>}
 {mission.id === 'viewing' && <AppText>Züridütsch · «Wänn chönnti d Wohnig aluege?»</AppText>}
 <AppText>{t('Try the role-play with a partner. Use fictional personal details.')}</AppText>
 <AppText>{mission.roleplay}</AppText><Button title={t('Find a practice partner')} onPress={() => {
  const task = `swiss-${mission.id}`;
  if (user && !user.is_anonymous) {
    router.push({ pathname: '/explore', params: { task } });
  } else {
    rememberExchange(task);
    router.push(user ? '/create-account' : '/login');
  }
 }} />
 <Button title={t('Practise again')} variant="secondary" onPress={()=>setStarted(false)} /></Card>}
 </>}
 <View><Button title={t('My mistake workshop')} variant="secondary" onPress={()=>router.push('/mistake-workshop')} /></View>
 </ScrollView></Screen>;
}
