import { Text, type TextProps } from 'react-native';

import { useColors, typography, type ColorName, type TypographyVariant } from '@/constants/theme';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: ColorName;
  align?: 'left' | 'center' | 'right';
};

/** Text with Lingora typography. Use instead of <Text> from react-native. */
export function AppText({
  variant = 'body',
  color = 'text',
  align,
  style,
  ...props
}: AppTextProps) {
  const colors = useColors();
  return (
    <Text
      {...props}
      style={[
        typography[variant],
        { color: colors[color] },
        align && { textAlign: align },
        style,
      ]}
    />
  );
}
