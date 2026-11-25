import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { type Encounter, islandForUnit } from './island-route';
import { t } from '@/lib/i18n';

type Island = ReturnType<typeof islandForUnit>;

export function IslandArt({ island, height = 88 }: { island: Island; height?: number }) {
  return (
    <View style={{ height, borderRadius: 14, overflow: 'hidden', backgroundColor: island.sea }} accessible={false}>
      <Svg width="100%" height={height} viewBox="0 0 360 110" preserveAspectRatio="none" aria-hidden>
        <Rect width="360" height="110" fill={island.sky} />
        {island.light === 'night' ? (
          <>
            <Path d="M305 12 A17 17 0 1 0 318 34 A15 15 0 0 1 305 12Z" fill="#FFF1BF" />
            <Path d="M62 14 V22 M58 18 H66 M108 28 V34 M105 31 H111 M252 13 V19 M249 16 H255"
              stroke="#FFF1BF" strokeWidth="1.6" strokeLinecap="round" />
          </>
        ) : (
          <Circle cx={island.light === 'dusk' ? 64 : 295} cy={island.light === 'dusk' ? 47 : 28}
            r="17" fill={island.light === 'dusk' ? '#FFE5A0' : '#FFF2C6'} opacity={0.9} />
        )}
        <Path d="M0 59 Q34 44 69 54 T148 57 T244 54 T360 53 V110 H0Z" fill={island.sea} />
        <Path d="M0 86 Q21 83 41 86 M54 97 H96 M262 85 H289 M287 100 H331 M327 68 H350" stroke="#EBFCF8" strokeWidth="2" strokeLinecap="round" opacity={0.4} />
        <Ellipse cx="178" cy="91" rx="130" ry="14" fill={island.edge} opacity={0.55} />
        <Path d="M56 85 Q76 70 104 71 Q119 52 151 55 Q184 38 210 58 Q238 58 257 71 Q279 76 298 88 Q269 100 188 100 Q105 100 56 85Z" fill={island.land} />
        <Path d="M86 89 Q131 99 188 96 Q240 96 270 89" stroke="#FDF1C9" strokeWidth="2" fill="none" opacity={0.8} />
        <IslandTerrain terrain={island.terrain} />
      </Svg>
    </View>
  );
}

function IslandTerrain({ terrain }: { terrain: Island['terrain'] }) {
  switch (terrain) {
    case 'palms':
      return (
        <>
          <Palm x={124} y={76} />
          <Palm x={185} y={75} />
          <Palm x={226} y={83} />
          <Path d="M146 87 H207 L198 94 H154Z" fill="#794D35" />
          <Path d="M171 86 V63 L195 83 H171Z" fill="#F7F2D9" />
        </>
      );
    case 'lagoon':
      return (
        <>
          <Palm x={108} y={78} />
          <Palm x={240} y={78} />
          <Ellipse cx="172" cy="80" rx="54" ry="13" fill="#63B199" />
          <Path d="M128 81 L144 75 L165 76 L169 71 L180 71 L186 76 L205 79 L209 83 L153 85Z" fill="#355B3B" />
          <Circle cx="177" cy="75" r="2" fill="#F2D26C" />
        </>
      );
    case 'wreck':
      return (
        <>
          <Path d="M110 73 L144 78 L133 57 L160 71 L154 82 H222 L242 74 L224 94 H135Z" fill="#674938" />
          <Path d="M178 81 L170 34 M210 81 L201 45" stroke="#624836" strokeWidth="4" />
          <Path d="M171 35 L153 72 L166 67 L175 74 L178 60Z" fill="#FBEDD1" />
          <Path d="M202 46 L187 74 L207 70Z" fill="#DBA27F" />
          <Path d="M168 35 L166 24 L183 28 L170 31" fill="#303447" />
        </>
      );
    case 'fort':
      return (
        <>
          <Path d="M116 79 V43 H127 V51 H137 V43 H146 V60 H165 V34 H177 V42 H187 V34 H199 V60 H216 V44 H227 V52 H237 V44 H247 V79Z" fill="#797A74" />
          <Path d="M172 80 V66 Q182 53 192 66 V80" fill="#3A4147" />
          <Path d="M181 32 V15 L208 23 L181 29" fill="#B75B53" />
          <Path d="M124 68 H138 M224 68 H239" stroke="#4B5156" strokeWidth="4" />
        </>
      );
    case 'cliffs':
      return (
        <>
          <Path d="M96 81 L120 54 L143 61 L171 27 L192 41 L208 34 L243 64 L263 82Z" fill="#596F78" />
          <Path d="M143 61 L171 27 L193 42 L180 43 L170 38 L157 55Z M208 34 L232 53 L215 51Z" fill="#E5EEE5" />
          <Path d="M155 82 L175 64 L199 82Z" fill="#354E5F" />
        </>
      );
    case 'lighthouse':
      return (
        <>
          <Path d="M124 82 L144 59 L164 74 L184 60 L219 69 L236 84Z" fill="#7F6967" />
          <Path d="M180 36 H201 L207 82 H174Z" fill="#FAEAD1" />
          <Path d="M178 49 H203 L204 59 H177Z M175 69 H205 L207 81 H174Z" fill="#B9705B" />
          <Path d="M177 36 H204 L190 21Z" fill="#854955" />
          <Rect x="184" y="33" width="13" height="12" fill="#FAC76E" />
          <Path d="M202 37 L263 19 V52 L202 42Z" fill="#FFEDAB" opacity={0.65} />
        </>
      );
    case 'arch':
      return (
        <>
          <Path d="M98 81 L118 52 L141 37 L196 29 L225 38 L256 84 H215 Q199 47 173 52 Q147 60 139 86Z" fill="#BF754D" />
          <Path d="M116 55 L141 37 L196 29 L225 38 L235 55 L198 43 L152 51Z" fill="#E7A56C" />
          <Path d="M104 70 L138 58 M220 61 L243 69" stroke="#965946" strokeWidth="3" />
        </>
      );
    case 'caves':
      return (
        <>
          <Path d="M86 84 L111 56 L151 51 L169 33 L211 47 L244 65 L268 86Z" fill="#545B72" />
          <Path d="M135 82 Q137 52 160 59 Q178 62 179 86 M191 87 Q196 66 209 67 Q220 70 231 86" fill="#263347" />
          <Path d="M144 86 Q152 76 156 80 Q163 82 168 87Z" fill="#E4AD62" />
          <Circle cx="152" cy="70" r="2" fill="#F6D491" />
          <Circle cx="164" cy="74" r="1.5" fill="#F6D491" />
        </>
      );
  }
}

function Palm({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M0 0 Q10 -16 5 -31 L8 -33 Q16 -18 5 1Z" fill="#876647" />
      <Path d="M8 -31 Q-8 -44 -22 -28 Q-4 -35 8 -27 Q-9 -32 -16 -16 Q-4 -26 8 -26 Q22 -34 37 -24 Q28 -41 10 -33 Q21 -49 30 -48 Q17 -52 8 -35 Q-1 -53 -12 -50 Q-1 -45 8 -31Z" fill="#377B5B" />
    </G>
  );
}

export function IslandLabel({ index }: { index: number }) {
  const island = islandForUnit(index);
  return (
    <View style={[styles.label, { backgroundColor: island.edge }]}>
      <AppText variant="label" style={styles.labelText}>{island.emblem} {t(island.name)}</AppText>
    </View>
  );
}

export function EncounterPortrait({ encounter, size = 66 }: { encounter: Encounter; size?: number }) {
  const { gear, coat } = encounter;
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" aria-hidden accessible={false}>
      <Rect width="72" height="72" rx="15" fill="#123646" />
      <Circle cx="36" cy="32" r="25" fill="#255666" />
      {gear === 'crocodile' ? (
        <>
          <Path d="M7 42 L18 35 L29 36 L33 28 L39 30 L43 23 L51 25 L55 33 L65 40 L63 48 L16 49Z" fill={coat} />
          <Path d="M10 44 Q33 49 61 43 L57 54 L19 54Z" fill="#A9C56A" />
          <Path d="M16 44 L20 49 L24 45 L29 50 L34 46" fill="#FFF0CE" />
          <Circle cx="48" cy="31" r="3" fill="#F7D577" /><Circle cx="49" cy="31" r="1.1" fill="#122B36" />
        </>
      ) : (
        <>
          <Path d="M11 66 Q14 47 28 43 H44 Q58 45 62 66Z" fill={coat} />
          <Path d="M27 45 L36 58 L44 45 L40 64 H31Z" fill="#EEE6CF" />
          <Path d="M16 63 L23 51 M56 63 L49 51" stroke={gear === 'key' ? '#A83D3A' : '#F0C67B'} strokeWidth="3" />
          <Rect x="33" y="39" width="6" height="9" rx="2" fill="#BB896D" />
          <Ellipse cx="36" cy="33" rx="12" ry="14" fill="#DBAB87" />
          <Path d="M14 25 L22 14 L30 17 L36 10 L47 16 L51 12 L59 25 Q37 34 14 25Z" fill={gear === 'cutlass' ? '#312532' : '#202B3C'} stroke="#F0C67B" strokeWidth="1.5" />
          <Path d="M31 35 H32 M40 35 H41 M33 40 Q36 42 39 40" stroke="#4F342A" strokeLinecap="round" />
          <EncounterGear gear={gear} />
        </>
      )}
    </Svg>
  );
}

function EncounterGear({ gear }: { gear: Exclude<Encounter['gear'], 'crocodile'> }) {
  switch (gear) {
    case 'cutlass':
      return (
        <>
          <Path d="M54 60 Q68 49 69 34 Q62 47 51 55Z" fill="#DDE6E8" />
          <Path d="M47 61 L55 54 M46 54 L53 62" stroke="#E4B771" strokeWidth="2.8" />
        </>
      );
    case 'lantern':
      return (
        <>
          <Path d="M54 53 V50 Q58 44 62 50 V53" stroke="#F0C67B" strokeWidth="2" fill="none" />
          <Rect x="52" y="52" width="12" height="11" rx="2" fill="#F1BD67" stroke="#54443D" strokeWidth="2" />
        </>
      );
    case 'flag':
      return (
        <>
          <Path d="M53 65 V40" stroke="#E4B771" strokeWidth="2" />
          <Path d="M54 40 L68 43 L54 52Z" fill="#F3E5CB" />
          <Path d="M60 42 L66 44 L60 48Z" fill="#AD514B" />
        </>
      );
    case 'chart':
      return (
        <>
          <Rect x="50" y="49" width="16" height="13" rx="2" fill="#F6D49D" />
          <Path d="M52 58 L56 53 L60 57 L64 52" stroke="#9B6B63" strokeWidth="1.5" fill="none" />
        </>
      );
    case 'key':
      return (
        <>
          <Circle cx="59" cy="56" r="4" stroke="#E9B258" strokeWidth="2.4" fill="none" />
          <Path d="M56 59 L48 67 M51 63 L54 65" stroke="#E9B258" strokeWidth="2.4" />
        </>
      );
  }
}

const styles = StyleSheet.create({
  label: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  labelText: { color: '#F9F2DF' },
});
