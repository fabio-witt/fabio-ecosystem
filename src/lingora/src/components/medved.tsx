import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { useBob, useBreathe, usePop, useTrick, useWiggle } from '@/components/motion';
import { AppText } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useGame } from '@/features/game/store';
import { wardrobeItem } from '@/features/game/wardrobe';

const outfitStyles = StyleSheet.create({
  item: { position: 'absolute', left: 0, textAlign: 'center' },
});

export type MedvedMood = 'happy' | 'cheer' | 'sad';

const fur = '#9A6A43';
const furDark = '#7A5032';
const furLight = '#E9C9A3';
const nose = '#3B2A22';
const blush = '#F2A0A8';
const scarfDefault = '#6554C4';
const scarfDarkDefault = '#4B3D9E';

/**
 * Fabio, Lingora's bear mascot. Drawn in SVG so it scales without image
 * assets. He breathes, waves now and then, and jumps when cheering.
 */
export function Medved({ mood = 'happy', size = 96 }: { mood?: MedvedMood; size?: number }) {
  const { state: game } = useGame();
  const hat = wardrobeItem(game.equipped.hat);
  const glasses = wardrobeItem(game.equipped.glasses);
  const scarfColor = wardrobeItem(game.equipped.scarf)?.color;
  const breathe = useBreathe(mood !== 'sad');
  const jump = useBob(mood === 'cheer', 8, 350);
  const wiggle = useWiggle(mood === 'happy');
  const trick = useTrick();
  // While a trick plays he smiles widely, even if he was sad before.
  const [playing, setPlaying] = useState(false);
  const shown = playing ? 'cheer' : mood;

  function poke() {
    trick.play();
    setPlaying(true);
    setTimeout(() => setPlaying(false), 900);
  }

  return (
    <Pressable
      onPress={poke}
      accessibilityRole="button"
      accessibilityLabel={t("Fabio the bear. Tap him to see a trick.")}
      hitSlop={8}
    >
      <Animated.View style={[{ width: size, height: size }, jump]}>
        <Animated.View style={trick.style}>
          <Animated.View style={wiggle}>
            <Animated.View style={breathe}>
              <MedvedArt cheer={shown === 'cheer'} sad={shown === 'sad'} size={size} scarfColor={scarfColor} />
              {glasses ? (
                <AppText accessible={false} style={[outfitStyles.item, { top: size * 0.22, fontSize: size * 0.3, lineHeight: size * 0.36, width: size }]}>
                  {glasses.icon}
                </AppText>
              ) : null}
              {hat ? (
                <AppText accessible={false} style={[outfitStyles.item, { top: -size * 0.2, fontSize: size * 0.34, lineHeight: size * 0.42, width: size }]}>
                  {hat.icon}
                </AppText>
              ) : null}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function MedvedArt({ cheer, sad, size, scarfColor }: { cheer: boolean; sad: boolean; size: number; scarfColor?: string }) {
  const scarf = scarfColor ?? scarfDefault;
  const scarfDark = scarfColor ?? scarfDarkDefault;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel={t("Fabio the bear")}>
      {/* Body */}
      <Ellipse cx="60" cy="98" rx="30" ry="20" fill={fur} />
      <Ellipse cx="60" cy="102" rx="18" ry="13" fill={furLight} />
      {/* Arms: raised when cheering */}
      {cheer ? (
        <G>
          <Ellipse cx="24" cy="70" rx="9" ry="15" fill={fur} transform="rotate(-35 24 70)" />
          <Ellipse cx="96" cy="70" rx="9" ry="15" fill={fur} transform="rotate(35 96 70)" />
          <Circle cx="18" cy="60" r="7" fill={furDark} />
          <Circle cx="102" cy="60" r="7" fill={furDark} />
        </G>
      ) : (
        <G>
          <Ellipse cx="34" cy="98" rx="9" ry="12" fill={furDark} />
          <Ellipse cx="86" cy="98" rx="9" ry="12" fill={furDark} />
        </G>
      )}
      {/* Scarf */}
      <Path d="M32 78 Q60 90 88 78 L88 86 Q60 98 32 86 Z" fill={scarf} />
      <Path d="M74 86 L81 102 L71 102 L68 88 Z" fill={scarfDark} />
      {/* Ears */}
      <Circle cx="30" cy="24" r="13" fill={fur} />
      <Circle cx="90" cy="24" r="13" fill={fur} />
      <Circle cx="30" cy="24" r="7" fill={furLight} />
      <Circle cx="90" cy="24" r="7" fill={furLight} />
      {/* Head */}
      <Ellipse cx="60" cy="48" rx="36" ry="33" fill={fur} />
      {/* Muzzle */}
      <Ellipse cx="60" cy="60" rx="17" ry="13" fill={furLight} />
      <Ellipse cx="60" cy="53" rx="7" ry="5" fill={nose} />
      <Ellipse cx="58" cy="51.5" rx="2" ry="1.2" fill="#FFFFFF" opacity={0.6} />
      {/* Eyes */}
      {cheer ? (
        <G>
          <Path d="M38 44 Q44 37 50 44" stroke={nose} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <Path d="M70 44 Q76 37 82 44" stroke={nose} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </G>
      ) : (
        <G>
          <Circle cx="44" cy="43" r="5" fill={nose} />
          <Circle cx="76" cy="43" r="5" fill={nose} />
          <Circle cx="45.6" cy="41.4" r="1.6" fill="#FFFFFF" />
          <Circle cx="77.6" cy="41.4" r="1.6" fill="#FFFFFF" />
          {sad ? (
            <G>
              <Path d="M37 35 L49 32" stroke={furDark} strokeWidth="3" strokeLinecap="round" />
              <Path d="M83 35 L71 32" stroke={furDark} strokeWidth="3" strokeLinecap="round" />
            </G>
          ) : null}
        </G>
      )}
      {/* Cheeks */}
      <Ellipse cx="36" cy="56" rx="6" ry="3.5" fill={blush} opacity={0.75} />
      <Ellipse cx="84" cy="56" rx="6" ry="3.5" fill={blush} opacity={0.75} />
      {/* Mouth */}
      {sad ? (
        <Path d="M53 67 Q60 62 67 67" stroke={nose} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      ) : cheer ? (
        <Path d="M51 61 Q60 74 69 61 Z" fill={nose} />
      ) : (
        <Path d="M52 62 Q56 67 60 62 Q64 67 68 62" stroke={nose} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}
    </Svg>
  );
}

/** Fabio with a speech bubble, used for greetings and feedback. */
export function MedvedSays({ message, mood = 'happy', size = 84 }: {
  message: string;
  mood?: MedvedMood;
  size?: number;
}) {
  const { styles } = useThemedStyles(createStyles);
  const pop = usePop(message);
  return (
    <View style={styles.row}>
      <Medved mood={mood} size={size} />
      <Animated.View style={[styles.bubble, pop]} accessible accessibilityLabel={t('Fabio says: {message}', { message })}>
        <View style={styles.tail} />
        <AppText variant="bodyStrong">{message}</AppText>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bubble: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  tail: {
    position: 'absolute',
    left: -7,
    top: '50%',
    marginTop: -7,
    width: 14,
    height: 14,
    transform: [{ rotate: '45deg' }],
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
});
