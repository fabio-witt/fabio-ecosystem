import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

const TILE = 256;
const ZOOM = 10;
const HEIGHT = 170;

type Point = { lat: number; lon: number };

/**
 * Turns "city, country" into coordinates with OpenStreetMap Nominatim.
 * Only the place name people chose to show on their profile is sent,
 * never an exact address. Results are cached for the session.
 */
function useGeocode(place: string) {
  return useQuery({
    queryKey: ['geocode', place],
    enabled: place.length > 1,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<Point | null> => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`;
      const headers: Record<string, string> = { Accept: 'application/json' };
      // Browsers send their own User-Agent; the apps identify themselves.
      if (Platform.OS !== 'web') headers['User-Agent'] = 'GrammarBay/1.0 (language exchange app)';
      const response = await fetch(url, { headers });
      if (!response.ok) return null;
      const [first] = await response.json() as { lat: string; lon: string }[];
      return first ? { lat: Number(first.lat), lon: Number(first.lon) } : null;
    },
  });
}

/** World pixel position of a coordinate at the given zoom (Web Mercator). */
function toPixel({ lat, lon }: Point, zoom: number) {
  const scale = TILE * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function openMap(point: Point | null | undefined, place: string) {
  const url = point
    ? `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lon}#map=11/${point.lat}/${point.lon}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(place)}`;
  void Linking.openURL(url);
}

/** Small map of where someone lives, from the city and country on their profile. */
export function LocationMap({ city, country }: { city?: string | null; country?: string | null }) {
  const { colors, styles } = useThemedStyles(createStyles);
  const label = [city, country].map((part) => part?.trim()).filter(Boolean).join(', ');
  const geocode = useGeocode(label);
  const [width, setWidth] = useState(0);
  if (!label) return null;

  const point = geocode.data;
  const tiles: { key: string; uri: string; left: number; top: number }[] = [];
  if (point && width > 0) {
    const center = toPixel(point, ZOOM);
    const left = center.x - width / 2;
    const top = center.y - HEIGHT / 2;
    const max = 2 ** ZOOM;
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + width) / TILE); tx++) {
      for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + HEIGHT) / TILE); ty++) {
        if (ty < 0 || ty >= max) continue;
        const wrapped = ((tx % max) + max) % max;
        tiles.push({
          key: `${tx}-${ty}`,
          uri: `https://tile.openstreetmap.org/${ZOOM}/${wrapped}/${ty}.png`,
          left: tx * TILE - left,
          top: ty * TILE - top,
        });
      }
    }
  }

  return (
    <View style={styles.section}>
      <AppText variant="heading">{t('Lives in')}</AppText>
      <Pressable
        onPress={() => openMap(point, label)}
        accessibilityRole="link"
        accessibilityLabel={t('Map of {place}. Open in maps.', { place: label })}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.map} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
          {tiles.map((tile) => (
            <Image key={tile.key} source={{ uri: tile.uri }} accessible={false}
              style={[styles.tile, { left: tile.left, top: tile.top }]} />
          ))}
          {!point ? (
            <View style={styles.placeholder}>
              <AppText style={styles.globe} accessible={false}>🗺️</AppText>
              {geocode.isFetching ? <AppText variant="caption" color="textSecondary">{t('Loading map…')}</AppText> : null}
            </View>
          ) : (
            <View style={styles.pinWrap} pointerEvents="none">
              <View style={styles.pulse} />
              <AppText style={styles.pin} accessible={false}>📍</AppText>
            </View>
          )}
          <View style={styles.attribution} pointerEvents="none">
            <AppText style={styles.attributionText}>© OpenStreetMap</AppText>
          </View>
        </View>
        <View style={styles.footer}>
          <AppText variant="bodyStrong" style={styles.flex} numberOfLines={1}>📍 {label}</AppText>
          <AppText variant="caption" color="primary" style={{ color: colors.primary }}>{t('Open map ›')}</AppText>
        </View>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: spacing.sm, marginTop: spacing.lg },
  card: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.9 },
  map: { height: HEIGHT, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  tile: { position: 'absolute', width: TILE, height: TILE },
  placeholder: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  globe: { fontSize: 40, lineHeight: 48 },
  pinWrap: { position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, alignItems: 'center', justifyContent: 'center' },
  pulse: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(16,124,92,0.25)', borderWidth: 2, borderColor: 'rgba(16,124,92,0.6)',
  },
  pin: { position: 'absolute', fontSize: 34, lineHeight: 40, top: -38 },
  attribution: {
    position: 'absolute', right: 0, bottom: 0, paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.8)', borderTopLeftRadius: radius.sm,
  },
  attributionText: { fontSize: 10, color: '#333333' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
});
