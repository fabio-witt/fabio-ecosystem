import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemedStyles, type ThemeColors } from '@/constants/theme';

import { t } from '@/lib/i18n';
import { DefaultAvatar } from '@/components/default-avatar';

type AvatarProps = {
  name?: string | null;
  uri?: string | null;
  size?: number;
};

/** Profile picture with a neutral person silhouette when there is no image (or it fails). */
export function Avatar({ name, uri, size = 48 }: AvatarProps) {
  const { styles } = useThemedStyles(createStyles);
  // Remember which URL failed, so a new URL gets a fresh attempt.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = !!uri && uri !== failedUri;
  const borderRadius = size * 0.36;

  return (
    <View
      style={[styles.container, { width: size, height: size, borderRadius }]}
      accessibilityRole="image"
      accessibilityLabel={name ? `Profile picture of ${name}` : t("Profile picture")}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onError={() => setFailedUri(uri)}
        />
      ) : (
        <DefaultAvatar size={size} />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
