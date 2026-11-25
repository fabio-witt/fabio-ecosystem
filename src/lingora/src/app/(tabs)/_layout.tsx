import AppTabs from '@/components/app-tabs';
import { TabReselectProvider } from '@/hooks/use-tab-reselect';
import { TopBrandBar, TopInsetProvider } from '@/components/top-brand-bar';
import { View } from 'react-native';

export default function TabsLayout() {
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
