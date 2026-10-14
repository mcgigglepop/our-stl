import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/CognitoContext';
import { Header } from '@/components/Header';
import { colors, sizes, typography } from '@/theme';

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <View style={styles.icon}>
      {focused && <View style={styles.indicator} />}
      <Text style={[styles.symbol, { opacity: focused ? 1 : 0.85 }]}>{symbol}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        header: () => <Header />,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: typography.tabLabel.fontSize,
          fontWeight: typography.tabLabel.fontWeight,
          marginBottom: 6,
        },
        tabBarStyle: {
          height: sizes.tabBarHeight,
          backgroundColor: colors.surface,
          borderTopColor: colors.tabBarBorder,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Community Feed',
          tabBarIcon: ({ focused }) => <TabIcon symbol="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="civic"
        options={{
          title: 'Civic Reporting',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rehab"
        options={{
          title: 'Rehab Help',
          tabBarIcon: ({ focused }) => <TabIcon symbol="💚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shelter"
        options={{
          title: 'Food & Shelter',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🏠" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  symbol: {
    fontSize: 22,
  },
  indicator: {
    position: 'absolute',
    top: -10,
    height: 3,
    width: 42,
    borderRadius: 5,
    backgroundColor: colors.teal,
  },
});
