import { Redirect } from 'expo-router';
import { useSession } from '@/providers/session-provider';
import AppTabs from '@/components/app-tabs';
import { TabReselectProvider } from '@/hooks/use-tab-reselect';
import { TopBrandBar, TopInsetProvider } from '@/components/top-brand-bar';
import { View } from 'react-native';

export default function TabsLayout() {
  const { session } = useSession();
  // The root path always enters this layout, including when signed out.
  if (!session) return <Redirect href="/login" />;
  return (
    <TabReselectProvider>
      <View style={{ flex: 1 }}>
        <TopBrandBar />
        <TopInsetProvider value>
          <AppTabs />
        </TopInsetProvider>
      </View>
    </TabReselectProvider>
  );
}
