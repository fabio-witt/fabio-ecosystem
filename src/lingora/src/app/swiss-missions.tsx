import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { ExerciseView } from '@/features/learn/exercise';
import { swissMissions, updateMissionMistakes, missionMistakeKey } from '@/features/learn/swiss-missions';
import { useDeviceState } from '@/lib/device-state';
import { useSession } from '@/providers/session-provider';
import { t } from '@/lib/i18n';

export default function SwissMissionsScreen() {
 const { user } = useSession();
 const [mistakes, saveMistakes] = useDeviceState<Record<string, boolean>>(user?.id, 'swiss-mission-mistakes', {});
 const [selected, select] = useState<string>();
 const [round, setRound] = useState<number[]>([]);
 const [position, setPosition] = useState(0);
 const [started, setStarted] = useState(false);
 const mission = swissMissions.find(m => m.id === selected);
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
 <Button title={t('Start practice')} onPress={() => {setRound(mission.exercises.map((_,i)=>i));setPosition(0);setStarted(true);}} />
 {mission.exercises.some((_,i)=>mistakes[missionMistakeKey(mission.id,i)]) && <Button title={t('Practise my mission mistakes')} variant="secondary" onPress={() => {setRound(mission.exercises.map((_,i)=>i).filter(i=>mistakes[missionMistakeKey(mission.id,i)]));setPosition(0);setStarted(true);}} />}
 </> : position < round.length ? <Card>
 <AppText>{t('Question {n} of {total}', {n:position+1,total:round.length})}</AppText>
 <ExerciseView key={`${mission.id}:${position}`} exercise={mission.exercises[round[position]]} isLast={position===round.length-1} onContinue={correct=>{
 saveMistakes(current=>updateMissionMistakes(current??{},mission.id,round[position],correct));setPosition(p=>p+1);
 }} />
 </Card> : <Card><AppText variant="heading">{t('Practice complete')}</AppText><AppText>{t('Try the role-play with a partner. Use fictional personal details.')}</AppText>
 <AppText>{mission.roleplay}</AppText><Button title={t('Find a practice partner')} onPress={()=>router.push('/explore')} />
 <Button title={t('Practise again')} variant="secondary" onPress={()=>setStarted(false)} /></Card>}
 </>}
 <View><Button title={t('My mistake workshop')} variant="secondary" onPress={()=>router.push('/mistake-workshop')} /></View>
 </ScrollView></Screen>;
}
