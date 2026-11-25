import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { AppText } from '@/components/ui';

// Flat flag artwork, the same set GrammarFirst uses. Emoji flags render as
// plain letters on Windows and look different on every platform.
const flags: Record<string, string> = {
  id: '<svg viewBox="0 0 3 2"><path fill="#fff" d="M0 0h3v2H0z"/><path fill="#CE1126" d="M0 0h3v1H0z"/></svg>',
  nl: '<svg viewBox="0 0 9 6"><path fill="#21468B" d="M0 0h9v6H0z"/><path fill="#fff" d="M0 0h9v4H0z"/><path fill="#AE1C28" d="M0 0h9v2H0z"/></svg>',
  ua: '<svg viewBox="0 0 3 2"><path fill="#FFD700" d="M0 0h3v2H0z"/><path fill="#0057B7" d="M0 0h3v1H0z"/></svg>',
  jp: '<svg viewBox="0 0 3 2"><path fill="#fff" d="M0 0h3v2H0z"/><circle cx="1.5" cy="1" r=".6" fill="#BC002D"/></svg>',
  cn: '<svg viewBox="0 0 30 20"><path fill="#EE1C25" d="M0 0h30v20H0z"/><polygon fill="#FFFF00" points="5.000,2.000 5.674,4.073 7.853,4.073 6.090,5.354 6.763,7.427 5.000,6.146 3.237,7.427 3.910,5.354 2.147,4.073 4.326,4.073"/><polygon fill="#FFFF00" points="9.143,2.514 9.619,1.966 9.246,1.343 9.914,1.628 10.391,1.080 10.328,1.803 10.996,2.088 10.288,2.251 10.224,2.975 9.851,2.352"/><polygon fill="#FFFF00" points="11.010,4.141 11.662,3.821 11.560,3.102 12.065,3.624 12.718,3.304 12.378,3.946 12.884,4.467 12.168,4.343 11.829,4.985 11.726,4.266"/><polygon fill="#FFFF00" points="11.038,6.725 11.765,6.699 11.964,6.001 12.213,6.683 12.939,6.657 12.367,7.105 12.616,7.787 12.014,7.382 11.442,7.830 11.641,7.131"/><polygon fill="#FFFF00" points="9.219,8.375 9.899,8.632 10.353,8.064 10.319,8.790 10.999,9.046 10.298,9.239 10.265,9.964 9.865,9.357 9.165,9.550 9.618,8.982"/></svg>',
  tr: '<svg viewBox="0 0 30 20"><path fill="#E30A17" d="M0 0h30v20H0z"/><circle cx="11.25" cy="10" r="5" fill="#fff"/><circle cx="12.5" cy="10" r="4" fill="#E30A17"/><polygon fill="#fff" points="14.700,10.000 16.427,9.439 16.427,7.622 17.495,9.092 19.223,8.531 18.155,10.000 19.223,11.469 17.495,10.908 16.427,12.378 16.427,10.561"/></svg>',
  kr: '<svg viewBox="0 0 3 2"><path fill="#fff" d="M0 0h3v2H0z"/><g transform="rotate(33.69 1.5 1)"><circle cx="1.5" cy="1" r=".5" fill="#0047A0"/><path fill="#CD2E3A" d="M1 1a.5 .5 0 0 1 1 0a.25 .25 0 0 1-.5 0a.25 .25 0 0 0-.5 0z"/></g><g transform="translate(0.72 0.48) rotate(-56.31)" fill="#000"><rect x="-.125" y="-0.115" width=".25" height=".06"/><rect x="-.125" y="-0.030" width=".25" height=".06"/><rect x="-.125" y="0.055" width=".25" height=".06"/></g><g transform="translate(2.28 1.52) rotate(-56.31)" fill="#000"><rect x="-.125" y="-0.115" width=".11" height=".06"/><rect x=".015" y="-0.115" width=".11" height=".06"/><rect x="-.125" y="-0.030" width=".11" height=".06"/><rect x=".015" y="-0.030" width=".11" height=".06"/><rect x="-.125" y="0.055" width=".11" height=".06"/><rect x=".015" y="0.055" width=".11" height=".06"/></g><g transform="translate(2.28 0.48) rotate(56.31)" fill="#000"><rect x="-.125" y="-0.115" width=".11" height=".06"/><rect x=".015" y="-0.115" width=".11" height=".06"/><rect x="-.125" y="-0.030" width=".25" height=".06"/><rect x="-.125" y="0.055" width=".11" height=".06"/><rect x=".015" y="0.055" width=".11" height=".06"/></g><g transform="translate(0.72 1.52) rotate(56.31)" fill="#000"><rect x="-.125" y="-0.115" width=".25" height=".06"/><rect x="-.125" y="-0.030" width=".11" height=".06"/><rect x=".015" y="-0.030" width=".11" height=".06"/><rect x="-.125" y="0.055" width=".25" height=".06"/></g></svg>',
  sa: '<svg viewBox="0 0 3 2"><path fill="#006C35" d="M0 0h3v2H0z"/><g fill="#fff"><path d="M.75 1.42h1.35l.12.05-.12.05H.75z"/><rect x=".72" y="1.38" width=".05" height=".13"/><path d="M.8 .55h.06v.45H.8zM1 .6h.05v.4H1zM1.18 .5h.05v.5h-.05zM1.38 .62h.05v.38h-.05zM1.56 .55h.05v.45h-.05zM1.76 .6h.05v.4h-.05zM1.95 .5h.06v.5h-.06zM2.12 .62h.05v.38h-.05z"/><path d="M.8 .98h1.37v.05H.8z"/></g></svg>',
  de: '<svg viewBox="0 0 5 3"><path fill="#000" d="M0 0h5v1H0z"/><path fill="#D00" d="M0 1h5v1H0z"/><path fill="#FFCE00" d="M0 2h5v1H0z"/></svg>',
  at: '<svg viewBox="0 0 3 2"><path fill="#ED2939" d="M0 0h3v2H0z"/><path fill="#fff" d="M0 .667h3v.666H0z"/></svg>',
  ch: '<svg viewBox="0 0 32 32"><path fill="#D52B1E" d="M0 0h32v32H0z"/><path fill="#fff" d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z"/></svg>',
  gb: '<svg viewBox="0 0 60 30"><clipPath id="gbs"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="gbt"><path d="M30 15h30v15zv15H0zH0V0zV0h60z"/></clipPath><g clip-path="url(#gbs)"><path fill="#012169" d="M0 0v30h60V0z"/><path stroke="#fff" stroke-width="6" d="m0 0 60 30m0-30L0 30"/><path stroke="#C8102E" stroke-width="4" d="m0 0 60 30m0-30L0 30" clip-path="url(#gbt)"/><path stroke="#fff" stroke-width="10" d="M30 0v30M0 15h60"/><path stroke="#C8102E" stroke-width="6" d="M30 0v30M0 15h60"/></g></svg>',
  ie: '<svg viewBox="0 0 3 2"><path fill="#169B62" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#FF883E" d="M2 0h1v2H2z"/></svg>',
  ru: '<svg viewBox="0 0 3 2"><path fill="#fff" d="M0 0h3v2H0z"/><path fill="#0039A6" d="M0 .667h3v.666H0z"/><path fill="#D52B1E" d="M0 1.333h3V2H0z"/></svg>',
  pl: '<svg viewBox="0 0 8 5"><path fill="#fff" d="M0 0h8v2.5H0z"/><path fill="#DC143C" d="M0 2.5h8V5H0z"/></svg>',
  es: '<svg viewBox="0 0 3 2"><path fill="#AA151B" d="M0 0h3v2H0z"/><path fill="#F1BF00" d="M0 .5h3v1H0z"/></svg>',
  it: '<svg viewBox="0 0 3 2"><path fill="#009246" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#CE2B37" d="M2 0h1v2H2z"/></svg>',
  fr: '<svg viewBox="0 0 3 2"><path fill="#002395" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#ED2939" d="M2 0h1v2H2z"/></svg>',
  hr: '<svg viewBox="0 0 1200 600"><clipPath id="hrs"><path d="M530 165h140v100c0 46-32 78-70 90-38-12-70-44-70-90z"/></clipPath><path fill="#FF0000" d="M0 0h1200v200H0z"/><path fill="#fff" d="M0 200h1200v200H0z"/><path fill="#171796" d="M0 400h1200v200H0z"/><path fill="#fff" d="M530 165h140v100c0 46-32 78-70 90-38-12-70-44-70-90z"/><g clip-path="url(#hrs)"><path fill="#FF0000" d="M530 165h28v28h-28z"/><path fill="#FF0000" d="M586 165h28v28h-28z"/><path fill="#FF0000" d="M642 165h28v28h-28z"/><path fill="#FF0000" d="M558 193h28v28h-28z"/><path fill="#FF0000" d="M614 193h28v28h-28z"/><path fill="#FF0000" d="M530 221h28v28h-28z"/><path fill="#FF0000" d="M586 221h28v28h-28z"/><path fill="#FF0000" d="M642 221h28v28h-28z"/><path fill="#FF0000" d="M558 249h28v28h-28z"/><path fill="#FF0000" d="M614 249h28v28h-28z"/><path fill="#FF0000" d="M530 277h28v28h-28z"/><path fill="#FF0000" d="M586 277h28v28h-28z"/><path fill="#FF0000" d="M642 277h28v28h-28z"/><path fill="#FF0000" d="M558 305h28v28h-28z"/><path fill="#FF0000" d="M614 305h28v28h-28z"/><path fill="#FF0000" d="M530 333h28v28h-28z"/><path fill="#FF0000" d="M586 333h28v28h-28z"/><path fill="#FF0000" d="M642 333h28v28h-28z"/></g><path fill="none" stroke="#171796" stroke-width="6" d="M530 165h140v100c0 46-32 78-70 90-38-12-70-44-70-90z"/></svg>',
  pt: '<svg viewBox="0 0 3 2"><path fill="#046A38" d="M0 0h1.2v2H0z"/><path fill="#DA291C" d="M1.2 0H3v2H1.2z"/><circle cx="1.2" cy="1" r=".35" fill="#FFCD00"/></svg>',
};

/** Turns a flag emoji like 🇩🇪 into its country code, "de". */
function countryCode(emoji: string) {
  const letters = [...emoji.trim()].map((char) => char.codePointAt(0) ?? 0);
  if (letters.length !== 2 || letters.some((code) => code < 0x1f1e6 || code > 0x1f1ff)) return null;
  return letters.map((code) => String.fromCharCode(code - 0x1f1e6 + 97)).join('');
}

/**
 * A country flag drawn as artwork with rounded corners. Falls back to the
 * emoji itself for flags without artwork.
 */
export function Flag({ emoji, size = 28, style }: {
  emoji?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const code = emoji ? countryCode(emoji) : null;
  const xml = code ? flags[code] : undefined;
  const height = Math.round(size * 0.7);

  if (!xml) {
    return (
      <View accessible={false} style={style}>
        <AppText style={{ fontSize: height, lineHeight: Math.round(height * 1.25) }}>{emoji ?? '🌐'}</AppText>
      </View>
    );
  }

  return (
    <View
      accessible={false}
      style={[styles.frame, { width: size, height, borderRadius: Math.max(3, Math.round(size / 6)) }, style]}
    >
      <SvgXml
        xml={xml.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" ')}
        width={size}
        height={height}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.15)',
  },
});
