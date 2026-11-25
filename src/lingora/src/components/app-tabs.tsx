import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { useColors } from '@/constants/theme';
import { useTabReselectHandlers } from '@/hooks/use-tab-reselect';
import { t } from '@/lib/i18n';

const items: { name: string; title: string; icon: SymbolViewProps['name'] }[] = [
  { name: 'index', title: 'Home', icon: { ios: 'house.fill', android: 'home' } },
  { name: 'learn', title: 'Learn', icon: { ios: 'book.fill', android: 'menu_book' } },
  { name: 'explore', title: 'Find Partner', icon: { ios: 'globe', android: 'public' } },
  { name: 'chats', title: 'Chats', icon: { ios: 'bubble.left.and.bubble.right.fill', android: 'forum' } },
  { name: 'community', title: 'Community', icon: { ios: 'person.3.fill', android: 'groups' } },
  { name: 'profile', title: 'Profile', icon: { ios: 'person.crop.circle.fill', android: 'account_circle' } },
];

export default function AppTabs() {
  const colors = useColors();
  const handlers = useTabReselectHandlers();
  const { width } = useWindowDimensions();
  return (
    <Tabs screenListeners={({ navigation, route }) => ({
      tabPress: () => {
        if (navigation.isFocused()) handlers?.get(route.name)?.();
      },
    })} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.borderSubtle },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      tabBarLabelPosition: 'below-icon',
      tabBarHideOnKeyboard: true,
    }}>
      {items.map(({ name, title, icon }) => (
        <Tabs.Screen key={name} name={name} options={{
          title: t(title),
          tabBarLabel: name === 'community' && width < 390 ? t("Feed") : t(title),
          tabBarIcon: ({ color, size }) => <SymbolView name={icon} tintColor={color} size={size} />,
        }} />
      ))}
    </Tabs>
  );
}
