import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useTabReselectHandlers } from '@/hooks/use-tab-reselect';
import { t } from '@/lib/i18n';

// Web version of the main navigation. Native (iOS/Android) uses app-tabs.tsx.
const TABS = [
  { name: 'index', href: '/', label: 'Home', icon: '🏠' },
  { name: 'learn', href: '/learn', label: 'Learn', icon: '📚' },
  { name: 'explore', href: '/explore', label: 'Find Partner', icon: '🤝' },
  { name: 'chats', href: '/chats', label: 'Chats', icon: '💬' },
  { name: 'community', href: '/community', label: 'Community', icon: '👥' },
  { name: 'profile', href: '/profile', label: 'Profile', icon: '👤' },
] as const;

export default function AppTabs() {
  const { styles } = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const compact = width < 680;
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <View style={{ ...styles.tabBar, paddingHorizontal: Math.max(8, (width - 720) / 2) }}>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton compact={compact} tab={tab.name} icon={tab.icon}>{tab.name === 'community' && width < 390 ? t("Feed") : t(tab.label)}</TabButton>
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  onPress,
  onLongPress,
  compact,
  tab,
  icon,
}: TabTriggerSlotProps & { compact: boolean; tab: string; icon: string }) {
  const { styles } = useThemedStyles(createStyles);
  const handlers = useTabReselectHandlers();
  return (
    <Pressable
      onPress={(event) => {
        if (isFocused) handlers?.get(tab)?.();
        else onPress?.(event);
      }}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tabButton,
        compact && styles.compactButton,
        isFocused && styles.tabButtonActive,
        pressed && styles.pressed,
      ]}
    >
      {compact ? <Text style={[styles.icon, !isFocused && styles.iconIdle]} aria-hidden>{icon}</Text> : null}
      <Text numberOfLines={1} style={[styles.tabLabel, compact && styles.compactLabel, isFocused && styles.tabLabelActive]}>
        {children}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  slot: { flex: 1, flexBasis: 0, minHeight: 0 },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    paddingTop: 6,
    // Keeps the bar above the iPhone home indicator (needs viewport-fit=cover).
    paddingBottom: 'max(6px, env(safe-area-inset-bottom))' as unknown as number,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  brand: {
    marginRight: 'auto',
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  compactButton: { flex: 1, minHeight: 48, paddingHorizontal: 0, paddingVertical: 4, alignItems: 'center', justifyContent: 'center', gap: 1 },
  compactLabel: { fontSize: 11 },
  icon: { fontSize: 20, lineHeight: 24 },
  iconIdle: { opacity: 0.55 },
  tabButtonActive: {
    backgroundColor: colors.primarySoft,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});
