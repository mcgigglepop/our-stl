import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';

import { CognitoProvider } from '@/auth/CognitoContext';
import { colors, spacing, typography } from '@/theme';

const USER_POOL_ID = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? '';
const CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? '';
const REGION = process.env.EXPO_PUBLIC_AWS_REGION ?? 'us-east-1';

export default function RootLayout() {
  if (!USER_POOL_ID || !CLIENT_ID) {
    return (
      <SafeAreaProvider>
        <View style={styles.configError}>
          <Text style={[typography.h2, styles.title]}>Cognito not configured</Text>
          <Text style={[typography.body, styles.body]}>
            Set EXPO_PUBLIC_COGNITO_USER_POOL_ID and EXPO_PUBLIC_COGNITO_CLIENT_ID in app/.env.local,
            then restart the dev server.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <CognitoProvider userPoolId={USER_POOL_ID} clientId={CLIENT_ID} region={REGION}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.shellBackground } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </CognitoProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  configError: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.five,
    backgroundColor: colors.shellBackground,
  },
  title: {
    color: colors.navy,
    marginBottom: spacing.three,
  },
  body: {
    color: colors.muted,
  },
});
